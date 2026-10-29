<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseAwardsCollection;

/**
 * Camada de customização da collection de Awards.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseAwardsCollection (app/Generated/Http/Resources/BaseAwardsCollection.php), que não deve ser editada.
 */
class AwardsCollection extends BaseAwardsCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * AwardsResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
