<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\ClassLessonAttendeeFactory (database/factories/ClassLessonAttendeeFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ClassLessonAttendee;
use App\Models\ClassLesson;
use App\Models\User;

/**
 * @extends Factory<ClassLessonAttendee>
 */
abstract class BaseClassLessonAttendeeFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em ClassLessonAttendee::factory() e que esta factory cria.
	 *
	 * @var class-string<ClassLessonAttendee>
	 */
	protected $model = ClassLessonAttendee::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'class_lesson_id' => ClassLesson::factory(),
			'user_id' => User::factory(),
		];
	}
}
