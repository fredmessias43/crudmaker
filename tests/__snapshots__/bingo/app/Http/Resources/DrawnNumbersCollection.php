<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class DrawnNumbersCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($drawn_numbers) {
			$createdAt = $drawn_numbers->created_at->locale(App::getLocale());
			$updatedAt = $drawn_numbers->updated_at->locale(App::getLocale());
	
			return [
				'id' => $drawn_numbers->id,
				'game_id' => $drawn_numbers->game_id,
				'number' => $drawn_numbers->number,
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
