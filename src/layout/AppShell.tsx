import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../components/ThemeProvider";
import { Logo } from "../components/Logo";
import Splash from "../components/Splash";
import GlobalSearch from "../components/GlobalSearch";
import { APP_VERSION } from "../version";
import { Moon, Sun, ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAlarmCount } from "../data/alarms";
import { getRole, setRole, ROLE_GROUPS, ROLE_LABELS, type Role } from "../data/roles";

type NavTone = "planlama" | "uretim" | "live" | "makine" | "kalite" | "stok" | "izlenebilirlik" | "raporlar" | "yonetim";

// Tailwind only keeps component-layer classes it can see in source, so keep these literal.
const toneClass: Record<NavTone, string> = {
  planlama: "nav-group--planlama",
  uretim: "nav-group--uretim",
  live: "nav-group--live",
  makine: "nav-group--makine",
  kalite: "nav-group--kalite",
  stok: "nav-group--stok",
  izlenebilirlik: "nav-group--izlenebilirlik",
  raporlar: "nav-group--raporlar",
  yonetim: "nav-group--yonetim",
};

interface NavItem { to: string; label: string; badge?: "alarmlar" }
interface NavGroup { title: string; tone: NavTone; items: NavItem[] }

const sections: { title: string; groups: NavGroup[] }[] = [
  {
    title: "1. Kısım — Üretim & Kalite",
    groups: [
      { title: "Planlama", tone: "planlama", items: [
        { to: "/planlama", label: "Üretim Planlama" },
        { to: "/siparisler", label: "Siparişler" },
        { to: "/urunler", label: "Ürünler" },
        { to: "/yonetim/musteriler", label: "Müşteriler" },
      ] },
      { title: "Üretim", tone: "uretim", items: [
        { to: "/emirler", label: "İş Emirleri" },
        { to: "/uretim/uretim-girisi", label: "Üretim Girişi" },
        { to: "/uretim/uretim-takibi", label: "Üretim Takibi" },
        { to: "/uretim/vardiya-plani", label: "Vardiya Planı" },
      ] },
      { title: "Canlı İzleme", tone: "live", items: [
        { to: "/simulasyon", label: "Üretim Simülasyonu" },
        { to: "/andon", label: "Andon Panosu" },
        { to: "/alarmlar", label: "Olay & Alarm Merkezi", badge: "alarmlar" },
      ] },
      { title: "Makine", tone: "makine", items: [
        { to: "/is-merkezleri", label: "İş Merkezleri" },
        { to: "/makine/liste", label: "Makine Listesi" },
        { to: "/makine/arizalar", label: "Arıza Nedenleri" },
        { to: "/makine/bakim", label: "Bakım Planları" },
        { to: "/makine/oee", label: "OEE" },
        { to: "/durus-fire", label: "Duruş & Fire" },
      ] },
      { title: "Kalite", tone: "kalite", items: [
        { to: "/kalite/kontrol", label: "Kontrol Parametreleri" },
        { to: "/kalite/olcumler", label: "Kalite Ölçüm Kayıtları" },
        { to: "/kalite/hata", label: "Hata Türleri" },
        { to: "/kalite/spc", label: "SPC" },
      ] },
    ],
  },
  {
    title: "2. Kısım — Stok & İzlenebilirlik",
    groups: [
      { title: "Stok", tone: "stok", items: [
        { to: "/stok/hammadde", label: "Hammadde" },
        { to: "/stok/hareketler", label: "Stok Hareketleri" },
        { to: "/stok/yari-mamul", label: "Yarı Mamul" },
        { to: "/stok/mamul", label: "Mamul" },
      ] },
      { title: "İzlenebilirlik", tone: "izlenebilirlik", items: [
        { to: "/izlenebilirlik/lot", label: "Lot Takibi" },
        { to: "/izlenebilirlik/seri-no", label: "Seri No Takibi" },
        { to: "/izlenebilirlik/sorgu", label: "İzlenebilirlik Sorgu" },
      ] },
    ],
  },
  {
    title: "3. Kısım — Raporlar & Yönetim",
    groups: [
      { title: "Raporlar", tone: "raporlar", items: [
        { to: "/raporlar/uretim", label: "Üretim" },
        { to: "/raporlar/verimlilik", label: "Verimlilik" },
        { to: "/raporlar/ariza", label: "Arıza" },
        { to: "/raporlar/kalite", label: "Kalite" },
        { to: "/raporlar/kayip-analizi", label: "Kayıp Analizi" },
      ] },
      { title: "Yönetim", tone: "yonetim", items: [
        { to: "/yonetim/kullanicilar", label: "Kullanıcılar" },
        { to: "/yonetim/musteriler", label: "Müşteriler" },
        { to: "/yonetim/denetim-kaydi", label: "Denetim Kaydı" },
        { to: "/yonetim/yetkiler", label: "Yetkiler" },
        { to: "/yonetim/alarm-kurallari", label: "Alarm Kuralları" },
        { to: "/ayarlar", label: "Sistem Ayarları" },
        { to: "/kullanim-talimati", label: "Kullanım Talimatı" },
      ] },
    ],
  },
];

