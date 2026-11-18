import {
    Award, BarChart3, CalendarDays, CalendarRange, ClipboardCheck, ClipboardList, FileText, Gavel,
    LayoutDashboard, Megaphone, Receipt, ScanLine, Settings, Ticket, TrendingUp, Trophy, Users, Vote,
    type LucideIcon,
} from 'lucide-react';

// Kunci = nama menu di config/features.php ('menus'). Menu tanpa ikon di sini memakai ikon dashboard.
export const eventMenuIcons: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    registrasi: ClipboardList,
    kalender: CalendarDays,
    checkin: ScanLine,
    laporan: BarChart3,
    tiket: Ticket,
    sertifikat: Award,
    transaksi: Receipt,
    penilaian: ClipboardCheck,
    voting: Vote,
    // menu lama
    agenda: CalendarRange,
    statistik: TrendingUp,
    'pengaturan-tiket': Settings,
    'checkin-laporan': ScanLine,
    'pengaturan-voting': Settings,
    'laporan-voting': FileText,
    peserta: Users,
    'juri-penilaian': Gavel,
    'hasil-lomba': Trophy,
    publikasi: Megaphone,
};
