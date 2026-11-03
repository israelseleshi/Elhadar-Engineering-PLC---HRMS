<?php

namespace App\Services;

use Carbon\Carbon;
use DateTimeInterface;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class ExcelDateNormalizer
{
    public function __construct(
        protected EthiopianCalendarService $ethiopianCalendarService
    ) {}

    /**
     * Normalize any Excel cell value (DateTime, integer serial, or string like 'd/m/Y' or 'Y-m-d')
     * into a standard Gregorian Carbon instance and the Ethiopian calendar string ('DD/MM/YYYY').
     *
     * @return array{
     *   gregorian: ?Carbon,
     *   ethiopian: ?string
     * }
     */
    public function normalizeDate(mixed $rawVal, bool $isEthiopianInput = false): array
    {
        if ($rawVal === null || $rawVal === '' || $rawVal === 'None') {
            return ['gregorian' => null, 'ethiopian' => null];
        }

        // Case 1: DateTimeInterface instance
        if ($rawVal instanceof DateTimeInterface) {
            $gregorian = Carbon::instance($rawVal);
            $ec = $this->ethiopianCalendarService->toEthiopian($gregorian);

            return [
                'gregorian' => $gregorian,
                'ethiopian' => sprintf('%02d/%02d/%04d', $ec['day'], $ec['month'], $ec['year']),
            ];
        }

        // Case 2: Numeric Excel serial
        if (is_numeric($rawVal)) {
            $floatVal = (float) $rawVal;
            if ($floatVal >= 20000 && $floatVal <= 70000) {
                try {
                    $dt = ExcelDate::excelToDateTimeObject($floatVal);
                    $gregorian = Carbon::instance($dt);
                    $ec = $this->ethiopianCalendarService->toEthiopian($gregorian);

                    return [
                        'gregorian' => $gregorian,
                        'ethiopian' => sprintf('%02d/%02d/%04d', $ec['day'], $ec['month'], $ec['year']),
                    ];
                } catch (\Throwable $e) {
                    // continue
                }
            }
        }

        $str = trim((string) $rawVal);

        // Case 3: Ethiopian date string
        if ($isEthiopianInput) {
            $parts = preg_split('/[\/\-\.]/', $str);
            if ($parts && count($parts) === 3) {
                if (strlen($parts[0]) === 4) {
                    $year = (int) $parts[0];
                    $month = (int) $parts[1];
                    $day = (int) $parts[2];
                } else {
                    $day = (int) $parts[0];
                    $month = (int) $parts[1];
                    $year = (int) $parts[2];
                }

                if ($year >= 1900 && $year <= 2100 && $month >= 1 && $month <= 13 && $day >= 1 && $day <= 30) {
                    try {
                        $gregorian = $this->ethiopianCalendarService->toGregorian($year, $month, $day);

                        return [
                            'gregorian' => $gregorian,
                            'ethiopian' => sprintf('%02d/%02d/%04d', $day, $month, $year),
                        ];
                    } catch (\Throwable $e) {
                        // continue
                    }
                }
            }
        }

        // Case 4: Standard parse
        try {
            $gregorian = Carbon::parse($str);
            $ec = $this->ethiopianCalendarService->toEthiopian($gregorian);

            return [
                'gregorian' => $gregorian,
                'ethiopian' => sprintf('%02d/%02d/%04d', $ec['day'], $ec['month'], $ec['year']),
            ];
        } catch (\Throwable $e) {
            return ['gregorian' => null, 'ethiopian' => null];
        }
    }
}
