import { useEffect, useState } from "react";
import { useTheme } from "../components/ThemeProvider";
import { useQueryClient } from "@tanstack/react-query";
import { store } from "../data/store";
import { getSyncStatus, connectSync, disconnectSync, syncNow, type SyncStatus } from "../data/sync";
import { APP_VERSION, CHANGELOG } from "../version";
import { RotateCcw, Moon, Sun, Cloud, CloudOff, RefreshCw, Link2, Unlink, History } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [sync, setSync] = useState<SyncStatus>(() => getSyncStatus());
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [note, setNote] = useState("");

  // Senkronizasyon durumunu canlı izle
  useEffect(() => {
    const update = () => setSync(getSyncStatus());
    update();
    window.addEventListener("mesg-sync-status", update);
    const t = window.setInterval(update, 1000);
    return () => {
      window.removeEventListener("mesg-sync-status", update);
      window.clearInterval(t);
    };
  }, []);

  const reset = () => {
    if (confirm("Tüm kayıtlar silinsin mi? (Senkronizasyon ayarları korunur)")) {
      store.reset();
      Object.keys(localStorage).forEach((k) => {
        // Verileri sil, senkronizasyon ayarlarını (mesg-sync-*) koru
        if (k.startsWith("mesg-") && !k.startsWith("mesg-sync-")) localStorage.removeItem(k);
      });
      // Sıfırlanan veriyi buluta da yaz
      localStorage.setItem("mesg-sync-forcepush", "1");
      queryClient.invalidateQueries();
      window.location.reload();
    }
  };

  const doConnect = async () => {
    setConnecting(true);
    setNote("");
    await connectSync(token.trim());
    setConnecting(false);
    const s = getSyncStatus();
    setSync(s);
    if (s.connected) {
      setToken("");
      setNote("Bağlandı! Verileriniz buluta kaydediliyor.");
    }
  };

  const doDisconnect = () => {
    if (confirm("Senkronizasyon kapatılsın mı? Yerel veriler silinmez.")) {
      disconnectSync();
      setSync(getSyncStatus());
      setNote("Senkronizasyon kapatıldı.");
    }
  };

  const doSyncNow = async () => {
    setNote("");
    await syncNow();
    setSync(getSyncStatus());
    setNote("Senkronizasyon tamamlandı.");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted text-sm">Tema, senkronizasyon ve veri yönetimi</p>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Tema</h2>
        <div className="flex gap-2">
          <button onClick={() => setTheme("light")} className="btn-ghost" style={theme === "light" ? { backgroundColor: "var(--accent)", color: "#0b0e14" } : {}}>
            <Sun size={16} /> Açık
          </button>
          <button onClick={() => setTheme("dark")} className="btn-ghost" style={theme === "dark" ? { backgroundColor: "var(--accent)", color: "#0b0e14" } : {}}>
            <Moon size={16} /> Koyu
          </button>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          {sync.connected ? <Cloud size={18} style={{ color: "var(--success)" }} /> : <CloudOff size={18} className="text-muted" />}
          <h2 className="font-semibold">Bulut Senkronizasyonu</h2>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: sync.connected ? "color-mix(in srgb, var(--success) 18%, transparent)" : "color-mix(in srgb, var(--muted) 20%, transparent)",
              color: sync.connected ? "var(--success)" : "var(--muted)",
            }}
          >
            {sync.connected ? "Açık" : "Kapalı"}
          </span>
        </div>

        <p className="text-sm text-muted">
          Açıkken eklediğiniz her kayıt (makine, iş emri, fire, arıza...) internette saklanır; başka bir bilgisayardan
          giriş yaptığınızda aynı veriler otomatik görünür.
        </p>

        {!sync.connected ? (
          <div className="space-y-2">
            <ol className="list-decimal pl-5 text-xs text-muted space-y-1">
              <li>
                <a href="https://github.com/settings/tokens/new?scopes=gist&description=MES-G" target="_blank" rel="noreferrer" className="underline" style={{ color: "var(--accent)" }}>
                  GitHub token sayfasını
                </a>{" "}
                açın (yeni sekmede açılır).
              </li>
              <li>Alt kısımdaki <strong>Generate token</strong> düğmesine basın.</li>
              <li>Oluşan kodu kopyalayıp aşağıya yapıştırın.</li>
            </ol>
            <div className="flex gap-2">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="GitHub token (ghp_...)"
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                style={{ minWidth: 0 }}
              />
              <button onClick={doConnect} disabled={connecting || !token.trim()} className="btn-primary whitespace-nowrap">
                <Link2 size={14} /> {connecting ? "Bağlanıyor..." : "Bağlan"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={doSyncNow} disabled={sync.busy} className="btn-ghost">
              <RefreshCw size={14} className={sync.busy ? "animate-spin" : ""} /> Şimdi Eşitle
            </button>
            <button onClick={doDisconnect} className="btn-ghost" style={{ color: "var(--danger)" }}>
              <Unlink size={14} /> Senkronizasyonu Kapat
            </button>
          </div>
        )}

        {sync.connected && (
          <p className="text-xs text-muted">
            Son eşitleme: {sync.lastSync ? new Date(sync.lastSync).toLocaleString("tr-TR") : "henüz yok"}
          </p>
        )}
        {sync.lastError && <p className="text-xs" style={{ color: "var(--danger)" }}>{sync.lastError}</p>}
        {note && !sync.lastError && <p className="text-xs" style={{ color: "var(--success)" }}>{note}</p>}
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Veri Yönetimi</h2>
        <p className="text-sm text-muted">Sıfırlama tüm kayıtları siler ve sistemi başlangıç senaryosuna döndürür. Senkronizasyon ayarları korunur ve yeni başlangıç verisi buluta yazılır.</p>
        <button onClick={reset} className="btn-danger">
          <RotateCcw size={14} /> Verileri Sıfırla
        </button>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <History size={18} style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold">Sürüm Geçmişi</h2>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)", color: "var(--accent)" }}
          >
            v{APP_VERSION}
          </span>
        </div>
        <div className="space-y-3">
          {CHANGELOG.map((rel) => (
            <div key={rel.version} className="border-l-2 pl-3" style={{ borderColor: rel.version === APP_VERSION ? "var(--accent)" : "var(--border)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold" style={{ color: rel.version === APP_VERSION ? "var(--accent)" : "var(--text)" }}>
                  v{rel.version}
                </span>
                <span className="text-xs font-semibold">{rel.title}</span>
                <span className="text-xs text-muted">{rel.date}</span>
              </div>
              <ul className="list-disc pl-4 text-xs text-muted space-y-0.5 mt-1">
                {rel.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
