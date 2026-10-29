<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\Game (app/Models/Game.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Awards;
use App\Models\PlayerInvite;
use App\Models\Cards;
use App\Models\DrawnNumbers;


abstract class BaseGame extends Model
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
		'max_players' => 'integer',
	];
	
	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'id',
		'name',
		'description',
		'max_players',
		'document',
		'status',
	];

	public function awards(): HasMany
	{
		return $this->hasMany(Awards::class);
	}
	
	public function playerInvites(): HasMany
	{
		return $this->hasMany(PlayerInvite::class);
	}
	
	public function cards(): HasMany
	{
		return $this->hasMany(Cards::class);
	}
	
	public function drawnNumbers(): HasMany
	{
		return $this->hasMany(DrawnNumbers::class);
	}
	

}
