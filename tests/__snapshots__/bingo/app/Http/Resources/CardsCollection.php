<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseCardsCollection;

/**
 * Camada de customização da collection de Cards.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseCardsCollection (app/Generated/Http/Resources/BaseCardsCollection.php), que não deve ser editada.
 */
class CardsCollection extends BaseCardsCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * CardsResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
