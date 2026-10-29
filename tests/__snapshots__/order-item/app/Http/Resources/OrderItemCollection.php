<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseOrderItemCollection;

/**
 * Camada de customização da collection de OrderItem.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseOrderItemCollection (app/Generated/Http/Resources/BaseOrderItemCollection.php), que não deve ser editada.
 */
class OrderItemCollection extends BaseOrderItemCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * OrderItemResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
