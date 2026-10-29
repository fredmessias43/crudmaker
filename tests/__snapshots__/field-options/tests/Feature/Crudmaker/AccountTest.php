<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Account (rotas accounts.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Account;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Account, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function accountPayload(array $overrides = []): array
{
	$model = Account::factory()->make();

	return array_merge([
		'password' => $model->password,
		'email' => $model->email,
		'nickname' => $model->nickname,
		'bio' => $model->bio,
		'owner_ref' => $model->owner_ref,
		'status' => $model->status?->value,
		'plan' => $model->plan?->value,
		'age' => $model->age,
		'credit' => $model->credit,
		'score' => $model->score,
		'active' => $model->active,
		'newsletter' => $model->newsletter,
		'birthday' => $model->birthday?->format('Y-m-d'),
		'last_seen' => $model->last_seen?->format('Y-m-d H:i'),
		'settings' => $model->settings ?: ['crudmaker' => true],
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Account::count();
	Account::factory()->count(3)->create();

	$this->getJson(route('accounts.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Account::count();
	$payload = accountPayload();

	$this->postJson(route('accounts.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonMissingPath('data.password')
		->assertJsonPath('status', 201);

	expect(Account::count())->toBe($before + 1);
	$this->assertDatabaseHas('accounts', [
		'email' => $payload['email'],
		'nickname' => $payload['nickname'],
		'bio' => $payload['bio'],
		'owner_ref' => $payload['owner_ref'],
		'status' => $payload['status'],
		'plan' => $payload['plan'],
		'age' => $payload['age'],
		'score' => $payload['score'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('accounts.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['password', 'email', 'bio', 'owner_ref', 'status', 'plan', 'age', 'credit', 'score', 'active', 'newsletter', 'birthday', 'last_seen', 'settings']);
});

test('store: rejeita email já usado com 422', function () {
	$existing = Account::factory()->create();

	$this->postJson(route('accounts.store'), accountPayload(['email' => $existing->email]))
		->assertUnprocessable()
		->assertJsonValidationErrors(['email']);
});

test('show: devolve o registro', function () {
	$record = Account::factory()->create();

	$this->getJson(route('accounts.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonMissingPath('data.password')
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('accounts.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Account::factory()->create();
	$payload = accountPayload();

	$this->putJson(route('accounts.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('accounts', [
		'id' => $record->id,
		'email' => $payload['email'],
		'nickname' => $payload['nickname'],
		'bio' => $payload['bio'],
		'owner_ref' => $payload['owner_ref'],
		'status' => $payload['status'],
		'plan' => $payload['plan'],
		'age' => $payload['age'],
		'score' => $payload['score'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Account::factory()->create();

	$this->deleteJson(route('accounts.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
