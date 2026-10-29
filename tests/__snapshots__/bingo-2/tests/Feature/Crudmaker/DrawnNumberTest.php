<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de DrawnNumber (rotas drawn-numbers.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\DrawnNumber;
use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de DrawnNumber, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function drawnNumberPayload(array $overrides = []): array
{
	$model = DrawnNumber::factory()->make();

	return array_merge([
		'game_id' => $model->game_id,
		'number' => $model->number,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = DrawnNumber::count();
	DrawnNumber::factory()->count(3)->create();

	$this->getJson(route('drawn-numbers.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = DrawnNumber::count();
	$payload = drawnNumberPayload();

	$this->postJson(route('drawn-numbers.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(DrawnNumber::count())->toBe($before + 1);
	$this->assertDatabaseHas('drawn_numbers', [
		'game_id' => $payload['game_id'],
		'number' => $payload['number'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('drawn-numbers.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['game_id', 'number']);
});

test('show: devolve o registro', function () {
	$record = DrawnNumber::factory()->create();

	$this->getJson(route('drawn-numbers.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('drawn-numbers.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = DrawnNumber::factory()->create();
	$payload = drawnNumberPayload();

	$this->putJson(route('drawn-numbers.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('drawn_numbers', [
		'id' => $record->id,
		'game_id' => $payload['game_id'],
		'number' => $payload['number'],
	]);
});

test('destroy: remove o registro', function () {
	$record = DrawnNumber::factory()->create();

	$this->deleteJson(route('drawn-numbers.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET games/{game}/drawn-numbers: lista só os registros do Game da URL', function () {
	$parent = Game::factory()->create();
	DrawnNumber::factory()->count(2)->create(['game_id' => $parent->getKey()]);
	DrawnNumber::factory()->create();

	$this->getJson(route('games.drawn-numbers.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST games/{game}/drawn-numbers: cria o registro para o Game da URL e ignora a chave do corpo', function () {
	$parent = Game::factory()->create();
	$payload = Arr::except(drawnNumberPayload(), ['game_id']);

	$this->postJson(route('games.drawn-numbers.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('drawn_numbers', [
		'game_id' => $parent->getKey(),
		'number' => $payload['number'],
	]);
});
