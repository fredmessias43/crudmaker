<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;


class CardsResource extends JsonResource
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
			'game_id' => $this->game_id,
			'player_id' => $this->player_id,
			'numbers' => $this->numbers,
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
