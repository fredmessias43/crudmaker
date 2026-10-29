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
		Schema::create('cards', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->uuid('game_id');
			$table->uuid('player_id');
			$table->json('numbers');
	
			$table->foreign('game_id')->references('id')->on('games');
			$table->foreign('player_id')->references('id')->on('players');
	
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
		Schema::dropIfExists('cards');
	}

};
