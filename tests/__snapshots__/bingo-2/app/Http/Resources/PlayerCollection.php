<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BasePlayerCollection;

/**
 * Camada de customização da collection de Player.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BasePlayerCollection (app/Generated/Http/Resources/BasePlayerCollection.php), que não deve ser editada.
 */
class PlayerCollection extends BasePlayerCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * PlayerResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
