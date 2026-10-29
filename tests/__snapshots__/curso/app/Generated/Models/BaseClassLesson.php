<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\ClassLesson (app/Models/ClassLesson.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ClassLessonComment;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Classroom;


abstract class BaseClassLesson extends Model
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
		'classroom_id',
		'name',
		'description',
		'link',
		'pdf',
	];

	public function classLessonComments(): HasMany
	{
		return $this->hasMany(ClassLessonComment::class);
	}
	
	public function classroom(): BelongsTo
	{
		return $this->belongsTo(Classroom::class);
	}
	

}
