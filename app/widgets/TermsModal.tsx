export function TermsModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#111] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase mb-4">Before you continue</p>
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] tracking-[0.06em] text-white/45 leading-relaxed">
              This app is offered as-is for personal use. While we strive to keep things running smoothly, this service provider cannot be held responsible for any issues, inaccuracies, or losses that may arise.
            </p>
            <p className="text-[10px] tracking-[0.06em] text-white/45 leading-relaxed">
              Prayer times, weather data, and Quran content are fetched from third-party services and may occasionally differ from official sources.
            </p>
            <p className="text-[10px] tracking-[0.06em] text-white/45 leading-relaxed">
              Your continued use of this app is taken as your acceptance of these terms.
            </p>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase mb-2">Powered by</p>
          <ul className="flex flex-col gap-1">
            {[
              ["Prayer Time API", "api.waktusolat.app"],
              ["AlQuran Cloud", "alquran.cloud"],
              ["Open-Meteo", "open-meteo.com"],
              ["ipify", "ipify.org"],
              ["Vercel", "vercel.com"],
            ].map(([name, url]) => (
              <li key={url} className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.1em] text-white/40">{name}</span>
                <span className="text-[10px] tracking-[0.08em] text-white/20 font-mono">{url}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onAccept}
            className="w-full py-2.5 text-xs tracking-[0.25em] text-white bg-white/10 border border-white/8 rounded-lg hover:bg-white/15 transition-colors uppercase"
          >
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}
