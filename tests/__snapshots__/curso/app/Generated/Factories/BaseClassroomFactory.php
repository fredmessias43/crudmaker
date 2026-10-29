<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\ClassroomFactory (database/factories/ClassroomFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Classroom;

/**
 * @extends Factory<Classroom>
 */
abstract class BaseClassroomFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Classroom::factory() e que esta factory cria.
	 *
	 * @var class-string<Classroom>
	 */
	protected $model = Classroom::class;

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
