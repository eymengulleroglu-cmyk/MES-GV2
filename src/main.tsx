import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
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
import Simulasyon from "./pages/Simulasyon";
import NotFound from "./pages/NotFound";
import Andon from "./pages/Andon";
import AlarmMerkezi from "./pages/AlarmMerkezi";
import Planlama from "./pages/Planlama";
import KayipAnalizi from "./pages/KayipAnalizi";
import IzlenebilirlikSorgu from "./pages/IzlenebilirlikSorgu";
import SimBridge from "./components/SimBridge";
import { startSync } from "./data/sync";
import { queryClient } from "./data/queryClient";
import "./index.css";

// Bulut senkronizasyonu: açıkken tüm mesg-* verileri GitHub Gist'e yazılır/okunur
startSync();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SimBridge />
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="simulasyon" element={<Simulasyon />} />
              <Route path="planlama" element={<Planlama />} />
              <Route path="andon" element={<Andon />} />
              <Route path="alarmlar" element={<AlarmMerkezi />} />
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
              <Route path="uretim/vardiya-plani" element={<ModuleCrud moduleKey="vardiya-plani" />} />

              <Route path="kalite/kontrol" element={<ModuleCrud moduleKey="kalite-kontrol" />} />
              <Route path="kalite/olcumler" element={<ModuleCrud moduleKey="kalite-olcumler" />} />
              <Route path="kalite/hata" element={<ModuleCrud moduleKey="hata-kayitlari" />} />
              <Route path="kalite/spc" element={<ModuleCrud moduleKey="spc" />} />

              <Route path="stok/hammadde" element={<ModuleCrud moduleKey="hammadde" />} />
              <Route path="stok/hareketler" element={<ModuleCrud moduleKey="stok-hareketleri" />} />
              <Route path="stok/yari-mamul" element={<ModuleCrud moduleKey="yari-mamul" />} />
              <Route path="stok/mamul" element={<ModuleCrud moduleKey="mamul" />} />

              <Route path="izlenebilirlik/lot" element={<ModuleCrud moduleKey="lot-takibi" />} />
              <Route path="izlenebilirlik/seri-no" element={<ModuleCrud moduleKey="seri-no" />} />
              <Route path="izlenebilirlik/sorgu" element={<IzlenebilirlikSorgu />} />

              <Route path="raporlar/kayip-analizi" element={<KayipAnalizi />} />

              <Route path="raporlar/uretim" element={<ModuleCrud moduleKey="rapor-uretim" />} />
              <Route path="raporlar/verimlilik" element={<ModuleCrud moduleKey="rapor-verimlilik" />} />
              <Route path="raporlar/ariza" element={<ModuleCrud moduleKey="rapor-ariza" />} />
              <Route path="raporlar/kalite" element={<ModuleCrud moduleKey="rapor-kalite" />} />

              <Route path="yonetim/kullanicilar" element={<ModuleCrud moduleKey="kullanicilar" />} />
              <Route path="yonetim/denetim-kaydi" element={<ModuleCrud moduleKey="denetim-kaydi" />} />
              <Route path="yonetim/musteriler" element={<ModuleCrud moduleKey="musteriler" />} />
              <Route path="yonetim/yetkiler" element={<ModuleCrud moduleKey="yetkiler" />} />
              <Route path="*" element={<NotFound />} />
              <Route path="yonetim/ayarlar" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);