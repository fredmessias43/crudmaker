<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseCardCollection;

/**
 * Camada de customização da collection de Card.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseCardCollection (app/Generated/Http/Resources/BaseCardCollection.php), que não deve ser editada.
 */
class CardCollection extends BaseCardCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * CardResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
