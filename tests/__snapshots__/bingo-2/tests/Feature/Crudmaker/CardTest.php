<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Card (rotas cards.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Card;
use App\Models\Game;
use App\Models\Player;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Card, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function cardPayload(array $overrides = []): array
{
	$model = Card::factory()->make();

	return array_merge([
		'game_id' => $model->game_id,
		'player_id' => $model->player_id,
		'numbers' => $model->numbers ?: ['crudmaker' => true],
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Card::count();
	Card::factory()->count(3)->create();

	$this->getJson(route('cards.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Card::count();
	$payload = cardPayload();

	$this->postJson(route('cards.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Card::count())->toBe($before + 1);
	$this->assertDatabaseHas('cards', [
		'game_id' => $payload['game_id'],
		'player_id' => $payload['player_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('cards.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['game_id', 'player_id', 'numbers']);
});

test('show: devolve o registro', function () {
	$record = Card::factory()->create();

	$this->getJson(route('cards.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('cards.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Card::factory()->create();
	$payload = cardPayload();

	$this->putJson(route('cards.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('cards', [
		'id' => $record->id,
		'game_id' => $payload['game_id'],
		'player_id' => $payload['player_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Card::factory()->create();

	$this->deleteJson(route('cards.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET games/{game}/cards: lista só os registros do Game da URL', function () {
	$parent = Game::factory()->create();
	Card::factory()->count(2)->create(['game_id' => $parent->getKey()]);
	Card::factory()->create();

	$this->getJson(route('games.cards.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST games/{game}/cards: cria o registro para o Game da URL e ignora a chave do corpo', function () {
	$parent = Game::factory()->create();
	$payload = Arr::except(cardPayload(), ['game_id']);

	$this->postJson(route('games.cards.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('cards', [
		'game_id' => $parent->getKey(),
		'player_id' => $payload['player_id'],
	]);
});

test('GET players/{player}/cards: lista só os registros do Player da URL', function () {
	$parent = Player::factory()->create();
	Card::factory()->count(2)->create(['player_id' => $parent->getKey()]);
	Card::factory()->create();

	$this->getJson(route('players.cards.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST players/{player}/cards: cria o registro para o Player da URL e ignora a chave do corpo', function () {
	$parent = Player::factory()->create();
	$payload = Arr::except(cardPayload(), ['player_id']);

	$this->postJson(route('players.cards.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('cards', [
		'player_id' => $parent->getKey(),
		'game_id' => $payload['game_id'],
	]);
});
