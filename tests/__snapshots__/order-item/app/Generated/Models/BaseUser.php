<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\User (app/Models/User.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Order;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\OrderItem;


abstract class BaseUser extends Model
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
	];

	public function orderByUser(): HasOne
	{
		return $this->hasOne(Order::class, 'user_id');
	}
	
	public function orders(): HasMany
	{
		return $this->hasMany(Order::class);
	}
	
	public function orderItemsByAuthor(): HasMany
	{
		return $this->hasMany(OrderItem::class, 'author_id');
	}
	

}
