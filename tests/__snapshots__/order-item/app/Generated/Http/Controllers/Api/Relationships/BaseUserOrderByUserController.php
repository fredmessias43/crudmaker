<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\UserOrderByUserController (app/Http/Controllers/Api/Relationships/UserOrderByUserController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\OrderController;
use App\Models\User;
use App\Models\Order;
use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de User -> orderByUser (hasOne).
 *
 * Estende o controller de Order: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseUserOrderByUserController extends OrderController
{

	/**
	 * Display the Order of a User (404 se ele ainda não tem).
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedShow(Request $request, User $user): JsonResponse
	{
		$query = Order::query()->where('user_id', $user->getKey());

		$query = $this->nestedShowQuery($query, $request, $user);

		return response()->json([
			'status' => 200,
			'data' => new OrderResource($query->firstOrFail()),
		], 200);
	}


	/**
	 * Store a newly created Order for a User.
	 *
	 * A chave estrangeira ('user_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\OrderRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(OrderRequest $request, User $user): JsonResponse
	{
		if ($user->orderByUser()->exists()) {
			return response()->json([
				'status' => 409,
				'message' => trans('Order already exists for this User.'),
			], 409);
		}

		$order = DB::transaction(function () use ($request, $user) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $user);
			$data['user_id'] = $user->getKey();

			$model = Order::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $user);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Order created successfully.'),
			'data' => new OrderResource($order),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (User) além do que o hook de Order recebe.
	 */

	/**
	 * Ajusta a query do `nestedShow` (já filtrada pelo pai).
	 */
	protected function nestedShowQuery(Builder $query, Request $request, User $user): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de Order) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, User $user): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de Order.
	 */
	protected function nestedAfterStore(Order $model, Request $request, User $user): void
	{
	}

}
