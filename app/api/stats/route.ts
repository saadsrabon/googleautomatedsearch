import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [leadCount, categoryCount, byCategory, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.leadCategory.count(),
    prisma.leadCategory.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { _count: { select: { leads: true } } },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const avgPerCategory =
    categoryCount > 0 ? Math.round(leadCount / categoryCount) : 0;

  return NextResponse.json({
    leadCount,
    categoryCount,
    avgPerCategory,
    chart: byCategory.map((c) => ({
      name: c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name,
      leads: c._count.leads,
    })),
    activity: [
      ...recentLeads.map((l) => ({
        id: l.id,
        tone: "ok" as const,
        label: "Lead saved",
        detail: `${l.name} · ${l.email}`,
        at: l.createdAt.toISOString(),
      })),
      ...byCategory.slice(0, 5).map((c) => ({
        id: c.id,
        tone: "info" as const,
        label: "Search run",
        detail: `${c.name} — ${c._count.leads} leads`,
        at: c.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12),
  });
}
