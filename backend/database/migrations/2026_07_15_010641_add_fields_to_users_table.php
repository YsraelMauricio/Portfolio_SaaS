<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds fields required by DATA_MODEL.md §1 to the existing users table.
     *
     * NOTE: avatar_media_id is added without a foreign key constraint here
     * because the `media` table (Spatie Media Library) does not exist yet.
     * The FK constraint will be added in the Spatie Media Library migration (P1-3).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Make password nullable — users who only use OAuth have no password
            $table->string('password')->nullable()->change();

            $table->unsignedBigInteger('avatar_media_id')->nullable();
            $table->string('preferred_locale', 5)->default('en');
            $table->text('two_factor_secret')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->softDeletes();
            $table->timestamp('anonymized_at')->nullable();
            $table->text('exit_survey_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'avatar_media_id',
                'preferred_locale',
                'two_factor_secret',
                'two_factor_enabled',
                'deleted_at',
                'anonymized_at',
                'exit_survey_reason',
            ]);

            // Revert password back to NOT NULL
            $table->string('password')->change();
        });
    }
};
