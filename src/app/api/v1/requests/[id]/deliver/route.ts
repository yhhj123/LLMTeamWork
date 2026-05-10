import type { NextRequest } from "next/server";
import { withErrors, parseBody, created } from "@/lib/http";
import { authenticateTeam } from "@/lib/auth";
import { DeliveryCreate } from "@/lib/schemas";
import { deliverRequest } from "@/lib/services";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrors(async () => {
    const team = await authenticateTeam(req);
    const body = await parseBody(req, DeliveryCreate);
    const result = await deliverRequest(team!.id, params.id, body);
    return created(result);
  });
}
