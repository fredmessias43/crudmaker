<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Seu código fica em App\Http\Controllers\Api\Relationships\ClassroomStudentController (app/Http/Controllers/Api/Relationships/ClassroomStudentController.php), que estende esta classe e nunca é sobrescrita.

namespace App\Generated\Http\Controllers\Api\Relationships;

use App\Http\Controllers\Api\StudentController;
use App\Models\Classroom;
use App\Models\Student;
use App\Http\Requests\StudentRequest;
use App\Http\Resources\StudentCollection;
use App\Http\Resources\StudentResource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


/**
 * Rota aninhada de Classroom -> students (hasMany).
 *
 * Estende o controller de Student: os hooks dele (indexQuery, beforeStore, afterStore) também valem aqui.
 */
abstract class BaseClassroomStudentController extends StudentController
{

	/**
	 * Display a paginated listing of the Student records of a Classroom.
	 *
	 * Mesmos filtros, busca, ordenação, `with` e itens por página do index de Student.
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedIndex(Request $request, Classroom $classroom): JsonResponse
	{
		$query = Student::query()->where('classroom_id', $classroom->getKey());

		// Hooks do usuário: primeiro o de Student (herdado), depois o que conhece o pai.
		$query = $this->indexQuery($query, $request);
		$query = $this->nestedIndexQuery($query, $request, $classroom);

		return (new StudentCollection($query->paginate(15)))->response();
	}


	/**
	 * Store a newly created Student for a Classroom.
	 *
	 * A chave estrangeira ('classroom_id') vem sempre do pai da URL, nunca do corpo. A gravação e os hooks
	 * rodam na mesma transação.
	 *
	 * @param  \App\Http\Requests\StudentRequest $request
	 *
	 * @return \Illuminate\Http\JsonResponse
	 */
	public function nestedStore(StudentRequest $request, Classroom $classroom): JsonResponse
	{
		$student = DB::transaction(function () use ($request, $classroom) {
			$data = $this->beforeStore($request->validated(), $request);
			$data = $this->nestedBeforeStore($data, $request, $classroom);
			$data['classroom_id'] = $classroom->getKey();

			$model = Student::create($data);
			$this->afterStore($model, $request);
			$this->nestedAfterStore($model, $request, $classroom);

			return $model;
		});

		return response()->json([
			'status' => 201,
			'message' => trans('Student created successfully.'),
			'data' => new StudentResource($student),
		], 201);
	}


	/*
	 * Hooks do aninhado. Todos protected e sem efeito por aqui; sobrescreva só os que precisar na classe final.
	 * Recebem o pai da URL (Classroom) além do que o hook de Student recebe.
	 */

	/**
	 * Ajusta a query do `nestedIndex` antes de paginar (já filtrada pelo pai, pelos filtros do manifest e pelo indexQuery).
	 */
	protected function nestedIndexQuery(Builder $query, Request $request, Classroom $classroom): Builder
	{
		return $query;
	}

	/**
	 * Antes de criar: recebe os dados validados (depois do beforeStore de Student) e devolve os dados a gravar.
	 * A FK do pai é gravada por último, então não dá para trocá-la por aqui.
	 */
	protected function nestedBeforeStore(array $data, Request $request, Classroom $classroom): array
	{
		return $data;
	}

	/**
	 * Depois de criar (ainda dentro da transação), depois do afterStore de Student.
	 */
	protected function nestedAfterStore(Student $model, Request $request, Classroom $classroom): void
	{
	}

}
