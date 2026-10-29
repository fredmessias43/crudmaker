<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\UserUserCourseController (app/Http/Controllers/Api/Relationships/UserUserCourseController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\UserCourseController;
use App\Models\User;
use App\Models\UserCourse;
use App\Http\Requests\UserCourseRequest;
use App\Http\Resources\UserCourseCollection;
use App\Http\Resources\UserCourseResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de User -> userCourses (hasMany).
 *
 * Estende o controller de UserCourse: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseUserUserCourseController extends UserCourseController
{

	/**
	 * Display a paginated listing of the UserCourse records of a User.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de UserCourse.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, User $user): JsonResponse
	{
		$query = UserCourse::query()->where('user_id', $user->getKey());

		// Hooks do usuário: primeiro o de UserCourse (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $user);

		return (new UserCourseCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created UserCourse for a User.
	 *
	 * A chave estrangeira ('user_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\UserCourseRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(UserCourseRequest $request, User $user): JsonResponse
	{
		$userCourse = DB::transaction(function () use ($request, $user) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $user);
			$data['user_id'] = $user->getKey();

			$model = UserCourse::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $user);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('UserCourse created successfully.'),
			'data' => new UserCourseResource($userCourse),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (User) além do que o hook de UserCourse recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, User $user): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de UserCourse) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, User $user): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de UserCourse.
	 */
	protected function nestedAfterStore(UserCourse $model, Request $request, User $user): void
	{
	}

}
