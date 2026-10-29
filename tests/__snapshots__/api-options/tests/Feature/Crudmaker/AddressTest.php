<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Address (rotas addresses.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.
// Middleware da entidade: auth:sanctum. Os testes autenticam um App\Models\User criado pela factory.

use App\Models\Address;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Autentica um usuário da factory padrão do Laravel, como o middleware da entidade pede.
 */
function addressSignIn(): User
{
	$user = User::factory()->create();
	test()->actingAs($user, 'sanctum');

	return $user;
}

/**
 * Corpo válido para store/update de Address, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function addressPayload(array $overrides = []): array
{
	$model = Address::factory()->make();

	return array_merge([
		'city' => $model->city,
		'client_id' => $model->client_id,
	], $overrides);
}

test('exige autenticação', function () {
	$this->getJson(route('addresses.index'))->assertUnauthorized();
});

test('index: lista os registros paginados', function () {
	addressSignIn();
	$before = Address::count();
	Address::factory()->count(3)->create();

	$this->getJson(route('addresses.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 25);
});

test('store: cria o registro com dados válidos', function () {
	addressSignIn();
	$before = Address::count();
	$payload = addressPayload();

	$this->postJson(route('addresses.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Address::count())->toBe($before + 1);
	$this->assertDatabaseHas('addresses', [
		'city' => $payload['city'],
		'client_id' => $payload['client_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {
	addressSignIn();

	$this->postJson(route('addresses.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['city', 'client_id']);
});

test('show: devolve o registro', function () {
	addressSignIn();
	$record = Address::factory()->create();

	$this->getJson(route('addresses.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {
	addressSignIn();

	$this->getJson(route('addresses.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	addressSignIn();
	$record = Address::factory()->create();
	$payload = addressPayload();

	$this->putJson(route('addresses.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('addresses', [
		'id' => $record->id,
		'city' => $payload['city'],
		'client_id' => $payload['client_id'],
	]);
});

test('destroy: remove o registro', function () {
	addressSignIn();
	$record = Address::factory()->create();

	$this->deleteJson(route('addresses.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET clients/{client}/address: mostra o registro do Client da URL', function () {
	addressSignIn();
	$parent = Client::factory()->create();
	$record = Address::factory()->create(['client_id' => $parent->getKey()]);

	$this->getJson(route('clients.address.show', $parent))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('GET clients/{client}/address: devolve 404 quando o Client ainda não tem registro', function () {
	addressSignIn();
	$parent = Client::factory()->create();

	$this->getJson(route('clients.address.show', $parent))->assertNotFound();
});

test('POST clients/{client}/address: cria o registro para o Client da URL e ignora a chave do corpo', function () {
	addressSignIn();
	$parent = Client::factory()->create();
	$payload = Arr::except(addressPayload(), ['client_id']);

	$this->postJson(route('clients.address.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('addresses', [
		'client_id' => $parent->getKey(),
		'city' => $payload['city'],
	]);
});

test('POST clients/{client}/address: devolve 409 quando o Client já tem registro', function () {
	addressSignIn();
	$parent = Client::factory()->create();
	Address::factory()->create(['client_id' => $parent->getKey()]);

	$this->postJson(route('clients.address.store', $parent), Arr::except(addressPayload(), ['client_id']))
		->assertStatus(409);
});
