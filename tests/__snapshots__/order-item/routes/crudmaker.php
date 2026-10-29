<?php

// ARQUIVO GERADO PELO CRUDMAKER. NÃO EDITE: ele é sobrescrito a cada `crudmaker generate`.
// Rotas próprias ou ajustes ficam em routes/api.php (fora deste arquivo).

use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderItemController;
use App\Http\Controllers\Api\Relationships\OrderOrderItemController;
use App\Http\Controllers\Api\Relationships\UserOrderByUserController;
use App\Http\Controllers\Api\Relationships\UserOrderController;
use App\Http\Controllers\Api\Relationships\UserOrderItemsByAuthorController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::apiResource('order-items', OrderItemController::class);
Route::apiResource('orders', OrderController::class);
Route::apiResource('users', UserController::class);

// Rotas aninhadas (hasMany/hasOne). Mostrar, atualizar e remover usam as rotas raiz acima.
Route::get('orders/{order}/order-items', [OrderOrderItemController::class, 'nestedIndex'])->name('orders.order-items.index');
Route::post('orders/{order}/order-items', [OrderOrderItemController::class, 'nestedStore'])->name('orders.order-items.store');
Route::get('users/{user}/order-by-user', [UserOrderByUserController::class, 'nestedShow'])->name('users.order-by-user.show');
Route::post('users/{user}/order-by-user', [UserOrderByUserController::class, 'nestedStore'])->name('users.order-by-user.store');
Route::get('users/{user}/orders', [UserOrderController::class, 'nestedIndex'])->name('users.orders.index');
Route::post('users/{user}/orders', [UserOrderController::class, 'nestedStore'])->name('users.orders.store');
Route::get('users/{user}/order-items-by-author', [UserOrderItemsByAuthorController::class, 'nestedIndex'])->name('users.order-items-by-author.index');
Route::post('users/{user}/order-items-by-author', [UserOrderItemsByAuthorController::class, 'nestedStore'])->name('users.order-items-by-author.store');
