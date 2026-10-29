<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Models\Account (app/Models/Account.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Generated\Enums\AccountStatus;
use App\Generated\Enums\AccountPlan;


abstract class BaseAccount extends Model
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
			'status' => AccountStatus::class,
			'plan' => AccountPlan::class,
			'age' => 'integer',
			'credit' => 'double',
			'score' => 'integer',
			'active' => 'boolean',
			'newsletter' => 'boolean',
			'birthday' => 'date',
			'last_seen' => 'datetime',
			'settings' => 'array',
		];
	}
	
	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = [
		'id',
		'password',
		'email',
		'nickname',
		'bio',
		'owner_ref',
		'status',
		'plan',
		'age',
		'credit',
		'score',
		'active',
		'newsletter',
		'birthday',
		'last_seen',
		'settings',
	];

	/**
	 * The attributes that should be hidden for serialization.
	 *
	 * @var array
	 */
	protected $hidden = [
		'password',
	];


}
