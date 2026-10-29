<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de Student (rotas students.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Classroom;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de Student, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function studentPayload(array $overrides = []): array
{
	$model = Student::factory()->make();

	return array_merge([
		'status' => $model->status,
		'classroom_id' => $model->classroom_id,
		'user_id' => $model->user_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = Student::count();
	Student::factory()->count(3)->create();

	$this->getJson(route('students.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = Student::count();
	$payload = studentPayload();

	$this->postJson(route('students.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(Student::count())->toBe($before + 1);
	$this->assertDatabaseHas('students', [
		'status' => $payload['status'],
		'classroom_id' => $payload['classroom_id'],
		'user_id' => $payload['user_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('students.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['status', 'classroom_id', 'user_id']);
});

test('show: devolve o registro', function () {
	$record = Student::factory()->create();

	$this->getJson(route('students.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('students.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = Student::factory()->create();
	$payload = studentPayload();

	$this->putJson(route('students.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('students', [
		'id' => $record->id,
		'status' => $payload['status'],
		'classroom_id' => $payload['classroom_id'],
		'user_id' => $payload['user_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = Student::factory()->create();

	$this->deleteJson(route('students.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET classrooms/{classroom}/students: lista só os registros do Classroom da URL', function () {
	$parent = Classroom::factory()->create();
	Student::factory()->count(2)->create(['classroom_id' => $parent->getKey()]);
	Student::factory()->create();

	$this->getJson(route('classrooms.students.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST classrooms/{classroom}/students: cria o registro para o Classroom da URL e ignora a chave do corpo', function () {
	$parent = Classroom::factory()->create();
	$payload = Arr::except(studentPayload(), ['classroom_id']);

	$this->postJson(route('classrooms.students.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('students', [
		'classroom_id' => $parent->getKey(),
		'status' => $payload['status'],
		'user_id' => $payload['user_id'],
	]);
});
