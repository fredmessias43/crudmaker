<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\Relationships\ClientAddressController;
use App\Http\Controllers\Api\Relationships\ClientAlertController;
use App\Http\Controllers\Api\TagController;
use Illuminate\Support\Facades\Route;

Route::apiResource('clients', ClientController::class)->only(['index', 'store', 'show', 'update'])->middleware(['auth:sanctum', 'verified']);
Route::apiResource('addresses', AddressController::class)->middleware(['auth:sanctum']);
Route::apiResource('alerts', AlertController::class)->middleware(['auth:sanctum', 'throttle:60,1']);
Route::apiResource('tags', TagController::class)->only(['index', 'show']);

// Rotas aninhadas (hasMany/hasOne). Mostrar, atualizar e remover usam as rotas raiz acima.
Route::get('clients/{client}/address', [ClientAddressController::class, 'nestedShow'])->name('clients.address.show')->middleware(['auth:sanctum']);
Route::post('clients/{client}/address', [ClientAddressController::class, 'nestedStore'])->name('clients.address.store')->middleware(['auth:sanctum']);
Route::get('clients/{client}/alerts', [ClientAlertController::class, 'nestedIndex'])->name('clients.alerts.index')->middleware(['auth:sanctum', 'throttle:60,1']);
Route::post('clients/{client}/alerts', [ClientAlertController::class, 'nestedStore'])->name('clients.alerts.store')->middleware(['auth:sanctum', 'throttle:60,1']);
