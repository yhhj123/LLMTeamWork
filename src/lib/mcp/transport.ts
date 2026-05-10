// One-shot transport adapter that lets us drive the official MCP Server class
// from a Next.js App Router POST handler.
//
// The MCP SDK's built-in StreamableHTTPServerTransport expects Node's
// IncomingMessage/ServerResponse, which the App Router doesn't expose.
// This adapter implements the Transport interface and instead exposes a
// simple `exchange(message)` that lets us push one JSON-RPC request and
// await the matching response.

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

export class OneShotTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
  sessionId?: string;

  private pending = new Map<string | number, (m: JSONRPCMessage) => void>();
  private notifications: JSONRPCMessage[] = [];

  async start(): Promise<void> {}

  async close(): Promise<void> {
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if ("id" in message && message.id !== undefined && message.id !== null) {
      const resolver = this.pending.get(message.id);
      if (resolver) {
        this.pending.delete(message.id);
        resolver(message);
        return;
      }
    }
    // Server-initiated notification with no awaiter; collect for inspection.
    this.notifications.push(message);
  }

  /** Inject a single client request and wait for its matching response. */
  async exchange(request: JSONRPCMessage): Promise<JSONRPCMessage | null> {
    if (!("id" in request) || request.id === undefined || request.id === null) {
      // Notification: no response expected.
      this.onmessage?.(request);
      return null;
    }
    return new Promise<JSONRPCMessage>(resolve => {
      this.pending.set(request.id as string | number, resolve);
      this.onmessage?.(request);
    });
  }
}
