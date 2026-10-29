<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\ClassLessonAttendeeController;
use App\Http\Controllers\Api\ClassLessonCommentController;
use App\Http\Controllers\Api\ClassLessonController;
use App\Http\Controllers\Api\ClassroomController;
use App\Http\Controllers\Api\CourseContentController;
use App\Http\Controllers\Api\CourseController;
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
