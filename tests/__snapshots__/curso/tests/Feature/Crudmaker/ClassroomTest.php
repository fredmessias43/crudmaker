<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Classroom (rotas classrooms.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Classroom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Classroom, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function classroomPayload(array $overrides = []): array
{
	$model = Classroom::factory()->make();

	return array_merge([
		'name' => $model->name,
		'description' => $model->description,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Classroom::count();
	Classroom::factory()->count(3)->create();

	$this->getJson(route('classrooms.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Classroom::count();
	$payload = classroomPayload();

	$this->postJson(route('classrooms.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Classroom::count())->toBe($before + 1);
	$this->assertDatabaseHas('classrooms', [
		'name' => $payload['name'],
		'description' => $payload['description'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('classrooms.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['name']);
});

test('show: devolve o registro', function () {
	$record = Classroom::factory()->create();

	$this->getJson(route('classrooms.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('classrooms.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Classroom::factory()->create();
	$payload = classroomPayload();

	$this->putJson(route('classrooms.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('classrooms', [
		'id' => $record->id,
		'name' => $payload['name'],
		'description' => $payload['description'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Classroom::factory()->create();

	$this->deleteJson(route('classrooms.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
