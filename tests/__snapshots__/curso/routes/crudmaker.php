<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\ClassLessonAttendeeController;
use App\Http\Controllers\Api\ClassLessonCommentController;
use App\Http\Controllers\Api\ClassLessonController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\CourseContentController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\Relationships\ClassLessonClassLessonCommentController;
use App\Http\Controllers\Api\Relationships\ClassroomClassLessonController;
use App\Http\Controllers\Api\Relationships\ClassroomStudentController;
use App\Http\Controllers\Api\Relationships\CourseCourseContentController;
use App\Http\Controllers\Api\Relationships\UserUserCourseController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserCourseController;
use Illuminate\Support\Facades\Route;

Route::apiResource('courses', CourseController::class);
Route::apiResource('course-contents', CourseContentController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('user-courses', UserCourseController::class);
Route::apiResource('classrooms', ClassroomController::class);
Route::apiResource('class-lessons', ClassLessonController::class);
Route::apiResource('class-lesson-comments', ClassLessonCommentController::class);
Route::apiResource('class-lesson-attendees', ClassLessonAttendeeController::class);
Route::apiResource('students', StudentController::class);

// Rotas aninhadas (hasMany/hasOne). Mostrar, atualizar e remover usam as rotas raiz acima.
Route::get('courses/{course}/course-contents', [CourseCourseContentController::class, 'nestedIndex'])->name('courses.course-contents.index');
Route::post('courses/{course}/course-contents', [CourseCourseContentController::class, 'nestedStore'])->name('courses.course-contents.store');
Route::get('users/{user}/user-courses', [UserUserCourseController::class, 'nestedIndex'])->name('users.user-courses.index');
Route::post('users/{user}/user-courses', [UserUserCourseController::class, 'nestedStore'])->name('users.user-courses.store');
Route::get('classrooms/{classroom}/class-lessons', [ClassroomClassLessonController::class, 'nestedIndex'])->name('classrooms.class-lessons.index');
Route::post('classrooms/{classroom}/class-lessons', [ClassroomClassLessonController::class, 'nestedStore'])->name('classrooms.class-lessons.store');
Route::get('classrooms/{classroom}/students', [ClassroomStudentController::class, 'nestedIndex'])->name('classrooms.students.index');
Route::post('classrooms/{classroom}/students', [ClassroomStudentController::class, 'nestedStore'])->name('classrooms.students.store');
Route::get('class-lessons/{class_lesson}/class-lesson-comments', [ClassLessonClassLessonCommentController::class, 'nestedIndex'])->name('class-lessons.class-lesson-comments.index');
Route::post('class-lessons/{class_lesson}/class-lesson-comments', [ClassLessonClassLessonCommentController::class, 'nestedStore'])->name('class-lessons.class-lesson-comments.store');
