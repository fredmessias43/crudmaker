<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseAddressCollection;

/**
 * Camada de customização da collection de Address.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseAddressCollection (app/Generated/Http/Resources/BaseAddressCollection.php), que não deve ser editada.
 */
class AddressCollection extends BaseAddressCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * AddressResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
