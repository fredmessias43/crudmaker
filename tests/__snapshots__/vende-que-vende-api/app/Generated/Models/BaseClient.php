<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\Client (app/Models/Client.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Note;
use App\Models\Address;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Alert;


abstract class BaseClient extends Model
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
		'name',
		'email',
		'phone',
		'document',
	];

	public function note(): HasOne
	{
		return $this->hasOne(Note::class);
	}
	
	public function address(): HasOne
	{
		return $this->hasOne(Address::class);
	}
	
	public function alerts(): HasMany
	{
		return $this->hasMany(Alert::class);
	}
	

}
