<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\AwardController;
use App\Http\Controllers\Api\CardController;
use App\Http\Controllers\Api\DrawnNumberController;
use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\PlayerInviteController;
use App\Http\Controllers\Api\Relationships\GameAwardController;
use App\Http\Controllers\Api\Relationships\GameCardController;
use App\Http\Controllers\Api\Relationships\GameDrawnNumberController;
use App\Http\Controllers\Api\Relationships\GamePlayerInviteController;
use App\Http\Controllers\Api\Relationships\PlayerCardController;
use App\Http\Controllers\Api\Relationships\PlayerPlayerInviteController;
use Illuminate\Support\Facades\Route;

Route::apiResource('games', GameController::class);
Route::apiResource('awards', AwardController::class);
Route::apiResource('players', PlayerController::class);
Route::apiResource('player-invites', PlayerInviteController::class);
Route::apiResource('cards', CardController::class);
Route::apiResource('drawn-numbers', DrawnNumberController::class);

// Rotas aninhadas (hasMany/hasOne). Mostrar, atualizar e remover usam as rotas raiz acima.
Route::get('games/{game}/awards', [GameAwardController::class, 'nestedIndex'])->name('games.awards.index');
Route::post('games/{game}/awards', [GameAwardController::class, 'nestedStore'])->name('games.awards.store');
Route::get('games/{game}/player-invites', [GamePlayerInviteController::class, 'nestedIndex'])->name('games.player-invites.index');
Route::post('games/{game}/player-invites', [GamePlayerInviteController::class, 'nestedStore'])->name('games.player-invites.store');
Route::get('games/{game}/cards', [GameCardController::class, 'nestedIndex'])->name('games.cards.index');
Route::post('games/{game}/cards', [GameCardController::class, 'nestedStore'])->name('games.cards.store');
Route::get('games/{game}/drawn-numbers', [GameDrawnNumberController::class, 'nestedIndex'])->name('games.drawn-numbers.index');
Route::post('games/{game}/drawn-numbers', [GameDrawnNumberController::class, 'nestedStore'])->name('games.drawn-numbers.store');
Route::get('players/{player}/player-invites', [PlayerPlayerInviteController::class, 'nestedIndex'])->name('players.player-invites.index');
Route::post('players/{player}/player-invites', [PlayerPlayerInviteController::class, 'nestedStore'])->name('players.player-invites.store');
Route::get('players/{player}/cards', [PlayerCardController::class, 'nestedIndex'])->name('players.cards.index');
Route::post('players/{player}/cards', [PlayerCardController::class, 'nestedStore'])->name('players.cards.store');
