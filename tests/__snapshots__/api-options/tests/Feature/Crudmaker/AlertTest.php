<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Alert (rotas alerts.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.
// Middleware da entidade: auth:sanctum, throttle:60,1. Os testes autenticam um App\Models\User criado pela factory.

use App\Models\Alert;
use App\Models\Client;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Autentica um usuário da factory padrão do Laravel, como o middleware da entidade pede.
 */
function alertSignIn(): User
{
	$user = User::factory()->create();
	test()->actingAs($user, 'sanctum');

	return $user;
}

/**
 * Corpo válido para store/update de Alert, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function alertPayload(array $overrides = []): array
{
	$model = Alert::factory()->make();

	return array_merge([
		'title' => $model->title,
		'client_id' => $model->client_id,
	], $overrides);
}

test('exige autenticação', function () {
	$this->getJson(route('alerts.index'))->assertUnauthorized();
});

test('index: lista os registros paginados', function () {
	alertSignIn();
	$before = Alert::count();
	Alert::factory()->count(3)->create();

	$this->getJson(route('alerts.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 25);
});

test('store: cria o registro com dados válidos', function () {
	alertSignIn();
	$before = Alert::count();
	$payload = alertPayload();

	$this->postJson(route('alerts.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Alert::count())->toBe($before + 1);
	$this->assertDatabaseHas('alerts', [
		'title' => $payload['title'],
		'client_id' => $payload['client_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {
	alertSignIn();

	$this->postJson(route('alerts.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['title', 'client_id']);
});

test('show: devolve o registro', function () {
	alertSignIn();
	$record = Alert::factory()->create();

	$this->getJson(route('alerts.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {
	alertSignIn();

	$this->getJson(route('alerts.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	alertSignIn();
	$record = Alert::factory()->create();
	$payload = alertPayload();

	$this->putJson(route('alerts.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('alerts', [
		'id' => $record->id,
		'title' => $payload['title'],
		'client_id' => $payload['client_id'],
	]);
});

test('destroy: remove o registro', function () {
	alertSignIn();
	$record = Alert::factory()->create();

	$this->deleteJson(route('alerts.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET clients/{client}/alerts: lista só os registros do Client da URL', function () {
	alertSignIn();
	$parent = Client::factory()->create();
	Alert::factory()->count(2)->create(['client_id' => $parent->getKey()]);
	Alert::factory()->create();

	$this->getJson(route('clients.alerts.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST clients/{client}/alerts: cria o registro para o Client da URL e ignora a chave do corpo', function () {
	alertSignIn();
	$parent = Client::factory()->create();
	$payload = Arr::except(alertPayload(), ['client_id']);

	$this->postJson(route('clients.alerts.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('alerts', [
		'client_id' => $parent->getKey(),
		'title' => $payload['title'],
	]);
});
