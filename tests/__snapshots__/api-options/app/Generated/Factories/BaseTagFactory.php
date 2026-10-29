<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\TagFactory (database/factories/TagFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Tag;

/**
 * @extends Factory<Tag>
 */
abstract class BaseTagFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Tag::factory() e que esta factory cria.
	 *
	 * @var class-string<Tag>
	 */
	protected $model = Tag::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'label' => fake()->words(3, true),
		];
	}
}
