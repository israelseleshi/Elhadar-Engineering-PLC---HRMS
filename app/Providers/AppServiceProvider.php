<?php

namespace App\Providers;

use App\Models\ChatAttachment;
use App\Policies\DepartmentChatPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Musonza\Chat\Models\Conversation;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Gate::policy(Conversation::class, DepartmentChatPolicy::class);
        Gate::policy(ChatAttachment::class, DepartmentChatPolicy::class);
    }
}
