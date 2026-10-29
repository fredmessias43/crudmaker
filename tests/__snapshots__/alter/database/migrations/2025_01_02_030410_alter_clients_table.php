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
		Schema::table('clients', function (Blueprint $table) {
			$table->dropUnique(['email']);
			$table->dropColumn('nickname');
			$table->string('phone')->nullable();
			$table->string('name')->nullable()->change();
			$table->double('age')->change();
			$table->enum('status', ['active','blocked','archived'])->default('active')->change();
			$table->unique('phone');
		});
	}


	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down(): void
	{
		Schema::table('clients', function (Blueprint $table) {
			// A coluna removida no up() volta vazia: o dropColumn não recupera os dados dela.
			$table->dropUnique(['phone']);
			$table->enum('status', ['active','blocked'])->default('active')->change();
			$table->integer('age')->change();
			$table->string('name')->change();
			$table->dropColumn('phone');
			$table->string('nickname');
			$table->unique('email');
		});
	}

};
