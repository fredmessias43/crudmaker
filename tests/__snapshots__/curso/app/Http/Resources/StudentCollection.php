<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class StudentCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($student) {
			$createdAt = $student->created_at->locale(App::getLocale());
			$updatedAt = $student->updated_at->locale(App::getLocale());
	
			return [
				'id' => $student->id,
				'status' => $student->status,
				'class_id' => $student->class_id,
				'user_id' => $student->user_id,
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
