import { z } from "zod";
import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

const installId = z.string().regex(/^[0-9a-f-]{36}$/);

const Day = z.object({
  installId,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  extVersion: z.string().max(20),
  vscodeVersion: z.string().max(20),
  platform: z.string().max(20),
  payload: z.record(z.string(), z.unknown()),
});

const Body = z.object({ schema: z.literal(1), days: z.array(Day).min(1).max(14) });

const RETENTION_DAYS = 395;

function retentionCutoff(): Date {
  return new Date(Date.now() - RETENTION_DAYS * 86_400_000);
}

async function readJson(req: Request, limit: number): Promise<unknown> {
  const text = await req.text();
  if (text.length > limit) throw new Error("payload too large");
  return JSON.parse(text);
}

export async function POST(req: Request) {
  const prisma = getPrisma();
  if (!prisma) return Response.json({ error: "telemetry storage is not configured" }, { status: 503 });
  let parsed;
  try {
    parsed = Body.safeParse(await readJson(req, 32_000));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "invalid body" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: "invalid payload" }, { status: 400 });

  for (const d of parsed.data.days) {
    const data = {
      extVersion: d.extVersion,
      vscodeVersion: d.vscodeVersion,
      platform: d.platform,
      payload: d.payload as Prisma.InputJsonValue,
    };
    await prisma.telemetryDay.upsert({
      where: { installId_day: { installId: d.installId, day: d.day } },
      create: { installId: d.installId, day: d.day, ...data },
      update: data,
    });
  }
  const cutoff = retentionCutoff();
  await prisma.$transaction([
    prisma.telemetryDay.deleteMany({ where: { updatedAt: { lt: cutoff } } }),
    prisma.feedbackAnswer.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);
  return Response.json({ ok: true, stored: parsed.data.days.length });
}

export async function GET(req: Request) {
  const prisma = getPrisma();
  if (!prisma) return Response.json({ error: "telemetry storage is not configured" }, { status: 503 });
  const id = installId.safeParse(new URL(req.url).searchParams.get("installId"));
  if (!id.success) return Response.json({ error: "invalid installId" }, { status: 400 });
  const [days, answers] = await Promise.all([
    prisma.telemetryDay.findMany({ where: { installId: id.data }, orderBy: { day: "asc" } }),
    prisma.feedbackAnswer.findMany({ where: { installId: id.data }, orderBy: { createdAt: "asc" } }),
  ]);
  return Response.json({ installId: id.data, retentionDays: RETENTION_DAYS, days, answers });
}

export async function DELETE(req: Request) {
  const prisma = getPrisma();
  if (!prisma) return Response.json({ error: "telemetry storage is not configured" }, { status: 503 });
  const id = installId.safeParse(new URL(req.url).searchParams.get("installId"));
  if (!id.success) return Response.json({ error: "invalid installId" }, { status: 400 });
  const [days, answers] = await prisma.$transaction([
    prisma.telemetryDay.deleteMany({ where: { installId: id.data } }),
    prisma.feedbackAnswer.deleteMany({ where: { installId: id.data } }),
  ]);
  return Response.json({ ok: true, deleted: days.count + answers.count });
}
