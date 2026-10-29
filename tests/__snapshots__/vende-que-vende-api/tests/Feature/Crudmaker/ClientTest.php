<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Client (rotas clients.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Client, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function clientPayload(array $overrides = []): array
{
	$model = Client::factory()->make();

	return array_merge([
		'name' => $model->name,
		'email' => $model->email,
		'phone' => $model->phone,
		'document' => $model->document,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Client::count();
	Client::factory()->count(3)->create();

	$this->getJson(route('clients.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Client::count();
	$payload = clientPayload();

	$this->postJson(route('clients.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Client::count())->toBe($before + 1);
	$this->assertDatabaseHas('clients', [
		'name' => $payload['name'],
		'email' => $payload['email'],
		'phone' => $payload['phone'],
		'document' => $payload['document'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('clients.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['name', 'email', 'phone', 'document']);
});

test('show: devolve o registro', function () {
	$record = Client::factory()->create();

	$this->getJson(route('clients.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('clients.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Client::factory()->create();
	$payload = clientPayload();

	$this->putJson(route('clients.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('clients', [
		'id' => $record->id,
		'name' => $payload['name'],
		'email' => $payload['email'],
		'phone' => $payload['phone'],
		'document' => $payload['document'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Client::factory()->create();

	$this->deleteJson(route('clients.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
