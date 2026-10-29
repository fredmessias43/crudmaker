<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Facades\App;


class ClassLessonCommentCollection extends ResourceCollection
{

	/**
	 * Transform the resource collection into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		return $this->collection->map(function ($class_lesson_comment) {
			$createdAt = $class_lesson_comment->created_at->locale(App::getLocale());
			$updatedAt = $class_lesson_comment->updated_at->locale(App::getLocale());
	
			return [
				'id' => $class_lesson_comment->id,
				'class_lesson_id' => $class_lesson_comment->class_lesson_id,
				'name' => $class_lesson_comment->name,
				'description' => $class_lesson_comment->description,
				'link' => $class_lesson_comment->link,
				'pdf' => $class_lesson_comment->pdf,
				'user_id' => $class_lesson_comment->user_id,
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
