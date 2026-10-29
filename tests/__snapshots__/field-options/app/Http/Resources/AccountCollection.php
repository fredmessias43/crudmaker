<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseAccountCollection;

/**
 * Camada de customização da collection de Account.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseAccountCollection (app/Generated/Http/Resources/BaseAccountCollection.php), que não deve ser editada.
 */
class AccountCollection extends BaseAccountCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * AccountResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
