import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const categoryId = req.nextUrl.searchParams.get("categoryId");

  const leads = await prisma.lead.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  const rows = leads.map((l) => ({
    Name: l.name,
    "Profile link": l.profileLink,
    "Business name": l.businessName,
    Email: l.email,
    Site: l.sourceSite,
    Niche: l.niche,
    Category: l.category?.name ?? "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Leads");
  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" });

  const filename = categoryId ? `leads-${categoryId}.xlsx` : "leads-all.xlsx";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
