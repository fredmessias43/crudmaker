<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseOrderCollection;

/**
 * Camada de customização da collection de Order.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseOrderCollection (app/Generated/Http/Resources/BaseOrderCollection.php), que não deve ser editada.
 */
class OrderCollection extends BaseOrderCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * OrderResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
