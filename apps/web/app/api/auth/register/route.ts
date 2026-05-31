import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { prisma, createUser, createWorkspace } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  workspaceName: z.string().min(1).max(80),
  workspaceSlug: z.string().min(1).max(80),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password, workspaceName, workspaceSlug } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);
  const user = await createUser({ email, name, passwordHash });

  await createWorkspace({
    name: workspaceName,
    slug: workspaceSlug,
    ownerId: user.id,
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
