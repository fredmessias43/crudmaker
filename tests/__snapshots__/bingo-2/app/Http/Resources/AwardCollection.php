<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseAwardCollection;

/**
 * Camada de customização da collection de Award.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseAwardCollection (app/Generated/Http/Resources/BaseAwardCollection.php), que não deve ser editada.
 */
class AwardCollection extends BaseAwardCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * AwardResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
