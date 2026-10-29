<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de ClassLesson (rotas class-lessons.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\ClassLesson;
use App\Models\Classroom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de ClassLesson, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function classLessonPayload(array $overrides = []): array
{
	$model = ClassLesson::factory()->make();

	return array_merge([
		'classroom_id' => $model->classroom_id,
		'name' => $model->name,
		'description' => $model->description,
		'link' => $model->link,
		'pdf' => $model->pdf,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = ClassLesson::count();
	ClassLesson::factory()->count(3)->create();

	$this->getJson(route('class-lessons.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = ClassLesson::count();
	$payload = classLessonPayload();

	$this->postJson(route('class-lessons.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(ClassLesson::count())->toBe($before + 1);
	$this->assertDatabaseHas('class_lessons', [
		'classroom_id' => $payload['classroom_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('class-lessons.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['classroom_id', 'name', 'link', 'pdf']);
});

test('show: devolve o registro', function () {
	$record = ClassLesson::factory()->create();

	$this->getJson(route('class-lessons.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('class-lessons.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = ClassLesson::factory()->create();
	$payload = classLessonPayload();

	$this->putJson(route('class-lessons.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('class_lessons', [
		'id' => $record->id,
		'classroom_id' => $payload['classroom_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
	]);
});

test('destroy: remove o registro', function () {
	$record = ClassLesson::factory()->create();

	$this->deleteJson(route('class-lessons.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET classrooms/{classroom}/class-lessons: lista só os registros do Classroom da URL', function () {
	$parent = Classroom::factory()->create();
	ClassLesson::factory()->count(2)->create(['classroom_id' => $parent->getKey()]);
	ClassLesson::factory()->create();

	$this->getJson(route('classrooms.class-lessons.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST classrooms/{classroom}/class-lessons: cria o registro para o Classroom da URL e ignora a chave do corpo', function () {
	$parent = Classroom::factory()->create();
	$payload = Arr::except(classLessonPayload(), ['classroom_id']);

	$this->postJson(route('classrooms.class-lessons.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('class_lessons', [
		'classroom_id' => $parent->getKey(),
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
	]);
});
