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
		Schema::table('clients', function (Blueprint $table) {
			// No Laravel 10, ->change() exige o pacote doctrine/dbal (composer require doctrine/dbal).
			$table->integer('age')->change();
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down(): void
	{
		Schema::table('clients', function (Blueprint $table) {
			$table->string('age')->change();
		});
	}

};
