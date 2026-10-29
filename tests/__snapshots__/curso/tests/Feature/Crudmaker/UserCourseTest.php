<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Testes Pest do CRUD de UserCourse (rotas user-courses.*), com o comportamento padrão gerado.
// Os seus testes ficam em outros arquivos. Para não gerar este arquivo, declare "tests": false no bloco "api" da entidade (ou em pkg.defaults.api).
// Usam RefreshDatabase: rode com um banco descartável (sqlite em memória no phpunit.xml), nunca com o banco de desenvolvimento.

use App\Models\User;
use App\Models\UserCourse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

/**
 * Corpo válido para store/update de UserCourse, montado a partir da factory
 * (datas nos formatos da request, enums pelo valor, chaves estrangeiras de pais criados pela factory).
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function userCoursePayload(array $overrides = []): array
{
	$model = UserCourse::factory()->make();

	return array_merge([
		'status' => $model->status,
		'user_id' => $model->user_id,
		'course_id' => $model->course_id,
	], $overrides);
}

test('index: lista os registros paginados', function () {
	$before = UserCourse::count();
	UserCourse::factory()->count(3)->create();

	$this->getJson(route('user-courses.index'))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', $before + 3)
		->assertJsonPath('meta.per_page', 15);
});

test('store: cria o registro com dados válidos', function () {
	$before = UserCourse::count();
	$payload = userCoursePayload();

	$this->postJson(route('user-courses.store'), $payload)
		->assertCreated()
		->assertJsonStructure(['status', 'message', 'data'])
		->assertJsonPath('status', 201);

	expect(UserCourse::count())->toBe($before + 1);
	$this->assertDatabaseHas('user_courses', [
		'status' => $payload['status'],
		'user_id' => $payload['user_id'],
		'course_id' => $payload['course_id'],
	]);
});

test('store: rejeita um corpo vazio com 422', function () {

	$this->postJson(route('user-courses.store'), [])
		->assertUnprocessable()
		->assertJsonValidationErrors(['status', 'user_id', 'course_id']);
});

test('show: devolve o registro', function () {
	$record = UserCourse::factory()->create();

	$this->getJson(route('user-courses.show', $record))
		->assertOk()
		->assertJsonPath('data.id', $record->id)
		->assertJsonStructure(['data']);
});

test('show: devolve 404 quando o registro não existe', function () {

	$this->getJson(route('user-courses.show', [(string) Str::uuid()]))->assertNotFound();
});

test('update: atualiza o registro', function () {
	$record = UserCourse::factory()->create();
	$payload = userCoursePayload();

	$this->putJson(route('user-courses.update', $record), $payload)
		->assertOk()
		->assertJsonPath('status', 200);

	$this->assertDatabaseHas('user_courses', [
		'id' => $record->id,
		'status' => $payload['status'],
		'user_id' => $payload['user_id'],
		'course_id' => $payload['course_id'],
	]);
});

test('destroy: remove o registro', function () {
	$record = UserCourse::factory()->create();

	$this->deleteJson(route('user-courses.destroy', $record))->assertNoContent();

	$this->assertSoftDeleted($record);
});

test('GET users/{user}/user-courses: lista só os registros do User da URL', function () {
	$parent = User::factory()->create();
	UserCourse::factory()->count(2)->create(['user_id' => $parent->getKey()]);
	UserCourse::factory()->create();

	$this->getJson(route('users.user-courses.index', $parent))
		->assertOk()
		->assertJsonStructure(['data', 'links', 'meta'])
		->assertJsonPath('meta.total', 2);
});

test('POST users/{user}/user-courses: cria o registro para o User da URL e ignora a chave do corpo', function () {
	$parent = User::factory()->create();
	$payload = Arr::except(userCoursePayload(), ['user_id']);

	$this->postJson(route('users.user-courses.store', $parent), $payload)->assertCreated();

	$this->assertDatabaseHas('user_courses', [
		'user_id' => $parent->getKey(),
		'status' => $payload['status'],
		'course_id' => $payload['course_id'],
	]);
});
