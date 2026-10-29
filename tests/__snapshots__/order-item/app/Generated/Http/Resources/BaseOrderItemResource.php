<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Resources\OrderItemResource (app/Http/Resources/OrderItemResource.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;


abstract class BaseOrderItemResource extends JsonResource
{

	/**
	 * Transform the resource into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		$createdAt = $this->created_at->locale(App::getLocale());
		$updatedAt = $this->updated_at->locale(App::getLocale());
	
		return array_merge([
			'id' => $this->id,
			'sku' => $this->sku,
			'quantity' => $this->quantity,
			'price' => $this->price,
			'gift' => $this->gift,
			'options' => $this->options,
			'shipped_on' => $this->shipped_on,
			'packed_at' => $this->packed_at,
			'status' => $this->status?->value,
			'order_id' => $this->order_id,
			'author_id' => $this->author_id,
			'created_at' => array(
				'timestamp' => $createdAt->timestamp,
				'description' => $createdAt->diffForHumans(),
			),
			'updated_at' => array(
				'timestamp' => $updatedAt->timestamp,
				'description' => $updatedAt->diffForHumans(),
			),
		], $this->extra($request));
	}

	/**
	 * Hook: campos calculados que entram na resposta (junto dos gerados; a mesma chave substitui o campo gerado).
	 * Sobrescreva na classe final.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array
	 */
	protected function extra(Request $request): array
	{
		return [];
	}

}
