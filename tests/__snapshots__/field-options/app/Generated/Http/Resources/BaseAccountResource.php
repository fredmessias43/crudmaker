<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Resources\AccountResource (app/Http/Resources/AccountResource.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;


abstract class BaseAccountResource extends JsonResource
{

	/**
	 * Transform the resource into an array.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array|\Illuminate\Contracts\Support\Arrayable|\JsonSerializable
	 */
	public function toArray($request)
	{
		$createdAt = $this->created_at->locale(App::getLocale());
		$updatedAt = $this->updated_at->locale(App::getLocale());
	
		return array_merge([
			'id' => $this->id,
			'email' => $this->email,
			'nickname' => $this->nickname,
			'bio' => $this->bio,
			'owner_ref' => $this->owner_ref,
			'status' => $this->status?->value,
			'plan' => $this->plan?->value,
			'age' => $this->age,
			'credit' => $this->credit,
			'score' => $this->score,
			'active' => $this->active,
			'newsletter' => $this->newsletter,
			'birthday' => $this->birthday,
			'last_seen' => $this->last_seen,
			'settings' => $this->settings,
			'created_at' => array(
				'timestamp' => $createdAt->timestamp,
				'description' => $createdAt->diffForHumans(),
			),
			'updated_at' => array(
				'timestamp' => $updatedAt->timestamp,
				'description' => $updatedAt->diffForHumans(),
			),
		], $this->extra($request));
	}

	/**
	 * Hook: campos calculados que entram na resposta (junto dos gerados; a mesma chave substitui o campo gerado).
	 * Sobrescreva na classe final.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return array
	 */
	protected function extra(Request $request): array
	{
		return [];
	}

}
