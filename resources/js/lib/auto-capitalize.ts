// Huruf besar otomatis untuk semua kolom teks. Matikan per kolom dengan atribut data-no-cap.
const SKIP_TYPES = new Set(['email', 'password', 'url', 'tel', 'number', 'search', 'date', 'datetime-local', 'time', 'month', 'week', 'color', 'file', 'hidden', 'checkbox', 'radio', 'range', 'submit', 'button']);
const SKIP_MODES = new Set(['numeric', 'decimal', 'tel', 'email', 'url', 'search']);
const SKIP_NAME = /(e-?mail|pass|user|login|url|link|website|domain|slug|code|kode|token|otp|captcha|search|query)/i;

const upper = (ch: string) => {
    const u = ch.toUpperCase();
    return u.length === 1 ? u : ch;
};
const capFirst = (v: string) => v.replace(/^(\s*)(\p{Ll})/u, (_m, a: string, b: string) => a + upper(b));
const capSentences = (v: string) => v.replace(/(^\s*|[.!?]\s+|\n\s*)(\p{Ll})/gu, (_m, a: string, b: string) => a + upper(b));

function eligible(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
    if (el instanceof HTMLTextAreaElement) {
        return !el.readOnly && !el.disabled && !el.hasAttribute('data-no-cap') && !el.closest('[data-no-cap]') && !SKIP_NAME.test(el.name || el.id || '');
    }
    if (el instanceof HTMLInputElement) {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        if (type !== 'text' || SKIP_TYPES.has(type)) return false;
        if (el.readOnly || el.disabled || el.hasAttribute('data-no-cap') || el.closest('[data-no-cap]')) return false;
        if (SKIP_MODES.has((el.inputMode || '').toLowerCase())) return false;
        if (SKIP_NAME.test(el.name || el.id || '')) return false;
        if (/^\s*cari/i.test(el.placeholder || '')) return false;
        const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
        if (ac === 'email' || ac === 'username' || ac === 'url' || ac.includes('password')) return false;
        return true;
    }
    return false;
}

if (typeof document !== 'undefined') {
    // Fase capture: nilai diubah sebelum React membaca event, memakai setter asli supaya onChange tetap terpicu.
    document.addEventListener('input', (e) => {
        const ev = e as InputEvent;
        if (ev.isComposing || (ev.inputType && (ev.inputType.startsWith('delete') || ev.inputType.startsWith('history')))) return;
        const el = e.target;
        if (!eligible(el)) return;
        const old = el.value;
        const next = el instanceof HTMLTextAreaElement ? capSentences(old) : capFirst(old);
        if (next === old) return;
        const pos = el.selectionStart;
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (!setter) return;
        setter.call(el, next);
        if (pos !== null) {
            try { el.setSelectionRange(pos, pos); } catch { /* abaikan */ }
        }
    }, true);
}

export {};
