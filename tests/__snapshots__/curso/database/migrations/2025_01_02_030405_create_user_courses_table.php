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
		Schema::create('user_courses', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->string('status');
			$table->uuid('user_id');
			$table->uuid('course_id');
	
			$table->foreign('user_id')->references('id')->on('users');
			$table->foreign('course_id')->references('id')->on('courses');
	
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
		Schema::dropIfExists('user_courses');
	}

};
