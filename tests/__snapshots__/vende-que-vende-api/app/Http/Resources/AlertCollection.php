<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseAlertCollection;

/**
 * Camada de customização da collection de Alert.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseAlertCollection (app/Generated/Http/Resources/BaseAlertCollection.php), que não deve ser editada.
 */
class AlertCollection extends BaseAlertCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * AlertResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
