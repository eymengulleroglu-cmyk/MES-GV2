import { useEffect, useState, useRef } from "react";
import { useTheme } from "../components/ThemeProvider";
import { useQueryClient } from "@tanstack/react-query";
import { store } from "../data/store";
import { getSyncStatus, connectSync, disconnectSync, syncNow, type SyncStatus } from "../data/sync";
import { APP_VERSION, CHANGELOG } from "../version";
import { getRole, setRole, ROLE_LABELS, type Role } from "../data/roles";
import { isApiMode, API_BASE } from "../data/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { RotateCcw, Moon, Sun, Cloud, CloudOff, RefreshCw, Link2, Unlink, History, Download, Upload, Server, Database } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [sync, setSync] = useState<SyncStatus>(() => getSyncStatus());
  const [role, setRoleState] = useState<Role>(() => getRole());
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [note, setNote] = useState("");
  const [pendingReset, setPendingReset] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const reset = () => setPendingReset(true);
  const doReset = () => {
    store.reset();
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("mesg-") && !k.startsWith("mesg-sync-")) localStorage.removeItem(k);
    });
    localStorage.setItem("mesg-sync-forcepush", "1");
    queryClient.invalidateQueries();
    setPendingReset(false);
    window.location.reload();
  };

  const exportData = () => {
    const data: Record<string, any> = {};
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("mesg-")) {
        try { data[k] = JSON.parse(localStorage.getItem(k) ?? "null"); } catch { data[k] = localStorage.getItem(k); }
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mes-g-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNote("Yedek dosyası indirildi.");
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith("mesg-")) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
        });
        queryClient.invalidateQueries();
        setNote("Yedek geri yüklendi. Sayfa yenileniyor...");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        setNote("Dosya okunamadı — geçersiz JSON.");
      }
    };
    reader.readAsText(file);
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

  const doDisconnect = () => setPendingDisconnect(true);
  const confirmDisconnect = () => { disconnectSync(); setSync(getSyncStatus()); setNote("Senkronizasyon kapatıldı."); setPendingDisconnect(false); };

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
        <h2 className="font-semibold">Rol (Demo)</h2>
        <p className="text-sm text-muted">Menü görünürlüğünü rol bazlı filtreler. Gerçek uygulamada sunucu tarafında doğrulanır.</p>
        <select className="input" value={role} onChange={(e) => { const r = e.target.value as Role; setRole(r); setRoleState(r); window.dispatchEvent(new Event("mesg-role-changed")); }}>
          {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Tema</h2>
        <div className="flex gap-2">
          <button onClick={() => setTheme("light")} className="btn-ghost" style={theme === "light" ? { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" } : {}}>
            <Sun size={16} /> Açık
          </button>
          <button onClick={() => setTheme("dark")} className="btn-ghost" style={theme === "dark" ? { backgroundColor: "var(--accent)", color: "var(--accent-foreground)" } : {}}>
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
        <div className="flex items-center gap-2">
          <Server size={18} style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold">Bağlantı Modu</h2>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: isApiMode() ? "color-mix(in srgb, var(--success) 18%, transparent)" : "color-mix(in srgb, var(--warning) 18%, transparent)", color: isApiMode() ? "var(--success)" : "var(--warning)" }}>
            {isApiMode() ? "API Modu" : "Demo Modu (localStorage)"}
          </span>
        </div>
        <p className="text-sm text-muted">
          {isApiMode()
            ? `Backend'e bağlı: ${API_BASE}. Veriler sunucu veritabanında saklanır.`
            : "VITE_API_URL tanımlı değil. Uygulama tarayıcı depolamasında (localStorage) demo modunda çalışır. Backend kurulumu için server/README.md dosyasına bakın."}
        </p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Database size={18} style={{ color: "var(--accent)" }} />
          <h2 className="font-semibold">Yedekleme / Geri Yükleme</h2>
        </div>
        <p className="text-sm text-muted">Tüm yerel verileri JSON olarak indirin veya daha önce alınmış bir yedeği geri yükleyin.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className="btn-ghost"><Download size={14} /> Yedek İndir</button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost"><Upload size={14} /> Yedek Yükle</button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
        </div>
        {note && <p className="text-xs" style={{ color: "var(--success)" }}>{note}</p>}
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-semibold">Entegrasyon Durumu</h2>
        <p className="text-sm text-muted">
          Makine bağlantısı (PLC/SCADA), barkod okuyucu ve ERP entegrasyonu henüz uygulanmamıştır (planlandı / desteklenmiyor).
          Bu sürümde veri girişleri manuel veya simülasyon ile yapılır. Entegrasyon noktaları sonradan eklenebilir şekilde tasarlanmıştır.
        </p>
      </div>

      <div className="card p-4 space-y-3">
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
      {pendingReset && (
        <ConfirmDialog open title="Verileri Sıfırla" message="Tüm kayıtlar silinip başlangıç senaryosuna dönülecek. Senkronizasyon ayarları korunur. Devam edilsin mi?" confirmLabel="Sıfırla" danger onConfirm={doReset} onCancel={() => setPendingReset(false)} />
      )}
      {pendingDisconnect && (
        <ConfirmDialog open title="Senkronizasyonu Kapat" message="Senkronizasyon kapatılacak. Yerel veriler silinmez." confirmLabel="Kapat" onConfirm={confirmDisconnect} onCancel={() => setPendingDisconnect(false)} />
      )}
    </div>
  );
}
