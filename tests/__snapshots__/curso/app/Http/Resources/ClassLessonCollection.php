<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class ClassLessonCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($class_lesson) {
			$createdAt = $class_lesson->created_at->locale(App::getLocale());
			$updatedAt = $class_lesson->updated_at->locale(App::getLocale());
	
			return [
				'id' => $class_lesson->id,
				'classroom_id' => $class_lesson->classroom_id,
				'name' => $class_lesson->name,
				'description' => $class_lesson->description,
				'link' => $class_lesson->link,
				'pdf' => $class_lesson->pdf,
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
