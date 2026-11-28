import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1700);
    const t2 = setTimeout(() => setVisible(false), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const skip = () => { setFade(true); setTimeout(() => setVisible(false), 200); };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-400 cursor-pointer overflow-hidden"
      style={{ backgroundColor: "var(--bg)", opacity: fade ? 0 : 1 }}
      onClick={skip}
    >
      {/* arka plan gradient + glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%), radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--accent-2, var(--accent)) 12%, transparent), transparent 60%)",
        }}
      />
      {/* pulse rings */}
      <div className="absolute" style={{ width: 360, height: 360 }}>
        <span className="absolute inset-0 rounded-full" style={{ border: "2px solid var(--accent)", animation: "splashRing 1.8s ease-out infinite" }} />
        <span className="absolute inset-0 rounded-full" style={{ border: "2px solid var(--accent)", animation: "splashRing 1.8s ease-out infinite 0.6s" }} />
        <span className="absolute inset-0 rounded-full" style={{ border: "2px solid var(--accent)", animation: "splashRing 1.8s ease-out infinite 1.2s" }} />
      </div>

      <div className="relative flex flex-col items-center gap-6" style={{ animation: "splashFadeIn 0.8s ease-out both" }}>
        <div style={{ animation: "splashFloat 2.4s ease-in-out infinite, splashGlow 2s ease-in-out infinite" }}>
          <Logo size={300} />
        </div>
        <div className="flex flex-col items-center gap-1.5" style={{ animation: "splashSlide 0.8s ease-out 0.25s both" }}>
          <div className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            MES-G
          </div>
          <div className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>
            Üretim Yürütme Sistemi
          </div>
        </div>
        {/* progress bar */}
        <div className="w-56 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
          <div className="h-full rounded-full" style={{ backgroundColor: "var(--accent)", animation: "splashBar 1.6s ease-out both", boxShadow: "0 0 12px var(--accent)" }} />
        </div>
        <div className="text-[11px] text-muted" style={{ animation: "splashSlide 0.8s ease-out 0.5s both" }}>
          Yükleniyor… (atlamak için tıklayın)
        </div>
      </div>
    </div>
  );
}
