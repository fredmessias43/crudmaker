<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\CourseContentFactory (database/factories/CourseContentFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\CourseContent;
use App\Models\Course;

/**
 * @extends Factory<CourseContent>
 */
abstract class BaseCourseContentFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em CourseContent::factory() e que esta factory cria.
	 *
	 * @var class-string<CourseContent>
	 */
	protected $model = CourseContent::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'course_id' => Course::factory(),
			'name' => fake()->name(),
			'description' => fake()->paragraph(),
			'link' => fake()->words(3, true),
			'pdf' => fake()->words(3, true),
		];
	}
}
