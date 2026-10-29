<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Note (rotas notes.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Client;
use App\Models\Note;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Note, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function notePayload(array $overrides = []): array
{
	$model = Note::factory()->make();

	return array_merge([
		'content' => $model->content,
		'client_id' => $model->client_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Note::count();
	Note::factory()->count(3)->create();

	$this->getJson(route('notes.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Note::count();
	$payload = notePayload();

	$this->postJson(route('notes.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Note::count())->toBe($before + 1);
	$this->assertDatabaseHas('notes', [
		'content' => $payload['content'],
		'client_id' => $payload['client_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('notes.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['content', 'client_id']);
});

test('show: devolve o registro', function () {
	$record = Note::factory()->create();

	$this->getJson(route('notes.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('notes.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Note::factory()->create();
	$payload = notePayload();

	$this->putJson(route('notes.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('notes', [
		'id' => $record->id,
		'content' => $payload['content'],
		'client_id' => $payload['client_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Note::factory()->create();

	$this->deleteJson(route('notes.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET clients/{client}/note: mostra o registro do Client da URL', function () {
	$parent = Client::factory()->create();
	$record = Note::factory()->create(['client_id' => $parent->getKey()]);

	$this->getJson(route('clients.note.show', $parent))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('GET clients/{client}/note: devolve 404 quando o Client ainda não tem registro', function () {
	$parent = Client::factory()->create();

	$this->getJson(route('clients.note.show', $parent))->assertNotFound();
});

test('POST clients/{client}/note: cria o registro para o Client da URL e ignora a chave do corpo', function () {
	$parent = Client::factory()->create();
	$payload = Arr::except(notePayload(), ['client_id']);

	$this->postJson(route('clients.note.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('notes', [
		'client_id' => $parent->getKey(),
		'content' => $payload['content'],
	]);
});

test('POST clients/{client}/note: devolve 409 quando o Client já tem registro', function () {
	$parent = Client::factory()->create();
	Note::factory()->create(['client_id' => $parent->getKey()]);

	$this->postJson(route('clients.note.store', $parent), Arr::except(notePayload(), ['client_id']))
		->assertStatus(409);
});
