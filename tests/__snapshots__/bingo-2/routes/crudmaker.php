<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\AwardController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\DrawnNumberController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\PlayerInviteController;
use Illuminate\Support\Facades\Route;

Route::apiResource('games', GameController::class);
Route::apiResource('awards', AwardController::class);
Route::apiResource('players', PlayerController::class);
Route::apiResource('player-invites', PlayerInviteController::class);
Route::apiResource('cards', CardController::class);
Route::apiResource('drawn-numbers', DrawnNumberController::class);
