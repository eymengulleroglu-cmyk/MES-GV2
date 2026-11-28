export type Role = "admin" | "planner" | "operator" | "maintenance" | "quality";

const KEY = "mesg-role";

export function getRole(): Role {
  const v = localStorage.getItem(KEY);
  if (v === "planner" || v === "operator" || v === "maintenance" || v === "quality") return v;
  return "admin";
}

export function setRole(r: Role) {
  localStorage.setItem(KEY, r);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Yönetici",
  planner: "Planlama",
  operator: "Üretim Operatörü",
  maintenance: "Bakım",
  quality: "Kalite",
};

// Hangi menü grupları hangi rollerde görünür
export const ROLE_GROUPS: Record<Role, string[]> = {
  admin: ["*"],
  planner: ["Planlama", "Üretim", "Canlı İzleme", "Stok", "İzlenebilirlik", "Raporlar"],
  operator: ["Üretim", "Canlı İzleme", "Kalite"],
  maintenance: ["Makine", "Canlı İzleme"],
  quality: ["Kalite", "İzlenebilirlik", "Raporlar"],
};
