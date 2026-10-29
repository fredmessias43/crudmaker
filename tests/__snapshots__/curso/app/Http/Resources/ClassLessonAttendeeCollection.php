<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class ClassLessonAttendeeCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($class_lesson_attendee) {
			$createdAt = $class_lesson_attendee->created_at->locale(App::getLocale());
			$updatedAt = $class_lesson_attendee->updated_at->locale(App::getLocale());
	
			return [
				'id' => $class_lesson_attendee->id,
				'class_lesson_id' => $class_lesson_attendee->class_lesson_id,
				'user_id' => $class_lesson_attendee->user_id,
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
