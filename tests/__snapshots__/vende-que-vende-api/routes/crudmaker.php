<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\NoteController;
use Illuminate\Support\Facades\Route;

Route::apiResource('clients', ClientController::class);
Route::apiResource('notes', NoteController::class);
Route::apiResource('alerts', AlertController::class);
Route::apiResource('addresses', AddressController::class);
