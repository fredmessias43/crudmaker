<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class CourseContentCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($course_content) {
			$createdAt = $course_content->created_at->locale(App::getLocale());
			$updatedAt = $course_content->updated_at->locale(App::getLocale());
	
			return [
				'id' => $course_content->id,
				'course_id' => $course_content->course_id,
				'name' => $course_content->name,
				'description' => $course_content->description,
				'link' => $course_content->link,
				'pdf' => $course_content->pdf,
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
