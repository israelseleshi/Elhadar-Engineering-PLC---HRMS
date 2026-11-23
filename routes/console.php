<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('hrms:auto-confirm-probation')->dailyAt('00:05')->withoutOverlapping();
Schedule::command('hrms:rollover-annual-leave')->yearlyOn(1, 1, '00:10')->withoutOverlapping();
