<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Course (rotas courses.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Course, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function coursePayload(array $overrides = []): array
{
	$model = Course::factory()->make();

	return array_merge([
		'name' => $model->name,
		'description' => $model->description,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Course::count();
	Course::factory()->count(3)->create();

	$this->getJson(route('courses.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Course::count();
	$payload = coursePayload();

	$this->postJson(route('courses.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Course::count())->toBe($before + 1);
	$this->assertDatabaseHas('courses', [
		'name' => $payload['name'],
		'description' => $payload['description'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('courses.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['name']);
});

test('show: devolve o registro', function () {
	$record = Course::factory()->create();

	$this->getJson(route('courses.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('courses.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Course::factory()->create();
	$payload = coursePayload();

	$this->putJson(route('courses.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('courses', [
		'id' => $record->id,
		'name' => $payload['name'],
		'description' => $payload['description'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Course::factory()->create();

	$this->deleteJson(route('courses.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
