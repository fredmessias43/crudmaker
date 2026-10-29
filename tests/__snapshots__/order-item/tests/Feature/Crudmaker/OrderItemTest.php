<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de OrderItem (rotas order-items.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de OrderItem, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function orderItemPayload(array $overrides = []): array
{
	$model = OrderItem::factory()->make();

	return array_merge([
		'sku' => $model->sku,
		'quantity' => $model->quantity,
		'price' => $model->price,
		'gift' => $model->gift,
		'options' => $model->options ?: ['crudmaker' => true],
		'shipped_on' => $model->shipped_on?->format('Y-m-d'),
		'packed_at' => $model->packed_at?->format('Y-m-d H:i'),
		'status' => $model->status?->value,
		'order_id' => $model->order_id,
		'author_id' => $model->author_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = OrderItem::count();
	OrderItem::factory()->count(3)->create();

	$this->getJson(route('order-items.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = OrderItem::count();
	$payload = orderItemPayload();

	$this->postJson(route('order-items.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(OrderItem::count())->toBe($before + 1);
	$this->assertDatabaseHas('order_items', [
		'sku' => $payload['sku'],
		'quantity' => $payload['quantity'],
		'status' => $payload['status'],
		'order_id' => $payload['order_id'],
		'author_id' => $payload['author_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('order-items.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['sku', 'quantity', 'price', 'gift', 'status', 'order_id', 'author_id']);
});

test('store: rejeita sku já usado com 422', function () {
	$existing = OrderItem::factory()->create();

	$this->postJson(route('order-items.store'), orderItemPayload(['sku' => $existing->sku]))
		->assertUnprocessable()
		->assertJsonValidationErrors(['sku']);
});

test('show: devolve o registro', function () {
	$record = OrderItem::factory()->create();

	$this->getJson(route('order-items.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('order-items.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = OrderItem::factory()->create();
	$payload = orderItemPayload();

	$this->putJson(route('order-items.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('order_items', [
		'id' => $record->id,
		'sku' => $payload['sku'],
		'quantity' => $payload['quantity'],
		'status' => $payload['status'],
		'order_id' => $payload['order_id'],
		'author_id' => $payload['author_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = OrderItem::factory()->create();

	$this->deleteJson(route('order-items.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET orders/{order}/order-items: lista só os registros do Order da URL', function () {
	$parent = Order::factory()->create();
	OrderItem::factory()->count(2)->create(['order_id' => $parent->getKey()]);
	OrderItem::factory()->create();

	$this->getJson(route('orders.order-items.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST orders/{order}/order-items: cria o registro para o Order da URL e ignora a chave do corpo', function () {
	$parent = Order::factory()->create();
	$payload = Arr::except(orderItemPayload(), ['order_id']);

	$this->postJson(route('orders.order-items.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('order_items', [
		'order_id' => $parent->getKey(),
		'sku' => $payload['sku'],
		'quantity' => $payload['quantity'],
		'status' => $payload['status'],
		'author_id' => $payload['author_id'],
	]);
});

test('GET users/{user}/order-items-by-author: lista só os registros do User da URL', function () {
	$parent = User::factory()->create();
	OrderItem::factory()->count(2)->create(['author_id' => $parent->getKey()]);
	OrderItem::factory()->create();

	$this->getJson(route('users.order-items-by-author.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST users/{user}/order-items-by-author: cria o registro para o User da URL e ignora a chave do corpo', function () {
	$parent = User::factory()->create();
	$payload = Arr::except(orderItemPayload(), ['author_id']);

	$this->postJson(route('users.order-items-by-author.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('order_items', [
		'author_id' => $parent->getKey(),
		'sku' => $payload['sku'],
		'quantity' => $payload['quantity'],
		'status' => $payload['status'],
		'order_id' => $payload['order_id'],
	]);
});
