<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;


class GameResource extends JsonResource
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
			'name' => $this->name,
			'description' => $this->description,
			'max_players' => $this->max_players,
			'document' => $this->document,
			'status' => $this->status,
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
