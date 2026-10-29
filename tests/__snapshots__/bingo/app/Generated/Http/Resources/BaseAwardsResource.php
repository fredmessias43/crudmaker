<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Resources\AwardsResource (app/Http/Resources/AwardsResource.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\App;


abstract class BaseAwardsResource extends JsonResource
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
			'game_id' => $this->game_id,
			'name' => $this->name,
			'description' => $this->description,
			'image_url' => $this->image_url,
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
