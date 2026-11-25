/** Slot iklan: kartu emas, selalu item pertama kolom kanan. Desain iklan dari admin nanti dipasang di sini. */
export default function FeaturedSlot() {
    return (
        <div
            aria-hidden
            data-ad-slot="featured"
            className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#fff7c2_0%,#ffd84d_22%,#e6a800_48%,#ffe680_70%,#c98f00_100%)] shadow-[0_8px_24px_rgba(230,168,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.8)] ring-1 ring-amber-200/80"
        >
            <style>{`@keyframes gold-sheen{0%{transform:translateX(-130%) skewX(-20deg)}60%,100%{transform:translateX(330%) skewX(-20deg)}}`}</style>
            <div
                className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:hidden"
                style={{ animation: 'gold-sheen 3.2s ease-in-out 3' }}
            />
        </div>
    );
}
