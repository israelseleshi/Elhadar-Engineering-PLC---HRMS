<?php

namespace App\Services;

use App\Models\Employee;

class PhoneNormalizationService
{
    /**
     * Normalize an Ethiopian phone number string into standard 10-digit format (e.g. 0911223344 or 0711223344).
     */
    public function normalize(string $input): ?string
    {
        $digits = preg_replace('/[^0-9]/', '', $input);

        if (empty($digits)) {
            return null;
        }

        // Handle Ethiopian country code prefix (+251 / 251)
        if (str_starts_with($digits, '251')) {
            $digits = substr($digits, 3);
        }

        // Handle 9-digit format starting with 9 or 7 (e.g. 911223344 -> 0911223344)
        if ((str_starts_with($digits, '9') || str_starts_with($digits, '7')) && strlen($digits) === 9) {
            $digits = '0'.$digits;
        }

        // Standard 10-digit mobile prefix (09XXXXXXXX or 07XXXXXXXX)
        if ((str_starts_with($digits, '09') || str_starts_with($digits, '07')) && strlen($digits) === 10) {
            return $digits;
        }

        return strlen($digits) >= 9 ? $digits : null;
    }

    /**
     * Check if the provided input resembles a phone number.
     */
    public function isPhone(string $input): bool
    {
        $cleaned = trim($input);

        // If it starts with +251, 09, 07, 9, 7 or contains primarily numbers and dashes
        if (preg_match('/^(\+?251|09|07|9|7)[\d\s\-]{7,15}$/', $cleaned)) {
            return true;
        }

        $digits = preg_replace('/[^0-9]/', '', $cleaned);

        return strlen($digits) >= 9 && strlen($digits) <= 13;
    }

    /**
     * Locate an employee record by flexible phone search matching stored dashed, spaced, or raw formats.
     */
    public function findEmployeeByPhone(string $input): ?Employee
    {
        $raw = trim($input);

        // 1. Direct exact match
        $emp = Employee::where('phone', $raw)->first();
        if ($emp) {
            return $emp;
        }

        $normalized = $this->normalize($raw);
        if (! $normalized) {
            return null;
        }

        $noZero = ltrim($normalized, '0');

        // Generate known Ethiopian formats commonly used in records
        $dashed09 = preg_replace('/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/', '$1-$2-$3-$4-$5', $normalized);
        $dashed9 = preg_replace('/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/', '$1-$2-$3-$4-$5', $noZero);
        $dashed09xx = preg_replace('/(\d{4})(\d{2})(\d{2})(\d{2})/', '$1-$2-$3-$4', $normalized);

        $candidates = array_unique(array_filter([
            $raw,
            $normalized,
            $noZero,
            $dashed09,
            $dashed9,
            $dashed09xx,
        ]));

        $emp = Employee::whereIn('phone', $candidates)->first();
        if ($emp) {
            return $emp;
        }

        // Fallback SQLite/MySQL raw string replace match
        return Employee::whereRaw(
            "REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '+', '') IN (?, ?)",
            [$normalized, $noZero]
        )->first();
    }
}
