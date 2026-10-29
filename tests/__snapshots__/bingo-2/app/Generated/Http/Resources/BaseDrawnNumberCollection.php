<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Resources\DrawnNumberCollection (app/Http/Resources/DrawnNumberCollection.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use App\Http\Resources\DrawnNumberResource;


abstract class BaseDrawnNumberCollection extends ResourceCollection
{

	/**
	 * Cada item sai pela resource final, então os campos extras de `extra()` valem na listagem também.
	 *
	 * @var string
	 */
	public $collects = DrawnNumberResource::class;

}
