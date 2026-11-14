import { Link } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import DashboardShell from '@/components/dashboard-shell';

export default function Dashboard() {
    return (
        <DashboardShell heading="Dashboard Pengguna">
            <Link
                href="/lembaga/daftar"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-800 via-blue-600 to-violet-600 px-6 py-3 font-bold text-white shadow-md shadow-indigo-600/25"
            >
                <Building2 className="h-5 w-5" />
                Daftarkan Lembaga
            </Link>
        </DashboardShell>
    );
}
