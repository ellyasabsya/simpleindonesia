<?php

// Katalog fitur SIMPLE. Menambah fitur baru = menambah satu baris di 'features'.
// 'label'  : yang dilihat admin di form paket
// 'group'  : 'umum' selalu tampil; grup lain tampil bila modulnya dicentang
// 'menu'   : kunci menu di dashboard event yang dibuka fitur ini (null = lewat form pendaftaran event)
return [
    'payment_types' => [
        'free' => 'Gratis',
        'upfront' => 'Bayar di muka',
        'revenue_share' => 'Bagi hasil',
    ],

    'modules' => [
        'iklan' => ['label' => 'Iklan', 'description' => 'Dashboard, registrasi, dan kalender kegiatan', 'icon' => '📢'],
        'starter' => ['label' => 'Starter', 'description' => 'Sub-event, check-in, dan laporan gabungan', 'icon' => '🚀'],
        'professional' => ['label' => 'Professional', 'description' => 'Tiket, pembayaran, sertifikat, penilaian, voting, dan tim', 'icon' => '💼'],
        'ticketing' => ['label' => 'Ticketing', 'description' => 'Penjualan dan pengelolaan tiket', 'icon' => '🎟️'],
        'voting' => ['label' => 'Voting', 'description' => 'Pemungutan suara peserta', 'icon' => '🗳️'],
        'lomba' => ['label' => 'Manajemen Lomba', 'description' => 'Peserta, juri, penilaian, dan hasil lomba', 'icon' => '🏆'],
    ],

    'groups' => [
        'umum' => 'Umum',
        'iklan' => 'Iklan',
        'starter' => 'Starter',
        'professional' => 'Professional',
        'ticketing' => 'Ticketing',
        'voting' => 'Voting',
        'lomba' => 'Lomba',
    ],

    // Menu dashboard event (dipakai nanti untuk membangun sidebar)
    'menus' => [
        'dashboard' => 'Dashboard',
        'registrasi' => 'Registrasi',
        'kalender' => 'Kalender Kegiatan',
        'checkin' => 'Check-in',
        'laporan' => 'Laporan',
        'tiket' => 'Tiket',
        'sertifikat' => 'Sertifikat',
        'transaksi' => 'Transaksi',
        'penilaian' => 'Penilaian',
        'voting' => 'Voting',
        // menu lama (masih dipakai snapshot event yang sudah ada)
        'agenda' => 'Agenda Event',
        'statistik' => 'Statistik',
        'pengaturan-tiket' => 'Pengaturan Tiket',
        'checkin-laporan' => 'Check-in & Laporan',
        'pengaturan-voting' => 'Pengaturan Voting',
        'laporan-voting' => 'Laporan Voting',
        'peserta' => 'Peserta',
        'juri-penilaian' => 'Juri & Penilaian',
        'hasil-lomba' => 'Hasil Lomba',
        'publikasi' => 'Publikasi Event',
    ],

    'features' => [
        // Umum
        'dashboard_event' => ['label' => 'Dashboard induk', 'group' => 'umum', 'menu' => 'dashboard'],
        'sertifikat' => ['label' => 'Sertifikat otomatis', 'group' => 'umum', 'menu' => 'sertifikat'],
        'agenda_event' => ['label' => 'Agenda event (lama)', 'group' => 'umum', 'menu' => 'agenda'],
        'statistik' => ['label' => 'Statistik dan analitik', 'group' => 'umum', 'menu' => 'statistik'],
        'dukungan_prioritas' => ['label' => 'Dukungan prioritas', 'group' => 'umum', 'menu' => null],

        // Iklan
        'registrasi_event' => ['label' => 'Registrasi event', 'group' => 'iklan', 'menu' => 'registrasi'],
        'kalender_kegiatan' => ['label' => 'Kalender kegiatan', 'group' => 'iklan', 'menu' => 'kalender'],
        'ad_publication' => ['label' => 'Publikasi event (lama)', 'group' => 'iklan', 'menu' => 'publikasi'],

        // Starter
        'sub_event' => ['label' => 'Sub-event', 'group' => 'starter', 'menu' => null],
        'qr_checkin' => ['label' => 'QR code dan check-in', 'group' => 'starter', 'menu' => 'checkin'],
        'laporan_gabungan' => ['label' => 'Laporan gabungan', 'group' => 'starter', 'menu' => 'laporan'],

        // Professional (Multi-jenis tiket dan Pembayaran online membuka satu menu yang sama)
        'tiket_multi' => ['label' => 'Multi-jenis tiket', 'group' => 'professional', 'menu' => 'tiket'],
        'pembayaran_online' => ['label' => 'Pembayaran online', 'group' => 'professional', 'menu' => 'tiket'],
        'laporan_transaksi' => ['label' => 'Laporan transaksi', 'group' => 'professional', 'menu' => 'transaksi'],
        'penilaian_juri' => ['label' => 'Penilaian juri', 'group' => 'professional', 'menu' => 'penilaian'],
        'voting_event' => ['label' => 'Voting', 'group' => 'professional', 'menu' => 'voting'],
        'manajemen_tim' => ['label' => 'Manajemen tim', 'group' => 'professional', 'menu' => null],

        // Lama (tidak dipakai paket baru, dipertahankan untuk snapshot event yang sudah ada)
        'ticket_sales' => ['label' => 'Penjualan tiket (lama)', 'group' => 'ticketing', 'menu' => 'pengaturan-tiket'],
        'ticket_checkin' => ['label' => 'Check-in (lama)', 'group' => 'ticketing', 'menu' => 'checkin-laporan'],
        'ticket_report' => ['label' => 'Laporan tiket (lama)', 'group' => 'ticketing', 'menu' => 'checkin-laporan'],
        'voting_setup' => ['label' => 'Pengaturan voting (lama)', 'group' => 'voting', 'menu' => 'pengaturan-voting'],
        'voting_report' => ['label' => 'Laporan voting (lama)', 'group' => 'voting', 'menu' => 'laporan-voting'],
        'lomba_participants' => ['label' => 'Peserta lomba', 'group' => 'lomba', 'menu' => 'peserta'],
        'lomba_judging' => ['label' => 'Juri dan penilaian', 'group' => 'lomba', 'menu' => 'juri-penilaian'],
        'lomba_results' => ['label' => 'Hasil lomba', 'group' => 'lomba', 'menu' => 'hasil-lomba'],
    ],
];
