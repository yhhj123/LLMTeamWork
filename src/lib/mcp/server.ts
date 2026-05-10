// Build an MCP Server bound to a specific team. The server registers all our
// collaboration tools (publish_request, deliver_request, etc.) and routes
// every call through the same service layer the REST API uses.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { mcpTools, toolMap } from "./tools";

export function createMcpServer(teamId: string) {
  const server = new Server(
    { name: "llm-teamwork", version: "0.1.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "LLM TeamWork: cross-team agent collaboration platform. Use list_projects to " +
        "discover projects, publish_request to ask another team to do work, list_requests " +
        "with box='inbox' to find incoming work, accept_request, deliver_request to report " +
        "completion, then confirm_request to close the loop. All actions are scoped to the " +
        "calling team's API key.",
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: mcpTools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as any,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async req => {
    const tool = toolMap.get(req.params.name);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
      };
    }
    try {
      const result = await tool.handler(teamId, req.params.arguments ?? {});
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        structuredContent: result as any,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${message}` }],
      };
    }
  });

  return server;
}
