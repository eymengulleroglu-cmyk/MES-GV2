import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 3400);
    const t2 = setTimeout(() => setVisible(false), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500"
      style={{ backgroundColor: "var(--bg)", opacity: fade ? 0 : 1 }}
    >
      <div className="flex flex-col items-center gap-4">
        <Logo size={640} />
        <div className="text-sm text-muted">Yükleniyor...</div>
        <div className="text-xs text-muted mt-2">by Eymen GÜLLEROĞLU</div>
      </div>
    </div>
  );
}