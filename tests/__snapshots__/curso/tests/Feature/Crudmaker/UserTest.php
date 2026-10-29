<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de User (rotas users.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de User, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function userPayload(array $overrides = []): array
{
	$model = User::factory()->make();

	return array_merge([
		'name' => $model->name,
		'email' => $model->email,
		'password' => $model->password,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = User::count();
	User::factory()->count(3)->create();

	$this->getJson(route('users.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = User::count();
	$payload = userPayload();

	$this->postJson(route('users.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(User::count())->toBe($before + 1);
	$this->assertDatabaseHas('users', [
		'name' => $payload['name'],
		'email' => $payload['email'],
		'password' => $payload['password'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('users.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('show: devolve o registro', function () {
	$record = User::factory()->create();

	$this->getJson(route('users.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('users.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = User::factory()->create();
	$payload = userPayload();

	$this->putJson(route('users.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('users', [
		'id' => $record->id,
		'name' => $payload['name'],
		'email' => $payload['email'],
		'password' => $payload['password'],
	]);
});

test('destroy: remove o registro', function () {
	$record = User::factory()->create();

	$this->deleteJson(route('users.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
