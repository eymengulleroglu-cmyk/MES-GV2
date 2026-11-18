import { useTheme } from "../components/ThemeProvider";
import { useQueryClient } from "@tanstack/react-query";
import { store } from "../data/store";
import { RotateCcw, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const reset = () => {
    if (confirm("Tüm demo verileri sıfırlansın mı?")) {
      store.reset();
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("mesg-")) localStorage.removeItem(k);
      });
      queryClient.invalidateQueries();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted text-sm">Tema ve demo verisi yönetimi</p>
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
        <h2 className="font-semibold">Demo Verisi</h2>
        <p className="text-sm text-muted">Tüm veriler sentetik demodur. Sıfırlama orijinal demo verisini geri yükler.</p>
        <button onClick={reset} className="btn-danger">
          <RotateCcw size={14} /> Demo Verisini Sıfırla
        </button>
      </div>
    </div>
  );
}