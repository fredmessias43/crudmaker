<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class OrderItem extends Model
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
		'quantity' => 'integer',
		'price' => 'double',
		'gift' => 'boolean',
		'options' => 'array',
		'shipped_on' => 'date',
		'packed_at' => 'datetime',
	];
	
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
		return $this->belongsTo(User::class, 'id', 'author_id');
	}
	

};
