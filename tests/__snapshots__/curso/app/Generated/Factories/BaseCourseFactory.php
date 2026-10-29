<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\CourseFactory (database/factories/CourseFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Course;

/**
 * @extends Factory<Course>
 */
abstract class BaseCourseFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Course::factory() e que esta factory cria.
	 *
	 * @var class-string<Course>
	 */
	protected $model = Course::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'name' => fake()->name(),
			'description' => fake()->paragraph(),
		];
	}
}
