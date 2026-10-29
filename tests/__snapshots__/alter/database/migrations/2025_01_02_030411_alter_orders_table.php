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
		Schema::table('orders', function (Blueprint $table) {
			$table->dropForeign(['client_id']);
			$table->dropColumn('client_id');
			$table->uuid('invoice_id');
			$table->foreign('invoice_id')->references('id')->on('invoices');
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down(): void
	{
		Schema::table('orders', function (Blueprint $table) {
			// A coluna removida no up() volta vazia: o dropColumn não recupera os dados dela.
			$table->dropForeign(['invoice_id']);
			$table->dropColumn('invoice_id');
			$table->uuid('client_id');
			$table->foreign('client_id')->references('id')->on('clients');
		});
	}

};
