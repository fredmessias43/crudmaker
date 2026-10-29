<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\AwardsController;
use App\Http\Controllers\Api\CardsController;
use App\Http\Controllers\Api\DrawnNumbersController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\PlayerInviteController;
use App\Http\Controllers\Api\Relationships\GameAwardsController;
use App\Http\Controllers\Api\Relationships\GameCardsController;
use App\Http\Controllers\Api\Relationships\GameDrawnNumbersController;
use App\Http\Controllers\Api\Relationships\GamePlayerInviteController;
use App\Http\Controllers\Api\Relationships\PlayerCardsController;
use App\Http\Controllers\Api\Relationships\PlayerPlayerInviteController;
use Illuminate\Support\Facades\Route;

Route::apiResource('games', GameController::class);
Route::apiResource('awards', AwardsController::class);
Route::apiResource('players', PlayerController::class);
Route::apiResource('player-invites', PlayerInviteController::class);
Route::apiResource('cards', CardsController::class);
Route::apiResource('drawn-numbers', DrawnNumbersController::class);

// Rotas aninhadas (hasMany/hasOne). Mostrar, atualizar e remover usam as rotas raiz acima.
Route::get('games/{game}/awards', [GameAwardsController::class, 'nestedIndex'])->name('games.awards.index');
Route::post('games/{game}/awards', [GameAwardsController::class, 'nestedStore'])->name('games.awards.store');
Route::get('games/{game}/player-invites', [GamePlayerInviteController::class, 'nestedIndex'])->name('games.player-invites.index');
Route::post('games/{game}/player-invites', [GamePlayerInviteController::class, 'nestedStore'])->name('games.player-invites.store');
Route::get('games/{game}/cards', [GameCardsController::class, 'nestedIndex'])->name('games.cards.index');
Route::post('games/{game}/cards', [GameCardsController::class, 'nestedStore'])->name('games.cards.store');
Route::get('games/{game}/drawn-numbers', [GameDrawnNumbersController::class, 'nestedIndex'])->name('games.drawn-numbers.index');
Route::post('games/{game}/drawn-numbers', [GameDrawnNumbersController::class, 'nestedStore'])->name('games.drawn-numbers.store');
Route::get('players/{player}/player-invites', [PlayerPlayerInviteController::class, 'nestedIndex'])->name('players.player-invites.index');
Route::post('players/{player}/player-invites', [PlayerPlayerInviteController::class, 'nestedStore'])->name('players.player-invites.store');
Route::get('players/{player}/cards', [PlayerCardsController::class, 'nestedIndex'])->name('players.cards.index');
Route::post('players/{player}/cards', [PlayerCardsController::class, 'nestedStore'])->name('players.cards.store');
