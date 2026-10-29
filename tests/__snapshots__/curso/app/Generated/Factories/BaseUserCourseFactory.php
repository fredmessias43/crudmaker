<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\UserCourseFactory (database/factories/UserCourseFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\UserCourse;
use App\Models\User;
use App\Models\Course;

/**
 * @extends Factory<UserCourse>
 */
abstract class BaseUserCourseFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em UserCourse::factory() e que esta factory cria.
	 *
	 * @var class-string<UserCourse>
	 */
	protected $model = UserCourse::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'status' => fake()->words(3, true),
			'user_id' => User::factory(),
			'course_id' => Course::factory(),
		];
	}
}
