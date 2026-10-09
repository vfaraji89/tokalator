import { z } from "zod";
import { getPrisma } from "@/lib/db";

const Body = z.object({
  installId: z.string().regex(/^[0-9a-f-]{36}$/),
  question: z.string().regex(/^[a-z0-9-]{1,40}$/),
  answer: z.string().min(1).max(500),
  extVersion: z.string().max(20),
});

export async function POST(req: Request) {
  const prisma = getPrisma();
  if (!prisma) return Response.json({ error: "feedback storage is not configured" }, { status: 503 });
  let parsed;
  try {
    const text = await req.text();
    if (text.length > 4_000) return Response.json({ error: "payload too large" }, { status: 413 });
    parsed = Body.safeParse(JSON.parse(text));
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  if (!parsed.success) return Response.json({ error: "invalid payload" }, { status: 400 });
  await prisma.feedbackAnswer.create({ data: parsed.data });
  return Response.json({ ok: true });
}
