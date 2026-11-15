import PanelLayout from '@/components/panel/panel-layout';

export default function PanelPlaceholder({ title }: { title: string }) {
    return (
        <PanelLayout title={title}>
            <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-10 text-center backdrop-blur dark:border-white/15 dark:bg-white/5">
                <h2 className="title-gradient text-3xl font-extrabold">{title}</h2>
                <p className="mt-3 text-slate-500 dark:text-slate-400">Segera hadir. Halaman ini kita isi di tahap berikutnya.</p>
            </div>
        </PanelLayout>
    );
}
