<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\OrderItem (app/Models/OrderItem.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Generated\Enums\OrderItemStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Order;
use App\Models\User;


abstract class BaseOrderItem extends Model
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
			'quantity' => 'integer',
			'price' => 'double',
			'gift' => 'boolean',
			'options' => 'array',
			'shipped_on' => 'date',
			'packed_at' => 'datetime',
			'status' => OrderItemStatus::class,
		];
	}
	
	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'id',
		'sku',
		'quantity',
		'price',
		'gift',
		'options',
		'shipped_on',
		'packed_at',
		'status',
		'order_id',
		'author_id',
	];

	public function order(): BelongsTo
	{
		return $this->belongsTo(Order::class);
	}
	
	public function author(): BelongsTo
	{
		return $this->belongsTo(User::class, 'author_id');
	}
	

}
