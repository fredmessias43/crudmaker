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
		Schema::create('accounts', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->string('password');
			$table->string('email');
			$table->string('nickname')->default('O\'Brien \\ Co')->nullable();
			$table->text('bio')->default('sem bio');
			$table->uuid('owner_ref')->default('00000000-0000-0000-0000-000000000000');
			$table->enum('status', ['pending','active','blocked'])->default('active');
			$table->enum('plan', ['free','pro'])->default('free');
			$table->integer('age')->default(18);
			$table->double('credit')->default(12.5);
			$table->integer('score')->default(0);
			$table->boolean('active')->default(true);
			$table->boolean('newsletter')->default(false);
			$table->date('birthday')->default('2000-01-31');
			$table->datetime('last_seen')->default('2025-01-02 03:04:05');
			$table->json('settings');
	
	
			$table->timestamps();
			$table->softDeletes();
			$table->unique('email');
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down(): void
	{
		Schema::dropIfExists('accounts');
	}

};
