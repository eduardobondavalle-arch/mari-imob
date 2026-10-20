import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";
export function ensureClientSelection(
  leadId: string,
  tx: Prisma.TransactionClient = db,
) {
  return tx.selection.upsert({
    where: { clientLeadId: leadId },
    update: {},
    create: {
      leadId,
      clientLeadId: leadId,
      origin: "client",
      title: "Minha seleção",
    },
  });
}
