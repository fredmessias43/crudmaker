<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de PlayerInvite (rotas player-invites.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Game;
use App\Models\Player;
use App\Models\PlayerInvite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de PlayerInvite, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function playerInvitePayload(array $overrides = []): array
{
	$model = PlayerInvite::factory()->make();

	return array_merge([
		'player_id' => $model->player_id,
		'game_id' => $model->game_id,
		'status' => $model->status?->value,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = PlayerInvite::count();
	PlayerInvite::factory()->count(3)->create();

	$this->getJson(route('player-invites.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = PlayerInvite::count();
	$payload = playerInvitePayload();

	$this->postJson(route('player-invites.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(PlayerInvite::count())->toBe($before + 1);
	$this->assertDatabaseHas('player_invites', [
		'player_id' => $payload['player_id'],
		'game_id' => $payload['game_id'],
		'status' => $payload['status'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('player-invites.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['player_id', 'game_id', 'status']);
});

test('show: devolve o registro', function () {
	$record = PlayerInvite::factory()->create();

	$this->getJson(route('player-invites.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('player-invites.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = PlayerInvite::factory()->create();
	$payload = playerInvitePayload();

	$this->putJson(route('player-invites.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('player_invites', [
		'id' => $record->id,
		'player_id' => $payload['player_id'],
		'game_id' => $payload['game_id'],
		'status' => $payload['status'],
	]);
});

test('destroy: remove o registro', function () {
	$record = PlayerInvite::factory()->create();

	$this->deleteJson(route('player-invites.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET games/{game}/player-invites: lista só os registros do Game da URL', function () {
	$parent = Game::factory()->create();
	PlayerInvite::factory()->count(2)->create(['game_id' => $parent->getKey()]);
	PlayerInvite::factory()->create();

	$this->getJson(route('games.player-invites.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST games/{game}/player-invites: cria o registro para o Game da URL e ignora a chave do corpo', function () {
	$parent = Game::factory()->create();
	$payload = Arr::except(playerInvitePayload(), ['game_id']);

	$this->postJson(route('games.player-invites.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('player_invites', [
		'game_id' => $parent->getKey(),
		'player_id' => $payload['player_id'],
		'status' => $payload['status'],
	]);
});

test('GET players/{player}/player-invites: lista só os registros do Player da URL', function () {
	$parent = Player::factory()->create();
	PlayerInvite::factory()->count(2)->create(['player_id' => $parent->getKey()]);
	PlayerInvite::factory()->create();

	$this->getJson(route('players.player-invites.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST players/{player}/player-invites: cria o registro para o Player da URL e ignora a chave do corpo', function () {
	$parent = Player::factory()->create();
	$payload = Arr::except(playerInvitePayload(), ['player_id']);

	$this->postJson(route('players.player-invites.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('player_invites', [
		'player_id' => $parent->getKey(),
		'game_id' => $payload['game_id'],
		'status' => $payload['status'],
	]);
});
