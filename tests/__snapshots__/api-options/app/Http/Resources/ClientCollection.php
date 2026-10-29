<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseClientCollection;

/**
 * Camada de customização da collection de Client.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseClientCollection (app/Generated/Http/Resources/BaseClientCollection.php), que não deve ser editada.
 */
class ClientCollection extends BaseClientCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * ClientResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
