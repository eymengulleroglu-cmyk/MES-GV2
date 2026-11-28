import { useEffect } from "react";
import { queryClient } from "../data/queryClient";
import { subscribeSim } from "../data/simulation";

/**
 * Simülasyon köprüsü: simülasyon her tik attığında (üretilen adet, arıza,
 * fire, emir durumu...) React Query önbelleğini tazeler; Pano KPI'ları,
 * Duruş & Fire, İş Emirleri sayfaları canlı güncellenir.
 */
export default function SimBridge() {
  useEffect(() => subscribeSim(() => { void queryClient.invalidateQueries(); }), []);
  return null;
}
