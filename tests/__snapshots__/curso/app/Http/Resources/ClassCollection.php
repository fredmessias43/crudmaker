<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class ClassCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($class) {
			$createdAt = $class->created_at->locale(App::getLocale());
			$updatedAt = $class->updated_at->locale(App::getLocale());
	
			return [
				'id' => $class->id,
				'name' => $class->name,
				'description' => $class->description,
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
