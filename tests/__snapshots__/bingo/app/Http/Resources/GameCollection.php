<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseGameCollection;

/**
 * Camada de customização da collection de Game.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseGameCollection (app/Generated/Http/Resources/BaseGameCollection.php), que não deve ser editada.
 */
class GameCollection extends BaseGameCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * GameResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
