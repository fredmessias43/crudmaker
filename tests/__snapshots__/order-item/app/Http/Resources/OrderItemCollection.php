<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class OrderItemCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($order_item) {
			$createdAt = $order_item->created_at->locale(App::getLocale());
			$updatedAt = $order_item->updated_at->locale(App::getLocale());
	
			return [
				'id' => $order_item->id,
				'sku' => $order_item->sku,
				'quantity' => $order_item->quantity,
				'price' => $order_item->price,
				'gift' => $order_item->gift,
				'options' => $order_item->options,
				'shipped_on' => $order_item->shipped_on,
				'packed_at' => $order_item->packed_at,
				'status' => $order_item->status,
				'order_id' => $order_item->order_id,
				'author_id' => $order_item->author_id,
				'created_at' => array(
					'timestamp' => $createdAt->timestamp,
					'description' => $createdAt->diffForHumans(),
				),
				'updated_at' => array(
					'timestamp' => $updatedAt->timestamp,
					'description' => $updatedAt->diffForHumans(),
				),
			];
		})->toArray();
	}

};
