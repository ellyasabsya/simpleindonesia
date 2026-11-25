import { MUTED, FIELD, PRESS } from './soft';

export type SegmentItem<K extends string> = { key: K; label: string; dot?: boolean };

/** Segmen horizontal ala aplikasi: satu ketuk ganti isi, tanpa scroll panjang. */
export default function Segments<K extends string>({ items, value, onChange }: { items: SegmentItem<K>[]; value: K; onChange: (k: K) => void }) {
    return (
        <div role="tablist" className="flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none]">
            {items.map((s) => {
                const on = s.key === value;
                return (
                    <button
                        key={s.key}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => onChange(s.key)}
                        className={
                            'relative h-10 shrink-0 rounded-full px-4 text-[13px] font-medium ' +
                            PRESS +
                            (on ? ' bg-indigo-600 text-white shadow-[0_6px_14px_-6px_rgba(79,70,229,0.65)] dark:bg-indigo-500' : ' ' + FIELD + ' ' + MUTED)
                        }
                    >
                        {s.label}
                        {s.dot && !on && <span className="absolute top-1.5 right-2 size-1.5 rounded-full bg-indigo-500" />}
                    </button>
                );
            })}
        </div>
    );
}
