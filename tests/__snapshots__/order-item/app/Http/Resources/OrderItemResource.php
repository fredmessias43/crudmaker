<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;


class OrderItemResource extends JsonResource
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
	
		return [
			'id' => $this->id,
			'sku' => $this->sku,
			'quantity' => $this->quantity,
			'price' => $this->price,
			'gift' => $this->gift,
			'options' => $this->options,
			'shipped_on' => $this->shipped_on,
			'packed_at' => $this->packed_at,
			'status' => $this->status,
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
		];
	}

};
