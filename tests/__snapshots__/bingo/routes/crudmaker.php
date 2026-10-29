<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\AwardsController;
use App\Http\Controllers\Api\CardsController;
use App\Http\Controllers\Api\DrawnNumbersController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\PlayerInviteController;
use Illuminate\Support\Facades\Route;

Route::apiResource('games', GameController::class);
Route::apiResource('awards', AwardsController::class);
Route::apiResource('players', PlayerController::class);
Route::apiResource('player-invites', PlayerInviteController::class);
Route::apiResource('cards', CardsController::class);
Route::apiResource('drawn-numbers', DrawnNumbersController::class);
