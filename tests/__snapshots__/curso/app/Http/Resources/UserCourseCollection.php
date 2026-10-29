<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class UserCourseCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($user_course) {
			$createdAt = $user_course->created_at->locale(App::getLocale());
			$updatedAt = $user_course->updated_at->locale(App::getLocale());
	
			return [
				'id' => $user_course->id,
				'status' => $user_course->status,
				'user_id' => $user_course->user_id,
				'course_id' => $user_course->course_id,
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
