<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;


class StudentResource extends JsonResource
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
			'status' => $this->status,
			'classroom_id' => $this->classroom_id,
			'user_id' => $this->user_id,
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
