<?php

namespace Database\Factories;

use App\Generated\Factories\BaseOrderItemFactory;

/**
 * Camada de customização da factory de OrderItem.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * Os valores padrão (definition()) ficam em
 * App\Generated\Factories\BaseOrderItemFactory (app/Generated/Factories/BaseOrderItemFactory.php), que não deve ser editada.
 */
class OrderItemFactory extends BaseOrderItemFactory
{
	/*
	 * Estados: variações nomeadas, usadas como OrderItem::factory()->exemplo()->create().
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
