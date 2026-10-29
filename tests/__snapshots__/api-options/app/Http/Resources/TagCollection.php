<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseTagCollection;

/**
 * Camada de customização da collection de Tag.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseTagCollection (app/Generated/Http/Resources/BaseTagCollection.php), que não deve ser editada.
 */
class TagCollection extends BaseTagCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * TagResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
