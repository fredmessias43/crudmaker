<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de CourseContent (rotas course-contents.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\Course;
use App\Models\CourseContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de CourseContent, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function courseContentPayload(array $overrides = []): array
{
	$model = CourseContent::factory()->make();

	return array_merge([
		'course_id' => $model->course_id,
		'name' => $model->name,
		'description' => $model->description,
		'link' => $model->link,
		'pdf' => $model->pdf,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = CourseContent::count();
	CourseContent::factory()->count(3)->create();

	$this->getJson(route('course-contents.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = CourseContent::count();
	$payload = courseContentPayload();

	$this->postJson(route('course-contents.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(CourseContent::count())->toBe($before + 1);
	$this->assertDatabaseHas('course_contents', [
		'course_id' => $payload['course_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('course-contents.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['course_id', 'name', 'link', 'pdf']);
});

test('show: devolve o registro', function () {
	$record = CourseContent::factory()->create();

	$this->getJson(route('course-contents.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('course-contents.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = CourseContent::factory()->create();
	$payload = courseContentPayload();

	$this->putJson(route('course-contents.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('course_contents', [
		'id' => $record->id,
		'course_id' => $payload['course_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
	]);
});

test('destroy: remove o registro', function () {
	$record = CourseContent::factory()->create();

	$this->deleteJson(route('course-contents.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET courses/{course}/course-contents: lista só os registros do Course da URL', function () {
	$parent = Course::factory()->create();
	CourseContent::factory()->count(2)->create(['course_id' => $parent->getKey()]);
	CourseContent::factory()->create();

	$this->getJson(route('courses.course-contents.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST courses/{course}/course-contents: cria o registro para o Course da URL e ignora a chave do corpo', function () {
	$parent = Course::factory()->create();
	$payload = Arr::except(courseContentPayload(), ['course_id']);

	$this->postJson(route('courses.course-contents.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('course_contents', [
		'course_id' => $parent->getKey(),
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
	]);
});
