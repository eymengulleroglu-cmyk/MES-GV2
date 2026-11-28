import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const RegisterSchema = z.object({
  tenantCode: z.string().min(2).max(40),
  tenantName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(120),
  setupToken: z.string().min(1),
});

const LoginSchema = z.object({
  tenantCode: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

// İlk yönetici kurulumu: tek kullanımlık SETUP_TOKEN ile
router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Geçersiz alanlar", details: parsed.error.flatten() });
  const { tenantCode, tenantName, email, password, name, setupToken } = parsed.data;

  if (!process.env.SETUP_TOKEN || setupToken !== process.env.SETUP_TOKEN) {
    return res.status(403).json({ error: "Geçersiz kurulum anahtarı" });
  }
  // tek kullanımlık: herhangi bir kullanıcı varsa kapat
  const anyUser = await prisma.user.findFirst();
  if (anyUser) return res.status(403).json({ error: "Kurulum zaten tamamlanmış" });

  const tenant = await prisma.tenant.upsert({
    where: { code: tenantCode },
    update: {},
    create: { code: tenantCode, name: tenantName },
  });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { tenantId: tenant.id, email, passwordHash, name, role: "ADMIN" },
  });
  const token = jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "12h" });
  return res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: tenant.id } });
});

router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Geçersiz alanlar" });
  const { tenantCode, email, password } = parsed.data;
  const tenant = await prisma.tenant.findUnique({ where: { code: tenantCode } });
  if (!tenant) return res.status(401).json({ error: "Tenant bulunamadı" });
  const user = await prisma.user.findUnique({ where: { tenantId_email: { tenantId: tenant.id, email } } });
  if (!user) return res.status(401).json({ error: "Kullanıcı bulunamadı" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Hatalı parola" });
  const token = jwt.sign({ userId: user.id, tenantId: tenant.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "12h" });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: tenant.id } });
});

export default router;
