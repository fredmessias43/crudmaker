<?php

namespace App\Http\Controllers\Api\Relationships;

use App\Generated\Http\Controllers\Api\Relationships\BaseClientAddressController;

/**
 * Camada de customização do controller aninhado de Client -> address.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * As actions geradas ficam em App\Generated\Http\Controllers\Api\Relationships\BaseClientAddressController (app/Generated/Http/Controllers/Api/Relationships/BaseClientAddressController.php), que não deve ser editada.
 * Esta classe estende o controller de Address, então os hooks dele (indexQuery, beforeStore, afterStore)
 * também valem nas rotas aninhadas.
 */
class ClientAddressController extends BaseClientAddressController
{
	/*
	 * Hooks disponíveis. Todos são protected e não fazem nada na base: copie para cá só os que precisar.
	 * As assinaturas precisam ficar idênticas (o PHP acusa a incompatibilidade na hora).
	 *
	 * Imports que os hooks usam:
	 *   use App\Models\Client;
	 *   use App\Models\Address;
	 *   use Illuminate\Database\Eloquent\Builder;
	 *   use Illuminate\Http\Request;
	 *
	 *   protected function nestedShowQuery(Builder $query, Request $request, Client $client): Builder; // antes de buscar
	 *   protected function nestedBeforeStore(array $data, Request $request, Client $client): array; // dados validados -> dados a gravar
	 *   protected function nestedAfterStore(Address $model, Request $request, Client $client): void; // depois de criar
	 *
	 * A criação roda a gravação e os hooks na mesma transação (DB::transaction): para barrar,
	 * lance uma exceção ou chame abort(), e nada é gravado.
	 */
}
