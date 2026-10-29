<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Order (rotas orders.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Order, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function orderPayload(array $overrides = []): array
{
	$model = Order::factory()->make();

	return array_merge([
		'number' => $model->number,
		'user_id' => $model->user_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Order::count();
	Order::factory()->count(3)->create();

	$this->getJson(route('orders.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Order::count();
	$payload = orderPayload();

	$this->postJson(route('orders.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Order::count())->toBe($before + 1);
	$this->assertDatabaseHas('orders', [
		'number' => $payload['number'],
		'user_id' => $payload['user_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('orders.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['number', 'user_id']);
});

test('store: rejeita number já usado com 422', function () {
	$existing = Order::factory()->create();

	$this->postJson(route('orders.store'), orderPayload(['number' => $existing->number]))
		->assertUnprocessable()
		->assertJsonValidationErrors(['number']);
});

test('show: devolve o registro', function () {
	$record = Order::factory()->create();

	$this->getJson(route('orders.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('orders.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Order::factory()->create();
	$payload = orderPayload();

	$this->putJson(route('orders.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('orders', [
		'id' => $record->id,
		'number' => $payload['number'],
		'user_id' => $payload['user_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Order::factory()->create();

	$this->deleteJson(route('orders.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET users/{user}/order-by-user: mostra o registro do User da URL', function () {
	$parent = User::factory()->create();
	$record = Order::factory()->create(['user_id' => $parent->getKey()]);

	$this->getJson(route('users.order-by-user.show', $parent))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('GET users/{user}/order-by-user: devolve 404 quando o User ainda não tem registro', function () {
	$parent = User::factory()->create();

	$this->getJson(route('users.order-by-user.show', $parent))->assertNotFound();
});

test('POST users/{user}/order-by-user: cria o registro para o User da URL e ignora a chave do corpo', function () {
	$parent = User::factory()->create();
	$payload = Arr::except(orderPayload(), ['user_id']);

	$this->postJson(route('users.order-by-user.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('orders', [
		'user_id' => $parent->getKey(),
		'number' => $payload['number'],
	]);
});

test('POST users/{user}/order-by-user: devolve 409 quando o User já tem registro', function () {
	$parent = User::factory()->create();
	Order::factory()->create(['user_id' => $parent->getKey()]);

	$this->postJson(route('users.order-by-user.store', $parent), Arr::except(orderPayload(), ['user_id']))
		->assertStatus(409);
});

test('GET users/{user}/orders: lista só os registros do User da URL', function () {
	$parent = User::factory()->create();
	Order::factory()->count(2)->create(['user_id' => $parent->getKey()]);
	Order::factory()->create();

	$this->getJson(route('users.orders.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST users/{user}/orders: cria o registro para o User da URL e ignora a chave do corpo', function () {
	$parent = User::factory()->create();
	$payload = Arr::except(orderPayload(), ['user_id']);

	$this->postJson(route('users.orders.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('orders', [
		'user_id' => $parent->getKey(),
		'number' => $payload['number'],
	]);
});
