// Satu-satunya tempat mengatur background: landing page, login, dan register.
export default function PageBackground() {
    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gradient-to-br from-blue-100 via-slate-50 to-purple-100 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900"
        >
            <div className="smoke smoke-a" />
            <div className="smoke smoke-b" />
            <div className="smoke smoke-c" />
            <div className="bg-grid absolute inset-0" />
        </div>
    );
}
