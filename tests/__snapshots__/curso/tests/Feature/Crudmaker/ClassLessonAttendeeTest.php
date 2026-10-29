<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de ClassLessonAttendee (rotas class-lesson-attendees.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\ClassLessonAttendee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de ClassLessonAttendee, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function classLessonAttendeePayload(array $overrides = []): array
{
	$model = ClassLessonAttendee::factory()->make();

	return array_merge([
		'class_lesson_id' => $model->class_lesson_id,
		'user_id' => $model->user_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = ClassLessonAttendee::count();
	ClassLessonAttendee::factory()->count(3)->create();

	$this->getJson(route('class-lesson-attendees.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = ClassLessonAttendee::count();
	$payload = classLessonAttendeePayload();

	$this->postJson(route('class-lesson-attendees.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(ClassLessonAttendee::count())->toBe($before + 1);
	$this->assertDatabaseHas('class_lesson_attendees', [
		'class_lesson_id' => $payload['class_lesson_id'],
		'user_id' => $payload['user_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('class-lesson-attendees.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['class_lesson_id', 'user_id']);
});

test('show: devolve o registro', function () {
	$record = ClassLessonAttendee::factory()->create();

	$this->getJson(route('class-lesson-attendees.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('class-lesson-attendees.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = ClassLessonAttendee::factory()->create();
	$payload = classLessonAttendeePayload();

	$this->putJson(route('class-lesson-attendees.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('class_lesson_attendees', [
		'id' => $record->id,
		'class_lesson_id' => $payload['class_lesson_id'],
		'user_id' => $payload['user_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = ClassLessonAttendee::factory()->create();

	$this->deleteJson(route('class-lesson-attendees.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});
