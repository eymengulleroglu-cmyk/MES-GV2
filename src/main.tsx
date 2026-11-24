import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/ThemeProvider";
import { AppShell } from "./layout/AppShell";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";

import WorkOrders from "./pages/WorkOrders";
import WorkOrderDetail from "./pages/WorkOrderDetail";
import WorkCenters from "./pages/WorkCenters";
import WorkCenterDetail from "./pages/WorkCenterDetail";
import DowntimeScrap from "./pages/DowntimeScrap";
import Settings from "./pages/Settings";
import KullanimTalimati from "./pages/KullanimTalimati";
import ModulePage from "./pages/ModulePage";
import ModuleCrud from "./pages/ModuleCrud";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="emirler" element={<WorkOrders />} />
              <Route path="emirler/:id" element={<WorkOrderDetail />} />
              <Route path="is-merkezleri" element={<WorkCenters />} />
              <Route path="is-merkezleri/:id" element={<WorkCenterDetail />} />
              <Route path="durus-fire" element={<DowntimeScrap />} />
              <Route path="ayarlar" element={<Settings />} />
              <Route path="kullanim-talimati" element={<KullanimTalimati />} />

              <Route path="modul/:key" element={<ModulePage />} />

              <Route path="siparisler" element={<ModuleCrud moduleKey="siparisler" />} />
              <Route path="urunler" element={<ModuleCrud moduleKey="urunler" />} />
              <Route path="uretim/is-emirleri" element={<WorkOrders />} />
              <Route path="uretim/uretim-girisi" element={<ModuleCrud moduleKey="uretim-girisi" />} />
              <Route path="uretim/uretim-takibi" element={<ModuleCrud moduleKey="uretim-takibi" />} />

              <Route path="makine/liste" element={<ModuleCrud moduleKey="makine-listesi" />} />
              <Route path="makine/arizalar" element={<ModuleCrud moduleKey="arizalar" />} />
              <Route path="makine/bakim" element={<ModuleCrud moduleKey="bakim" />} />
              <Route path="makine/oee" element={<ModuleCrud moduleKey="oee" />} />

              <Route path="kalite/kontrol" element={<ModuleCrud moduleKey="kalite-kontrol" />} />
              <Route path="kalite/hata" element={<ModuleCrud moduleKey="hata-kayitlari" />} />
              <Route path="kalite/spc" element={<ModuleCrud moduleKey="spc" />} />

              <Route path="stok/hammadde" element={<ModuleCrud moduleKey="hammadde" />} />
              <Route path="stok/yari-mamul" element={<ModuleCrud moduleKey="yari-mamul" />} />
              <Route path="stok/mamul" element={<ModuleCrud moduleKey="mamul" />} />

              <Route path="izlenebilirlik/lot" element={<ModuleCrud moduleKey="lot-takibi" />} />
              <Route path="izlenebilirlik/seri-no" element={<ModuleCrud moduleKey="seri-no" />} />

              <Route path="raporlar/uretim" element={<ModuleCrud moduleKey="rapor-uretim" />} />
              <Route path="raporlar/verimlilik" element={<ModuleCrud moduleKey="rapor-verimlilik" />} />
              <Route path="raporlar/ariza" element={<ModuleCrud moduleKey="rapor-ariza" />} />
              <Route path="raporlar/kalite" element={<ModuleCrud moduleKey="rapor-kalite" />} />

              <Route path="yonetim/kullanicilar" element={<ModuleCrud moduleKey="kullanicilar" />} />
              <Route path="yonetim/yetkiler" element={<ModuleCrud moduleKey="yetkiler" />} />
              <Route path="yonetim/ayarlar" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);