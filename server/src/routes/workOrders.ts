import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

const CreateSchema = z.object({
  code: z.string().min(1).max(60),
  productName: z.string().min(1).max(200),
  productCode: z.string().max(60).optional(),
  workCenterId: z.string().max(60).optional().nullable(),
  targetQty: z.number().int().positive(),
  priority: z.enum(["Düşük", "Normal", "Yüksek", "Acil", "Kritik"]).optional(),
  dueDate: z.string().min(1).max(40),
  status: z.enum(["Planlandı", "Üretimde", "Tamamlandı", "İptal"]).optional(),
});

const UpdateSchema = CreateSchema.partial();

router.get("/", requireAuth, async (req, res) => {
  const { tenantId } = (req as any).auth;
  const rows = await prisma.workOrder.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } });
  return res.json(rows);
});

router.post("/", requireAuth, requireRole("ADMIN", "PLANNER"), async (req, res) => {
  const { tenantId, userId } = (req as any).auth;
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Geçersiz alanlar", details: parsed.error.flatten() });
  const data = parsed.data;
  if (data.workCenterId) {
    const busy = await prisma.workOrder.findFirst({
      where: { tenantId, workCenterId: data.workCenterId, status: { in: ["Planlandı", "Üretimde"] } },
    });
    if (busy) return res.status(409).json({ error: `Bu iş merkezinde aktif iş emri var (${busy.code}).` });
  }
  const wo = await prisma.workOrder.create({
    data: {
      tenantId,
      code: data.code,
      productName: data.productName,
      productCode: data.productCode,
      workCenterId: data.workCenterId ?? null,
      targetQty: data.targetQty,
      priority: data.priority ?? "Normal",
      dueDate: data.dueDate,
      status: data.status ?? "Planlandı",
      createdById: userId,
    },
  });
  await prisma.auditLog.create({ data: { tenantId, userId, action: "CREATE", entity: "WorkOrder", entityId: wo.id, after: wo as any } });
  return res.status(201).json(wo);
});

router.patch("/:id", requireAuth, requireRole("ADMIN", "PLANNER"), async (req, res) => {
  const { tenantId, userId } = (req as any).auth;
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Geçersiz alanlar", details: parsed.error.flatten() });
  const existing = await prisma.workOrder.findFirst({ where: { tenantId, id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Bulunamadı" });
  const data = parsed.data;
  if (data.workCenterId && data.workCenterId !== existing.workCenterId) {
    const busy = await prisma.workOrder.findFirst({
      where: { tenantId, workCenterId: data.workCenterId, status: { in: ["Planlandı", "Üretimde"] }, NOT: { id: existing.id } },
    });
    if (busy) return res.status(409).json({ error: `Bu iş merkezinde aktif iş emri var (${busy.code}).` });
  }
  const updated = await prisma.workOrder.update({ where: { id: existing.id }, data });
  await prisma.auditLog.create({ data: { tenantId, userId, action: "UPDATE", entity: "WorkOrder", entityId: existing.id, before: existing as any, after: updated as any } });
  return res.json(updated);
});

router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { tenantId, userId } = (req as any).auth;
  const existing = await prisma.workOrder.findFirst({ where: { tenantId, id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Bulunamadı" });
  await prisma.workOrder.delete({ where: { id: existing.id } });
  await prisma.auditLog.create({ data: { tenantId, userId, action: "DELETE", entity: "WorkOrder", entityId: existing.id, before: existing as any } });
  return res.status(204).send();
});

export default router;