interface NavSectionsProps {
  role: Role;
  alarmCount: number;
  openGroups: Record<string, boolean>;
  toggleGroup: (title: string) => void;
  onNavigate?: () => void;
}

function NavSections({ role, alarmCount, openGroups, toggleGroup, onNavigate }: NavSectionsProps) {
  const allowed = ROLE_GROUPS[role];
  const visibleGroups = (g: NavGroup) => allowed.includes("*") || allowed.includes(g.title);

  return (
    <>
      <NavLink to="/" end onClick={onNavigate} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>
        Pano
      </NavLink>
      {sections.map((s) => (
        <div key={s.title} className="nav-section">
          <div className="nav-section__title">{s.title}</div>
          {s.groups.filter(visibleGroups).map((g) => {
            const open = openGroups[g.title] ?? true;
            return (
              <div key={g.title} className={`nav-group ${toneClass[g.tone]}`}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.title)}
                  className="nav-group__button"
                  aria-expanded={open}
                >
                  <span className="nav-group__dot" aria-hidden="true" />
                  <span className="flex-1 text-left">{g.title}</span>
                  {open ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
                </button>
                {open && (
                  <div className="nav-group__rail">
                    {g.items.map((n) => (
                      <NavLink
                        key={n.to}
                        to={n.to}
                        onClick={onNavigate}
                        className={({ isActive }) => `nav-link nav-group__item${isActive ? " is-active" : ""}`}
                      >
                        <span className="flex-1 truncate">{n.label}</span>
                        {n.badge === "alarmlar" && alarmCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                            {alarmCount}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

function RoleSelect({ role, onChange, label }: { role: Role; onChange: (role: Role) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={role}
        onChange={(e) => onChange(e.target.value as Role)}
        className="input !w-auto !py-1 !px-2 text-xs"
        aria-label={label}
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
    </label>
  );
}

export function AppShell() {
  const { theme, toggle } = useTheme();
  const alarmCount = useAlarmCount();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRoleState] = useState<Role>(() => getRole());
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setRoleState(getRole());
    window.addEventListener("mesg-role-changed", handler);
    return () => window.removeEventListener("mesg-role-changed", handler);
  }, []);

  const toggleGroup = (title: string) => setOpenGroups((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));
  const changeRole = (r: Role) => {
    setRole(r);
    setRoleState(r);
    window.dispatchEvent(new Event("mesg-role-changed"));
  };
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = drawerRef.current;
    const focusable = () => Array.from(drawer?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])') ?? [])
      .filter((el) => el.getClientRects().length > 0);
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, closeMobile]);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <Splash />
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r h-screen min-h-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="p-4 border-b flex items-center justify-between gap-2 min-w-0" style={{ borderColor: "var(--border)" }}>
          <Logo size={96} />
          <GlobalSearch />
        </div>
        <nav aria-label="Ana menü" className="flex-1 p-2 space-y-3 overflow-auto min-h-0">
          <NavSections role={role} alarmCount={alarmCount} openGroups={openGroups} toggleGroup={toggleGroup} />
        </nav>
        <div className="p-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted" style={{ borderColor: "var(--border)" }}>
          <span className="min-w-0 truncate">MES-G · v{APP_VERSION}</span>
          <div className="flex items-center gap-2">
            <RoleSelect role={role} onChange={changeRole} label="Demo rolü" />
            <button onClick={toggle} className="btn-ghost !px-2 !py-1.5" aria-label="Tema değiştir">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between gap-2 p-3 border-b min-w-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <button ref={menuButtonRef} onClick={() => setMobileOpen(true)} className="btn-ghost !px-2 !py-1.5 shrink-0" aria-label="Menüyü aç" aria-expanded={mobileOpen}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <Logo size={28} />
        <div className="min-w-0 flex-1"><GlobalSearch /></div>
        <button onClick={toggle} className="btn-ghost !px-2 !py-1.5 shrink-0" aria-label="Tema değiştir">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={closeMobile} aria-hidden="true" />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Ana menü" className="relative w-72 max-w-[85vw] h-full overflow-auto border-r" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="p-3 border-b flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
              <Logo size={72} />
              <button onClick={closeMobile} className="btn-ghost !px-2 !py-1.5" aria-label="Menüyü kapat">✕</button>
            </div>
            <nav aria-label="Mobil menü" className="p-2 space-y-3">
              <NavSections role={role} alarmCount={alarmCount} openGroups={openGroups} toggleGroup={toggleGroup} onNavigate={closeMobile} />
            </nav>
            <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
              <RoleSelect role={role} onChange={changeRole} label="Demo rolü" />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-auto h-screen pb-16 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 inset-x-0 text-center text-[10px] text-muted py-1" style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        MES-G · v{APP_VERSION}
      </div>
    </div>
  );
}
