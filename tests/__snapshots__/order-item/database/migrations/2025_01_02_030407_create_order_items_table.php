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
		Schema::create('order_items', function (Blueprint $table) {
			$table->uuid('id')->primary();
			$table->string('sku');
			$table->integer('quantity');
			$table->double('price');
			$table->boolean('gift');
			$table->json('options')->nullable();
			$table->date('shipped_on')->nullable();
			$table->datetime('packed_at')->nullable();
			$table->enum('status', ['pending','shipped'])->default('pending');
			$table->uuid('order_id');
			$table->uuid('author_id');
	
			$table->foreign('order_id')->references('id')->on('orders');
			$table->foreign('author_id')->references('id')->on('users');
	
			$table->timestamps();
			$table->softDeletes();
			$table->unique('sku');
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down(): void
	{
		Schema::dropIfExists('order_items');
	}

};
