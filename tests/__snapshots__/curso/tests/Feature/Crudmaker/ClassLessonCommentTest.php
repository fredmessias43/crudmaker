<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de ClassLessonComment (rotas class-lesson-comments.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\ClassLesson;
use App\Models\ClassLessonComment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de ClassLessonComment, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function classLessonCommentPayload(array $overrides = []): array
{
	$model = ClassLessonComment::factory()->make();

	return array_merge([
		'class_lesson_id' => $model->class_lesson_id,
		'name' => $model->name,
		'description' => $model->description,
		'link' => $model->link,
		'pdf' => $model->pdf,
		'user_id' => $model->user_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = ClassLessonComment::count();
	ClassLessonComment::factory()->count(3)->create();

	$this->getJson(route('class-lesson-comments.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = ClassLessonComment::count();
	$payload = classLessonCommentPayload();

	$this->postJson(route('class-lesson-comments.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(ClassLessonComment::count())->toBe($before + 1);
	$this->assertDatabaseHas('class_lesson_comments', [
		'class_lesson_id' => $payload['class_lesson_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
		'user_id' => $payload['user_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('class-lesson-comments.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['class_lesson_id', 'name', 'link', 'pdf', 'user_id']);
});

test('show: devolve o registro', function () {
	$record = ClassLessonComment::factory()->create();

	$this->getJson(route('class-lesson-comments.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('class-lesson-comments.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = ClassLessonComment::factory()->create();
	$payload = classLessonCommentPayload();

	$this->putJson(route('class-lesson-comments.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('class_lesson_comments', [
		'id' => $record->id,
		'class_lesson_id' => $payload['class_lesson_id'],
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
		'user_id' => $payload['user_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = ClassLessonComment::factory()->create();

	$this->deleteJson(route('class-lesson-comments.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET class-lessons/{class_lesson}/class-lesson-comments: lista só os registros do ClassLesson da URL', function () {
	$parent = ClassLesson::factory()->create();
	ClassLessonComment::factory()->count(2)->create(['class_lesson_id' => $parent->getKey()]);
	ClassLessonComment::factory()->create();

	$this->getJson(route('class-lessons.class-lesson-comments.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST class-lessons/{class_lesson}/class-lesson-comments: cria o registro para o ClassLesson da URL e ignora a chave do corpo', function () {
	$parent = ClassLesson::factory()->create();
	$payload = Arr::except(classLessonCommentPayload(), ['class_lesson_id']);

	$this->postJson(route('class-lessons.class-lesson-comments.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('class_lesson_comments', [
		'class_lesson_id' => $parent->getKey(),
		'name' => $payload['name'],
		'description' => $payload['description'],
		'link' => $payload['link'],
		'pdf' => $payload['pdf'],
		'user_id' => $payload['user_id'],
	]);
});
