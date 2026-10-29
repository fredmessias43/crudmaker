<?php

namespace Database\Factories;

use App\Generated\Factories\BaseStudentFactory;

/**
 * Camada de customização da factory de Student.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * Os valores padrão (definition()) ficam em
 * App\Generated\Factories\BaseStudentFactory (app/Generated/Factories/BaseStudentFactory.php), que não deve ser editada.
 */
class StudentFactory extends BaseStudentFactory
{
	/*
	 * Estados: variações nomeadas, usadas como Student::factory()->exemplo()->create().
	 *
	 *   public function exemplo(): static
	 *   {
	 *       return $this->state(fn (array $attributes) => [
	 *           'campo' => 'valor',
	 *       ]);
	 *   }
	 *
	 * Para trocar um valor padrão, sobrescreva a definition() e parta da base:
	 *
	 *   public function definition(): array
	 *   {
	 *       return array_merge(parent::definition(), [
	 *           'campo' => 'valor',
	 *       ]);
	 *   }
	 */
}
