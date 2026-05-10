// MCP Streamable HTTP endpoint, backed by the official @modelcontextprotocol/sdk
// Server class via a one-shot transport adapter.
//
// Authentication: 'Authorization: Bearer <team API key>' (or 'X-Api-Key').
// The team resolved from the key is the actor for every tool call.
//
// Each POST is a single (or batch) JSON-RPC request. Responses are returned
// as JSON; we don't currently emit server notifications.

import type { NextRequest } from "next/server";
import { JSONRPCMessageSchema } from "@modelcontextprotocol/sdk/types.js";
import { authenticateTeam, HttpError } from "@/lib/auth";
import { createMcpServer } from "@/lib/mcp/server";
import { OneShotTransport } from "@/lib/mcp/transport";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    transport: "streamable-http",
    description:
      "POST JSON-RPC 2.0 envelopes here. Authenticate with 'Authorization: Bearer <team API key>'.",
    protocolVersion: "2025-03-26",
    server: { name: "llm-teamwork", version: "0.1.0" },
  });
}

export async function POST(req: NextRequest) {
  let team;
  try {
    team = await authenticateTeam(req);
  } catch (e) {
    if (e instanceof HttpError) {
      return Response.json(
        { jsonrpc: "2.0", id: null, error: { code: -32001, message: e.message } },
        { status: e.status }
      );
    }
    throw e;
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 }
    );
  }

  const isBatch = Array.isArray(payload);
  const rawMessages = (isBatch ? payload : [payload]) as unknown[];

  const server = createMcpServer(team!.id);
  const transport = new OneShotTransport();
  await server.connect(transport);

  const responses: unknown[] = [];
  try {
    for (const raw of rawMessages) {
      let message;
      try {
        message = JSONRPCMessageSchema.parse(raw);
      } catch (e) {
        responses.push({
          jsonrpc: "2.0",
          id: (raw as any)?.id ?? null,
          error: { code: -32600, message: "Invalid request" },
        });
        continue;
      }
      const res = await transport.exchange(message);
      if (res) responses.push(res);
    }
  } finally {
    await server.close();
  }

  if (!isBatch) {
    return Response.json(responses[0] ?? null);
  }
  return Response.json(responses);
}
