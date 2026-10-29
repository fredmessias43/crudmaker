<?php


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
		Schema::create('students', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->string('status');
			$table->uuid('class_id');
			$table->uuid('user_id');
	
			$table->foreign('class_id')->references('id')->on('classes');
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
		Schema::dropIfExists('students');
	}

};
