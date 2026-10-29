<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseUserCollection;

/**
 * Camada de customização da collection de User.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseUserCollection (app/Generated/Http/Resources/BaseUserCollection.php), que não deve ser editada.
 */
class UserCollection extends BaseUserCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * UserResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
