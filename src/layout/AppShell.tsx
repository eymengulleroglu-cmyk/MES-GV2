import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../components/ThemeProvider";
import { Logo } from "../components/Logo";
import Splash from "../components/Splash";
import GlobalSearch from "../components/GlobalSearch";
import { APP_VERSION } from "../version";
import { Moon, Sun, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const sections = [
  {
    title: "1. Kısım — Üretim & Kalite",
    groups: [
      { title: "Üretim", items: [ { to: "/siparisler", label: "Siparişler" }, { to: "/urunler", label: "Ürünler" }, { to: "/emirler", label: "İş Emirleri" }, { to: "/uretim/uretim-girisi", label: "Üretim Girişi" }, { to: "/uretim/uretim-takibi", label: "Üretim Takibi" } ] },
      { title: "Makine", items: [ { to: "/is-merkezleri", label: "İş Merkezleri" }, { to: "/makine/liste", label: "Makine Listesi" }, { to: "/makine/arizalar", label: "Arıza Nedenleri" }, { to: "/makine/bakim", label: "Bakım Planları" }, { to: "/makine/oee", label: "OEE" }, { to: "/durus-fire", label: "Duruş & Fire" } ] },
      { title: "Kalite", items: [ { to: "/kalite/kontrol", label: "Kontrol Parametreleri" }, { to: "/kalite/hata", label: "Hata Türleri" }, { to: "/kalite/spc", label: "SPC" } ] },
    ],
  },
  {
    title: "2. Kısım — Stok & İzlenebilirlik",
    groups: [
      { title: "Stok", items: [ { to: "/stok/hammadde", label: "Hammadde" }, { to: "/stok/yari-mamul", label: "Yarı Mamul" }, { to: "/stok/mamul", label: "Mamul" } ] },
      { title: "İzlenebilirlik", items: [ { to: "/izlenebilirlik/lot", label: "Lot Takibi" }, { to: "/izlenebilirlik/seri-no", label: "Seri No Takibi" } ] },
    ],
  },
  {
    title: "3. Kısım — Raporlar & Yönetim",
    groups: [
      { title: "Raporlar", items: [ { to: "/raporlar/uretim", label: "Üretim" }, { to: "/raporlar/verimlilik", label: "Verimlilik" }, { to: "/raporlar/ariza", label: "Arıza" }, { to: "/raporlar/kalite", label: "Kalite" } ] },
      { title: "Yönetim", items: [ { to: "/yonetim/kullanicilar", label: "Kullanıcılar" }, { to: "/yonetim/yetkiler", label: "Yetkiler" }, { to: "/ayarlar", label: "Sistem Ayarları" }, { to: "/kullanim-talimati", label: "Kullanım Talimatı" } ] },
    ],
  },
];

export function AppShell() {
  const { theme, toggle } = useTheme();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (title: string) => setOpenGroups((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
      <Splash />
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r h-screen" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="p-4 border-b flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
          <Logo size={128} />
          <GlobalSearch />
        </div>
        <nav className="flex-1 p-2 space-y-4 overflow-auto">
          <NavLink to="/" end className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium" style={({ isActive }) => ({ backgroundColor: isActive ? "var(--accent)" : "transparent", color: isActive ? "#0b0e14" : "var(--text)" })}>
            Pano
          </NavLink>
          {sections.map((s) => (
            <div key={s.title}>
              {s.groups.map((g) => {
                const open = openGroups[g.title] ?? true;
                return (
                  <div key={g.title} className="mt-1">
                    <button onClick={() => toggleGroup(g.title)} className="group-title w-full flex items-center justify-between px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg hover:text-[var(--accent)]">
                      <span>{g.title}</span>
                      {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    {open && (
                      <div className="space-y-1">
                        {g.items.map((n) => (
                          <NavLink key={n.to} to={n.to} className="block rounded-xl px-3 py-1.5 text-sm font-medium transition" style={({ isActive }) => ({ backgroundColor: isActive ? "var(--accent)" : "transparent", color: isActive ? "#0b0e14" : "var(--text)" })}>
                            {n.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t text-xs text-muted flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <span>by Eymen GÜLLEROĞLU <span style={{ color: "var(--accent)" }}>· v{APP_VERSION}</span></span>
          <button onClick={toggle} className="btn-ghost !px-2 !py-1.5" aria-label="Tema değiştir">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>

      <header className="md:hidden flex items-center justify-between p-3 border-b gap-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <Logo size={28} />
        <GlobalSearch />
        <button onClick={toggle} className="btn-ghost !px-2 !py-1.5" aria-label="Tema değiştir">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      <main className="flex-1 pb-20 md:pb-0 overflow-auto h-screen">
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 inset-x-0 text-center text-[10px] text-muted py-1" style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        by Eymen GÜLLEROĞLU · v{APP_VERSION}
      </div>
    </div>
  );
}