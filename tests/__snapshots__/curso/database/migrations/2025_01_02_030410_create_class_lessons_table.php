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
		Schema::create('class_lessons', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->uuid('classroom_id');
			$table->string('name');
			$table->text('description')->nullable();
			$table->string('link');
			$table->string('pdf');
	
			$table->foreign('classroom_id')->references('id')->on('classrooms');
	
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
		Schema::dropIfExists('class_lessons');
	}

};
