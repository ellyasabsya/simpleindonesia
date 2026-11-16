<?php

// Katalog fitur SIMPLE. Menambah fitur baru = menambah satu baris di 'features'.
// 'label'  : yang dilihat admin di form paket
// 'group'  : 'umum' selalu tampil; grup lain tampil bila modulnya dicentang
// 'menu'   : kunci menu di dashboard event yang dibuka fitur ini
return [
    'payment_types' => [
        'free' => 'Gratis',
        'upfront' => 'Bayar di muka',
        'revenue_share' => 'Bagi hasil',
    ],

    'modules' => [
        'iklan' => ['label' => 'Iklan', 'description' => 'Promosi dan penayangan event', 'icon' => '📢'],
        'ticketing' => ['label' => 'Ticketing', 'description' => 'Penjualan dan pengelolaan tiket', 'icon' => '🎟️'],
        'voting' => ['label' => 'Voting', 'description' => 'Pemungutan suara peserta', 'icon' => '🗳️'],
        'lomba' => ['label' => 'Manajemen Lomba', 'description' => 'Peserta, juri, penilaian, dan hasil lomba', 'icon' => '🏆'],
    ],

    'groups' => [
        'umum' => 'Umum',
        'iklan' => 'Iklan',
        'ticketing' => 'Ticketing',
        'voting' => 'Voting',
        'lomba' => 'Lomba',
    ],

    // Menu dashboard event (dipakai nanti untuk membangun sidebar)
    'menus' => [
        'dashboard' => 'Dashboard',
        'agenda' => 'Agenda Event',
        'sertifikat' => 'Sertifikat',
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
        'dashboard_event' => ['label' => 'Dashboard Event', 'group' => 'umum', 'menu' => 'dashboard'],
        'agenda_event' => ['label' => 'Agenda event', 'group' => 'umum', 'menu' => 'agenda'],
        'sertifikat' => ['label' => 'Sertifikat digital', 'group' => 'umum', 'menu' => 'sertifikat'],
        'statistik' => ['label' => 'Statistik dan analitik', 'group' => 'umum', 'menu' => 'statistik'],
        'dukungan_prioritas' => ['label' => 'Dukungan prioritas', 'group' => 'umum', 'menu' => null],

        // Ticketing (Check-in dan Laporan tiket membuka satu menu yang sama)
        'ticket_sales' => ['label' => 'Penjualan tiket', 'group' => 'ticketing', 'menu' => 'pengaturan-tiket'],
        'ticket_checkin' => ['label' => 'Check-in', 'group' => 'ticketing', 'menu' => 'checkin-laporan'],
        'ticket_report' => ['label' => 'Laporan tiket', 'group' => 'ticketing', 'menu' => 'checkin-laporan'],

        // Voting
        'voting_setup' => ['label' => 'Pengaturan voting', 'group' => 'voting', 'menu' => 'pengaturan-voting'],
        'voting_report' => ['label' => 'Laporan voting', 'group' => 'voting', 'menu' => 'laporan-voting'],

        // Lomba
        'lomba_participants' => ['label' => 'Peserta lomba', 'group' => 'lomba', 'menu' => 'peserta'],
        'lomba_judging' => ['label' => 'Juri dan penilaian', 'group' => 'lomba', 'menu' => 'juri-penilaian'],
        'lomba_results' => ['label' => 'Hasil lomba', 'group' => 'lomba', 'menu' => 'hasil-lomba'],

        // Iklan
        'ad_publication' => ['label' => 'Publikasi event', 'group' => 'iklan', 'menu' => 'publikasi'],
    ],
];
