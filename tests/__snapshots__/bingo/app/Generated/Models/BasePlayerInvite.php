<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\PlayerInvite (app/Models/PlayerInvite.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Generated\Enums\PlayerInviteStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Player;
use App\Models\Game;


abstract class BasePlayerInvite extends Model
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
			'status' => PlayerInviteStatus::class,
		];
	}
	
	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'id',
		'player_id',
		'game_id',
		'status',
	];

	public function player(): BelongsTo
	{
		return $this->belongsTo(Player::class);
	}
	
	public function game(): BelongsTo
	{
		return $this->belongsTo(Game::class);
	}
	

}
