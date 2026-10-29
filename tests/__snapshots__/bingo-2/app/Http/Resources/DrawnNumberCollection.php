<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseDrawnNumberCollection;

/**
 * Camada de customização da collection de DrawnNumber.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseDrawnNumberCollection (app/Generated/Http/Resources/BaseDrawnNumberCollection.php), que não deve ser editada.
 */
class DrawnNumberCollection extends BaseDrawnNumberCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * DrawnNumberResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
