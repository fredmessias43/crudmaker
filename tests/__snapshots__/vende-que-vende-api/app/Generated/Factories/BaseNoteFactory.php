<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em Database\Factories\NoteFactory (database/factories/NoteFactory.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Note;
use App\Models\Client;

/**
 * @extends Factory<Note>
 */
abstract class BaseNoteFactory extends Factory
{
	/**
	 * A model final: é ela que o Laravel usa em Note::factory() e que esta factory cria.
	 *
	 * @var class-string<Note>
	 */
	protected $model = Note::class;

	/**
	 * Valores padrão dos atributos, derivados dos campos do manifest.
	 *
	 * @return array<string, mixed>
	 */
	public function definition(): array
	{
		return [
			'content' => fake()->paragraph(),
			'client_id' => Client::factory(),
		];
	}
}
