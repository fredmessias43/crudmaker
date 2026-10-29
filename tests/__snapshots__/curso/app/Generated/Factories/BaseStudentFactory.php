<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\StudentFactory (database/factories/StudentFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Student;
use App\Models\Classroom;
use App\Models\User;

/**
 * @extends Factory<Student>
 */
abstract class BaseStudentFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Student::factory() e que esta factory cria.
	 *
	 * @var class-string<Student>
	 */
	protected $model = Student::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'status' => fake()->words(3, true),
			'classroom_id' => Classroom::factory(),
			'user_id' => User::factory(),
		];
	}
}
