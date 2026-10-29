<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Player (rotas players.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Player;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Player, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function playerPayload(array $overrides = []): array
{
	$model = Player::factory()->make();

	return array_merge([
		'name' => $model->name,
		'email' => $model->email,
		'game_id' => $model->game_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Player::count();
	Player::factory()->count(3)->create();

	$this->getJson(route('players.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Player::count();
	$payload = playerPayload();

	$this->postJson(route('players.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Player::count())->toBe($before + 1);
	$this->assertDatabaseHas('players', [
		'name' => $payload['name'],
		'email' => $payload['email'],
		'game_id' => $payload['game_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('players.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['name', 'email', 'game_id']);
});

test('show: devolve o registro', function () {
	$record = Player::factory()->create();

	$this->getJson(route('players.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('players.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Player::factory()->create();
	$payload = playerPayload();

	$this->putJson(route('players.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('players', [
		'id' => $record->id,
		'name' => $payload['name'],
		'email' => $payload['email'],
		'game_id' => $payload['game_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Player::factory()->create();

	$this->deleteJson(route('players.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
