<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class ClassLessonComment extends Model
{
	use HasFactory;
	use SoftDeletes;
	use HasUuids;

	protected $keyType = "string";
	public $incrementing = false;
	
	/**
	 * The attributes that should be cast.
	 *
	 * @var array
	 */
	protected $casts = [
	];
	
	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'id',
		'class_lesson_id',
		'name',
		'description',
		'link',
		'pdf',
		'user_id',
	];

	public function classLessonComments(): HasMany
	{
		return $this->hasMany(ClassLessonComment::class);
	}
	
	public function classLesson(): BelongsTo
	{
		return $this->belongsTo(ClassLesson::class);
	}
	
	public function user(): BelongsTo
	{
		return $this->belongsTo(User::class);
	}
	

};
