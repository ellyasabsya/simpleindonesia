<?php

// Peta add-on -> fitur yang dibuka. Harga hanya boleh aktif kalau fitur & menunya ada.
return [
    'assessment_addon' => ['label' => 'Sistem penilaian', 'price_column' => 'assessment_addon_price', 'features' => ['penilaian_juri']],
    'certificate_addon' => ['label' => 'Sertifikat otomatis', 'price_column' => 'certificate_addon_price', 'features' => ['sertifikat']],
    // add-on lama, hanya agar event lama tetap terbuka
    'judge_addon' => ['label' => 'Tambah juri (lama)', 'price_column' => 'judge_addon_price', 'features' => ['penilaian_juri'], 'legacy' => true],
];
