<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class PlayerInviteCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($player_invite) {
			$createdAt = $player_invite->created_at->locale(App::getLocale());
			$updatedAt = $player_invite->updated_at->locale(App::getLocale());
	
			return [
				'id' => $player_invite->id,
				'player_id' => $player_invite->player_id,
				'game_id' => $player_invite->game_id,
				'status' => $player_invite->status,
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
