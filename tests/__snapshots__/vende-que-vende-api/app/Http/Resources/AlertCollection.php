<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class AlertCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($alert) {
			$createdAt = $alert->created_at->locale(App::getLocale());
			$updatedAt = $alert->updated_at->locale(App::getLocale());
	
			return [
				'id' => $alert->id,
				'message' => $alert->message,
				'alertDate' => $alert->alertDate,
				'client_id' => $alert->client_id,
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
