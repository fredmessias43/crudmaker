<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BasePlayerInviteCollection;

/**
 * Camada de customização da collection de PlayerInvite.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BasePlayerInviteCollection (app/Generated/Http/Resources/BasePlayerInviteCollection.php), que não deve ser editada.
 */
class PlayerInviteCollection extends BasePlayerInviteCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * PlayerInviteResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
