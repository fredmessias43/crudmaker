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
		Schema::create('class_lesson_comments', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->uuid('class_lesson_id');
			$table->string('name');
			$table->text('description')->nullable();
			$table->string('link');
			$table->string('pdf');
			$table->uuid('user_id');
	
			$table->foreign('class_lesson_id')->references('id')->on('class_lessons');
			$table->foreign('user_id')->references('id')->on('users');
	
			$table->timestamps();
			$table->softDeletes();
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down(): void
	{
		Schema::dropIfExists('class_lesson_comments');
	}

};
