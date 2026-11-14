export default function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white/60 py-8 backdrop-blur dark:border-white/10 dark:bg-indigo-950/40">
            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} SIMPLE. Semua hak dilindungi.
            </p>
        </footer>
    );
}
