<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Game (rotas games.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Game, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function gamePayload(array $overrides = []): array
{
	$model = Game::factory()->make();

	return array_merge([
		'name' => $model->name,
		'description' => $model->description,
		'max_players' => $model->max_players,
		'document' => $model->document,
		'status' => $model->status?->value,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Game::count();
	Game::factory()->count(3)->create();

	$this->getJson(route('games.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Game::count();
	$payload = gamePayload();

	$this->postJson(route('games.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Game::count())->toBe($before + 1);
	$this->assertDatabaseHas('games', [
		'name' => $payload['name'],
		'description' => $payload['description'],
		'max_players' => $payload['max_players'],
		'document' => $payload['document'],
		'status' => $payload['status'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('games.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['name', 'description', 'max_players', 'document', 'status']);
});

test('show: devolve o registro', function () {
	$record = Game::factory()->create();

	$this->getJson(route('games.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('games.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Game::factory()->create();
	$payload = gamePayload();

	$this->putJson(route('games.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('games', [
		'id' => $record->id,
		'name' => $payload['name'],
		'description' => $payload['description'],
		'max_players' => $payload['max_players'],
		'document' => $payload['document'],
		'status' => $payload['status'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Game::factory()->create();

	$this->deleteJson(route('games.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
