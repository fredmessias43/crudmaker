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
		Schema::create('alerts', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->string('message');
			$table->datetime('alertDate');
			$table->uuid('client_id');
	
			$table->foreign('client_id')->references('id')->on('clients');
	
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
		Schema::dropIfExists('alerts');
	}

};
