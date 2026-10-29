<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class PlayerCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($player) {
			$createdAt = $player->created_at->locale(App::getLocale());
			$updatedAt = $player->updated_at->locale(App::getLocale());
	
			return [
				'id' => $player->id,
				'name' => $player->name,
				'email' => $player->email,
				'game_id' => $player->game_id,
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
