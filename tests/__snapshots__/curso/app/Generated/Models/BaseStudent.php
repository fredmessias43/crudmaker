<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\Student (app/Models/Student.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Classroom;
use App\Models\User;


abstract class BaseStudent extends Model
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
		'status',
		'classroom_id',
		'user_id',
	];

	public function classroom(): BelongsTo
	{
		return $this->belongsTo(Classroom::class);
	}
	
	public function user(): BelongsTo
	{
		return $this->belongsTo(User::class);
	}
	

}
