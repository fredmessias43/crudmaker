<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\UserOrderItemsByAuthorController (app/Http/Controllers/Api/Relationships/UserOrderItemsByAuthorController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\OrderItemController;
use App\Models\User;
use App\Models\OrderItem;
use App\Http\Requests\OrderItemRequest;
use App\Http\Resources\OrderItemCollection;
use App\Http\Resources\OrderItemResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de User -> orderItemsByAuthor (hasMany).
 *
 * Estende o controller de OrderItem: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseUserOrderItemsByAuthorController extends OrderItemController
{

	/**
	 * Display a paginated listing of the OrderItem records of a User.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de OrderItem.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, User $user): JsonResponse
	{
		$query = OrderItem::query()->where('author_id', $user->getKey());

		// Hooks do usuário: primeiro o de OrderItem (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $user);

		return (new OrderItemCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created OrderItem for a User.
	 *
	 * A chave estrangeira ('author_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\OrderItemRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(OrderItemRequest $request, User $user): JsonResponse
	{
		$orderItem = DB::transaction(function () use ($request, $user) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $user);
			$data['author_id'] = $user->getKey();

			$model = OrderItem::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $user);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('OrderItem created successfully.'),
			'data' => new OrderItemResource($orderItem),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (User) além do que o hook de OrderItem recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, User $user): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de OrderItem) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, User $user): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de OrderItem.
	 */
	protected function nestedAfterStore(OrderItem $model, Request $request, User $user): void
	{
	}

}
