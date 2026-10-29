<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\ClassLessonComment (app/Models/ClassLessonComment.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ClassLessonComment;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\ClassLesson;
use App\Models\User;


abstract class BaseClassLessonComment extends Model
{
	use HasFactory;
	use SoftDeletes;
	use HasUuids;

	protected $keyType = "string";
	public $incrementing = false;
	
	/**
	 * Get the attributes that should be cast.
	 *
	 * @return array<string, string>
	 */
	protected function casts(): array
	{
		return [
		];
	}
	
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
	

}
