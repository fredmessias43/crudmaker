<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\ClassLessonCommentFactory (database/factories/ClassLessonCommentFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ClassLessonComment;
use App\Models\ClassLesson;
use App\Models\User;

/**
 * @extends Factory<ClassLessonComment>
 */
abstract class BaseClassLessonCommentFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em ClassLessonComment::factory() e que esta factory cria.
	 *
	 * @var class-string<ClassLessonComment>
	 */
	protected $model = ClassLessonComment::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'class_lesson_id' => ClassLesson::factory(),
			'name' => fake()->name(),
			'description' => fake()->paragraph(),
			'link' => fake()->words(3, true),
			'pdf' => fake()->words(3, true),
			'user_id' => User::factory(),
		];
	}
}
