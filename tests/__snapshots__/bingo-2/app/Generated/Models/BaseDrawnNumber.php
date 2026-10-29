<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\DrawnNumber (app/Models/DrawnNumber.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Game;


abstract class BaseDrawnNumber extends Model
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
		'number' => 'integer',
	];
	
	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'id',
		'game_id',
		'number',
	];

	public function game(): BelongsTo
	{
		return $this->belongsTo(Game::class);
	}
	

}
