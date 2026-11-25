<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/paket', [
            'packages' => Package::orderBy('sort_order')->orderBy('id')->get(),
            'catalog' => [
                'modules' => config('features.modules'),
                'groups' => config('features.groups'),
                'features' => config('features.features'),
                'payment_types' => config('features.payment_types'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $this->uniqueSlug($data['name']);
        $data['sort_order'] = (int) Package::max('sort_order') + 1;

        Package::create($data);

        return back()->with('success', 'Paket berhasil ditambahkan.');
    }

    public function update(Request $request, Package $package): RedirectResponse
    {
        $data = $this->validated($request);

        if ($data['name'] !== $package->name) {
            $data['slug'] = $this->uniqueSlug($data['name'], $package->id);
        }

        $package->update($data);

        return back()->with('success', 'Paket berhasil diperbarui.');
    }

    public function destroy(Package $package): RedirectResponse
    {
        // Setelah tabel event ada, paket yang sudah dipakai hanya boleh dinonaktifkan.
        $package->delete();

        return back()->with('success', 'Paket berhasil dihapus.');
    }

    private function validated(Request $request): array
    {
        $catalog = config('features');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'payment_type' => ['required', 'in:'.implode(',', array_keys($catalog['payment_types']))],
            'share_percent' => ['nullable', 'required_if:payment_type,revenue_share', 'numeric', 'min:0', 'max:100'],
            'price' => ['nullable', 'required_if:payment_type,upfront', 'integer', 'min:0'],
            'modules' => ['array'],
            'modules.*' => ['in:'.implode(',', array_keys($catalog['modules']))],
            'features' => ['array'],
            'features.*' => ['in:'.implode(',', array_keys($catalog['features']))],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'extra_sub_event_price' => ['nullable', 'integer', 'min:0'],
            'assessment_addon_price' => ['nullable', 'integer', 'min:0'],
            'certificate_addon_price' => ['nullable', 'integer', 'min:0'],
        ], [
            'name.required' => 'Nama paket wajib diisi.',
            'share_percent.required_if' => 'Persentase bagi hasil wajib diisi.',
            'price.required_if' => 'Harga paket wajib diisi.',
        ]);

        $modules = array_values($data['modules'] ?? []);

        // Fitur grup non-umum hanya sah kalau modulnya dicentang
        $features = collect($data['features'] ?? [])
            ->filter(fn ($key) => in_array($catalog['features'][$key]['group'], array_merge(['umum'], $modules), true))
            ->values()
            ->all();

        return [
            'name' => $data['name'],
            'payment_type' => $data['payment_type'],
            'share_percent' => $data['payment_type'] === 'revenue_share' ? $data['share_percent'] : null,
            'price' => $data['payment_type'] === 'upfront' ? $data['price'] : null,
            'modules' => $modules,
            'features' => $features,
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'extra_sub_event_price' => $data['extra_sub_event_price'] ?? null,
            'assessment_addon_price' => $data['assessment_addon_price'] ?? null,
            'certificate_addon_price' => $data['certificate_addon_price'] ?? null,
        ];
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'paket';
        $slug = $base;
        $i = 2;

        while (Package::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
