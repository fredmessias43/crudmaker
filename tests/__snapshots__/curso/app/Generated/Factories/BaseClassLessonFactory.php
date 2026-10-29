<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\ClassLessonFactory (database/factories/ClassLessonFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\ClassLesson;
use App\Models\Classroom;

/**
 * @extends Factory<ClassLesson>
 */
abstract class BaseClassLessonFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em ClassLesson::factory() e que esta factory cria.
	 *
	 * @var class-string<ClassLesson>
	 */
	protected $model = ClassLesson::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'classroom_id' => Classroom::factory(),
			'name' => fake()->name(),
			'description' => fake()->paragraph(),
			'link' => fake()->words(3, true),
			'pdf' => fake()->words(3, true),
		];
	}
}
