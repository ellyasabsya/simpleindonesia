<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/pengaturan', [
            'settings' => [
                'pay_midtrans' => Setting::midtransOn(),
                'pay_manual' => Setting::manualOn(),
            ],
            'bank' => Setting::bank(),
            'voting_open' => Setting::votingOpen(),
            'fee_percent' => Setting::serviceFeePercent(),
            'admin_whatsapp' => Setting::adminWhatsapp(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $manual = $request->boolean('pay_manual');

        $data = $request->validate([
            'pay_midtrans' => ['required', 'boolean'],
            'pay_manual' => ['required', 'boolean'],
            'bank_name' => [Rule::requiredIf($manual), 'nullable', 'string', 'max:100'],
            'bank_account_number' => [Rule::requiredIf($manual), 'nullable', 'string', 'max:40', 'regex:/^[0-9\s\-]+$/'],
            'bank_account_holder' => [Rule::requiredIf($manual), 'nullable', 'string', 'max:150'],
            'service_fee_percent' => ['required', 'numeric', 'min:0', 'max:50'],
            'admin_whatsapp' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\s\-]+$/'],
        ], [
            'admin_whatsapp.regex' => 'Nomor WhatsApp hanya boleh berisi angka.',
            'bank_name.required' => 'Nama bank wajib diisi.',
            'bank_account_number.required' => 'Nomor rekening wajib diisi.',
            'bank_account_number.regex' => 'Nomor rekening hanya boleh berisi angka.',
            'bank_account_holder.required' => 'Nama pemilik rekening wajib diisi.',
            'service_fee_percent.required' => 'Biaya layanan wajib diisi.',
            'service_fee_percent.numeric' => 'Biaya layanan harus berupa angka.',
            'service_fee_percent.min' => 'Biaya layanan minimal 0%.',
            'service_fee_percent.max' => 'Biaya layanan maksimal 50%.',
        ]);

        if (! $data['pay_midtrans'] && ! $data['pay_manual']) {
            throw ValidationException::withMessages([
                'pay_midtrans' => 'Minimal satu metode pembayaran harus aktif.',
            ]);
        }

        Setting::put('pay_midtrans', (bool) $data['pay_midtrans']);
        Setting::put('pay_manual', (bool) $data['pay_manual']);
        Setting::putText('bank_name', $data['bank_name'] ?? '');
        Setting::putText('bank_account_number', $data['bank_account_number'] ?? '');
        Setting::putText('bank_account_holder', $data['bank_account_holder'] ?? '');
        Setting::putText('service_fee_percent', (string) $data['service_fee_percent']);

        if ($request->has('admin_whatsapp')) {
            $wa = Setting::normalizeWa($data['admin_whatsapp'] ?? '');
            if ($wa === '') {
                throw ValidationException::withMessages([
                    'admin_whatsapp' => 'Nomor WhatsApp tidak valid. Contoh: 081234567890.',
                ]);
            }
            Setting::putText('admin_whatsapp', $wa);
        }

        return back()->with('success', 'Pengaturan berhasil disimpan.');
    }
}
