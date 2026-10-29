<?php

// ARQUIVO GERADO PELO CRUDMAKER. Depois de registrada no manifest-lock.json, a migration não é mais sobrescrita.
// Sem este cabeçalho (e fora do lock), o crudmaker trata a migration como de terceiros e nunca a reescreve.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('orders', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->string('number');
			$table->uuid('user_id');
	
			$table->foreign('user_id')->references('id')->on('users');
	
			$table->timestamps();
			$table->softDeletes();
			$table->unique('number');
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down(): void
	{
		Schema::dropIfExists('orders');
	}

};
