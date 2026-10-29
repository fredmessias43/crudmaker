<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\Player (app/Models/Player.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\PlayerInvite;
use App\Models\Card;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Game;


abstract class BasePlayer extends Model
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
		'name',
		'email',
		'game_id',
	];

	public function playerInvites(): HasMany
	{
		return $this->hasMany(PlayerInvite::class);
	}
	
	public function cards(): HasMany
	{
		return $this->hasMany(Card::class);
	}
	
	public function game(): BelongsTo
	{
		return $this->belongsTo(Game::class);
	}
	

}
