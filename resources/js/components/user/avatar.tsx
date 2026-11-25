import { useEffect, useState } from 'react';

/** Ubah http://host/storage/x menjadi /storage/x supaya tidak bergantung pada APP_URL. */
export const assetUrl = (src?: string | null) => (src ? src.replace(/^https?:\/\/[^/]+(?=\/storage\/)/, '') : null);

export default function Avatar({ name, src, className = 'h-9 w-9 rounded-full text-sm' }: { name: string; src?: string | null; className?: string }) {
    const [broken, setBroken] = useState(false);
    const url = assetUrl(src);
    useEffect(() => setBroken(false), [url]);

    if (url && !broken) {
        return <img src={url} alt={name} onError={() => setBroken(true)} className={`${className} shrink-0 object-cover`} />;
    }

    return (
        <span className={`${className} flex shrink-0 items-center justify-center bg-indigo-600 font-semibold text-white`}>
            {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
    );
}
