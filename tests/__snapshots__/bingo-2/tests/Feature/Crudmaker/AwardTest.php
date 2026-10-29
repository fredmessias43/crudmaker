<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Award (rotas awards.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Award;
use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Award, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function awardPayload(array $overrides = []): array
{
	$model = Award::factory()->make();

	return array_merge([
		'game_id' => $model->game_id,
		'name' => $model->name,
		'description' => $model->description,
		'image_url' => $model->image_url,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Award::count();
	Award::factory()->count(3)->create();

	$this->getJson(route('awards.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Award::count();
	$payload = awardPayload();

	$this->postJson(route('awards.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Award::count())->toBe($before + 1);
	$this->assertDatabaseHas('awards', [
		'game_id' => $payload['game_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'image_url' => $payload['image_url'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('awards.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['game_id', 'name', 'description', 'image_url']);
});

test('show: devolve o registro', function () {
	$record = Award::factory()->create();

	$this->getJson(route('awards.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('awards.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Award::factory()->create();
	$payload = awardPayload();

	$this->putJson(route('awards.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('awards', [
		'id' => $record->id,
		'game_id' => $payload['game_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'image_url' => $payload['image_url'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Award::factory()->create();

	$this->deleteJson(route('awards.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET games/{game}/awards: lista só os registros do Game da URL', function () {
	$parent = Game::factory()->create();
	Award::factory()->count(2)->create(['game_id' => $parent->getKey()]);
	Award::factory()->create();

	$this->getJson(route('games.awards.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST games/{game}/awards: cria o registro para o Game da URL e ignora a chave do corpo', function () {
	$parent = Game::factory()->create();
	$payload = Arr::except(awardPayload(), ['game_id']);

	$this->postJson(route('games.awards.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('awards', [
		'game_id' => $parent->getKey(),
		'name' => $payload['name'],
		'description' => $payload['description'],
		'image_url' => $payload['image_url'],
	]);
});
