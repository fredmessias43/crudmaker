<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\Relationships\ClientAddressController;
use App\Http\Controllers\Api\Relationships\ClientAlertController;
use App\Http\Controllers\Api\Relationships\ClientNoteController;
use Illuminate\Support\Facades\Route;

Route::apiResource('clients', ClientController::class);
Route::apiResource('notes', NoteController::class);
Route::apiResource('alerts', AlertController::class);
Route::apiResource('addresses', AddressController::class);

// Rotas aninhadas (hasMany/hasOne). Mostrar, atualizar e remover usam as rotas raiz acima.
Route::get('clients/{client}/note', [ClientNoteController::class, 'nestedShow'])->name('clients.note.show');
Route::post('clients/{client}/note', [ClientNoteController::class, 'nestedStore'])->name('clients.note.store');
Route::get('clients/{client}/address', [ClientAddressController::class, 'nestedShow'])->name('clients.address.show');
Route::post('clients/{client}/address', [ClientAddressController::class, 'nestedStore'])->name('clients.address.store');
Route::get('clients/{client}/alerts', [ClientAlertController::class, 'nestedIndex'])->name('clients.alerts.index');
Route::post('clients/{client}/alerts', [ClientAlertController::class, 'nestedStore'])->name('clients.alerts.store');
