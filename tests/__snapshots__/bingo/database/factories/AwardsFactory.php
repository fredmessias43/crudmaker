<?php

namespace Database\Factories;

use App\Generated\Factories\BaseAwardsFactory;

/**
 * Camada de customização da factory de Awards.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * Os valores padrão (definition()) ficam em
 * App\Generated\Factories\BaseAwardsFactory (app/Generated/Factories/BaseAwardsFactory.php), que não deve ser editada.
 */
class AwardsFactory extends BaseAwardsFactory
{
	/*
	 * Estados: variações nomeadas, usadas como Awards::factory()->exemplo()->create().
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
