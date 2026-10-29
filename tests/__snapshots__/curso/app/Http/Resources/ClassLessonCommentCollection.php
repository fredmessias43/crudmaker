<?php

namespace App\Http\Resources;

use App\Generated\Http\Resources\BaseClassLessonCommentCollection;

/**
 * Camada de customização da collection de ClassLessonComment.
 *
 * Este arquivo é seu: o crudmaker o criou uma única vez e nunca o sobrescreve.
 * O código gerado fica em App\Generated\Http\Resources\BaseClassLessonCommentCollection (app/Generated/Http/Resources/BaseClassLessonCommentCollection.php), que não deve ser editada.
 */
class ClassLessonCommentCollection extends BaseClassLessonCommentCollection
{
	/*
	 * A collection não tem hooks: cada item sai pela resource, então campos extras vão em
	 * ClassLessonCommentResource::extra(). Aqui só ajustes da própria coleção (with(), paginationInformation()...).
	 */
}
