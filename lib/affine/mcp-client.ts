interface JsonRpcSuccess<T> {
  jsonrpc: "2.0";
  id: number;
  result: T;
}

interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: number | null;
  error: { code: number; message: string };
}

interface McpTextContent {
  type: "text";
  text: string;
}

interface McpToolResult {
  content?: McpTextContent[];
  isError?: boolean;
}

export interface AffineMcpClientOptions {
  endpoint: string;
  token: string;
  fetch?: typeof globalThis.fetch;
}

export function createAffineMcpClient(options: AffineMcpClientOptions) {
  const fetcher = options.fetch ?? globalThis.fetch;
  let requestId = 0;

  async function request<T>(method: string, params: unknown): Promise<T> {
    const response = await fetcher(options.endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++requestId,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `AFFiNE MCP request failed: ${response.status} ${response.statusText}`,
      );
    }

    const payload = (await response.json()) as JsonRpcSuccess<T> | JsonRpcFailure;
    if ("error" in payload) {
      throw new Error(
        `AFFiNE MCP error ${payload.error.code}: ${payload.error.message}`,
      );
    }
    return payload.result;
  }

  return {
    async readDocument(docId: string): Promise<string> {
      const result = await request<McpToolResult>("tools/call", {
        name: "read_document",
        arguments: { docId },
      });
      if (result.isError) {
        throw new Error(`AFFiNE read_document failed for ${docId}`);
      }
      const text = result.content
        ?.filter((item): item is McpTextContent => item.type === "text")
        .map((item) => item.text)
        .join("\n");
      if (!text) throw new Error(`AFFiNE document ${docId} returned no text`);
      return text;
    },
  };
}
