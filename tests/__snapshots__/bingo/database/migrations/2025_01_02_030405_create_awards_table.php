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
		Schema::create('awards', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->uuid('game_id');
			$table->string('name');
			$table->string('description');
			$table->string('image_url');
	
			$table->foreign('game_id')->references('id')->on('games');
	
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
		Schema::dropIfExists('awards');
	}

};
