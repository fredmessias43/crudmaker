<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\NoteController (app/Http/Controllers/Api/NoteController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Http\Requests\NoteRequest;
use App\Http\Resources\NoteCollection;
use App\Http\Resources\NoteResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;


abstract class BaseNoteController extends Controller
{

	/**
	 * Display a paginated listing of the resource.
	 *
	 * Responde com o formato de paginação do Laravel: `data`, `links` e `meta`.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function index(Request $request): JsonResponse
	{
		$query = $this->indexQuery(Note::query(), $request);

		return (new NoteCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created resource in storage.
	 *
	 * A gravação e os hooks `beforeStore`/`afterStore` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\NoteRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function store(NoteRequest $request): JsonResponse
	{
		$note = DB::transaction(function () use ($request) {
			$data = $this->beforeStore($request->validated(), $request);
			$model = Note::create($data);
			$this->afterStore($model, $request);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Note created successfully.'),
			'data' => new NoteResource($note),
		], 201);
	}


	/**
	 * Display the specified resource.
	 *
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function show(Note $note): JsonResponse
	{
		return response()->json([
			'status' => 200,
			'data' => new NoteResource($note),
		], 200);
	}


	/**
	 * Update the specified resource in storage.
	 *
	 * A gravação e os hooks `beforeUpdate`/`afterUpdate` rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\NoteRequest $request
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function update(NoteRequest $request, Note $note): JsonResponse
	{
		DB::transaction(function () use ($request, $note) {
			$data = $this->beforeUpdate($note, $request->validated(), $request);
			$note->update($data);
			$this->afterUpdate($note, $request);
		});

		return response()->json([
			'status' => 200,
			'message' => trans('Note updated successfully.'),
			'data' => new NoteResource($note),
		], 200);
	}


	/**
	 * Remove the specified resource from storage.
	 *
	 * A remoção e os hooks `beforeDestroy`/`afterDestroy` rodam na mesma transação.
	 *
	 * @param  \App\Models\Note $note
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function destroy(Request $request, Note $note): Response
	{
		DB::transaction(function () use ($request, $note) {
			$this->beforeDestroy($note, $request);
			$note->delete();
			$this->afterDestroy($note, $request);
		});

		return response()->noContent();
	}


	/*
	 * Hooks. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Para barrar a operação, lance uma exceção ou chame abort(): em store/update/destroy isso desfaz a gravação.
	 */

	/**
	 * Ajusta a query do `index` antes de paginar (filtro por usuário, escopos, ordenação).
	 */
	protected function indexQuery(Builder $query, Request $request): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados e devolve os dados a gravar.
	 */
	protected function beforeStore(array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação): efeitos colaterais com o registro gravado.
	 */
	protected function afterStore(Note $model, Request $request): void
	{
	}

	/**
	 * Antes de atualizar: recebe o registro e os dados validados e devolve os dados a gravar.
	 */
	protected function beforeUpdate(Note $model, array $data, Request $request): array
	{
		return $data;
	}

	/**
	 * Depois de atualizar (ainda dentro da transação).
	 */
	protected function afterUpdate(Note $model, Request $request): void
	{
	}

	/**
	 * Antes de remover: é o lugar de barrar a remoção (exceção ou abort()).
	 */
	protected function beforeDestroy(Note $model, Request $request): void
	{
	}

	/**
	 * Depois de remover (ainda dentro da transação).
	 */
	protected function afterDestroy(Note $model, Request $request): void
	{
	}

}
