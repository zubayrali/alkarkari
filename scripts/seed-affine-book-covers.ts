import fs from "node:fs/promises";
import path from "node:path";
import { createAffineBridgeMcpClient } from "../lib/affine/bridge-mcp-client.ts";

type BookMetadata = {
  cover: string;
  source: string;
};

const BOOKS: Record<string, BookMetadata> = {
  "books/at-the-service-of-destiny": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2021/06/At-theServiceofDestiny-MohamedFaouziAlKarkari-YousefCasewit.jpg",
    source: "https://les7lectures.com/en/books/at-the-service-of-destiny/",
  },
  "books/candles-on-the-path": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2024/01/Candles-on-the-Path.jpg",
    source: "https://les7lectures.com/en/books/candles-on-the-path/",
  },
  "books/etiquette-of-spiritual-companionship": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2024/09/Etiquette-of-Spiritual-Companionship2.jpg",
    source: "https://les7lectures.com/en/books/etiquette-of-spiritual-companionship/",
  },
  "books/guided-by-the-divine-light": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2024/07/Guided-By-The-Divine-Light-Vol.-I.jpg",
    source: "https://les7lectures.com/en/books/guided-by-the-divine-light/",
  },
  "books/in-the-footsteps-of-moses": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2021/06/IntheFootstepsofMoses-MohamedFaouziAlKarkari-YousefCasewit.jpg",
    source: "https://les7lectures.com/en/books/in-the-footsteps-of-moses/",
  },
  "books/introduction-to-islamic-metaphysics": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2021/08/Introduction-to-Islamic-Metaphysics.jpg",
    source: "https://les7lectures.com/en/books/introduction-to-islamic-metaphysics/",
  },
  "books/sufism-revived": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2021/06/SufismRevived-MohamedFaouziAlKarkari-YousefCasewit.jpg",
    source: "https://les7lectures.com/en/books/sufism-revived/",
  },
  "books/the-foundations-of-the-karkariya-order": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2021/07/The-Foundation-of-the-Karkariya-Order.jpg",
    source: "https://les7lectures.com/en/books/the-foundations-of-the-karkariya-order/",
  },
  "books/the-sufi-path-of-light": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2023/03/The-Sufi-Path-of-Light.jpg",
    source: "https://les7lectures.com/en/books/the-sufi-path-of-light/",
  },
  "books/wisdoms-of-the-heart": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2022/06/Wisdoms-of-the-Heart.jpg",
    source: "https://les7lectures.com/en/books/wisdoms-of-the-heart/",
  },
  "books/zamzam-of-spiritual-knowledge": {
    cover: "https://les7lectures.com/en/wp-content/uploads/2024/10/Zamzam-of-Spiritual-Knowledge.jpg",
    source: "https://les7lectures.com/en/books/zamzam-of-spiritual-knowledge/",
  },
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function bridgeToken(): Promise<string | undefined> {
  if (process.env.AFFINE_BRIDGE_MCP_NO_AUTH === "1") return undefined;
  const tokenPath = path.resolve(
    process.cwd(),
    process.env.AFFINE_BRIDGE_MCP_TOKEN_PATH?.trim() ||
      path.join(".affine-publisher", "bridge.token"),
  );
  try {
    const managed = (await fs.readFile(tokenPath, "utf8")).trim();
    if (managed) return managed;
  } catch {
    // A manually configured bridge does not necessarily create a token file.
  }
  return process.env.AFFINE_BRIDGE_MCP_TOKEN?.trim();
}

async function main() {
  const workspaceId = required("AFFINE_WORKSPACE_ID");
  const endpoint = required("AFFINE_BRIDGE_MCP_URL");
  const client = createAffineBridgeMcpClient({
    endpoint,
    token: await bridgeToken(),
  });
  const documents = (await client.listDocuments(workspaceId)).filter((document) => !document.inTrash);
  const first = documents[0];
  if (!first) throw new Error("The AFFiNE workspace contains no documents.");

  const definitionResult = await client.callTool("list_doc_properties", {
    workspaceId,
    docId: first.id,
  }) as { definitions?: Array<{ name?: string }> };
  const definitionNames = new Set(
    (definitionResult.definitions ?? []).map((definition) => definition.name),
  );
  if (!definitionNames.has("Book Cover")) {
    // AFFiNE currently caps a workspace at 24 custom property definitions.
    // This workspace had reached that limit, while the legacy Order field had
    // no value on any document. Reclaim that empty slot without discarding data.
    if (definitionNames.size >= 24 && definitionNames.has("Order")) {
      for (const document of documents) {
        const properties = await client.readDocumentProperties(workspaceId, document.id);
        if (properties.Order !== null && properties.Order !== undefined && properties.Order !== "") {
          throw new Error("AFFiNE's custom-property limit was reached and Order is in use; no schema was changed.");
        }
      }
      await client.callTool("delete_custom_property", { workspaceId, property: "Order" });
    }
    await client.callTool("create_custom_property", { workspaceId, name: "Book Cover", type: "text" });
  }

  let updated = 0;
  const unmatched = new Set(Object.keys(BOOKS));
  for (const document of documents) {
    const properties = await client.readDocumentProperties(workspaceId, document.id);
    const slug = typeof properties.Slug === "string" ? properties.Slug.trim() : "";
    const metadata = BOOKS[slug];
    if (!metadata) continue;
    for (const [property, value] of [
      ["Book Cover", metadata.cover],
      ["Source URL", metadata.source],
    ] as const) {
      if (properties[property] !== value) {
        await client.callTool("set_doc_property", {
          workspaceId,
          docId: document.id,
          property,
          value,
        });
      }
    }
    unmatched.delete(slug);
    updated += 1;
  }

  if (unmatched.size > 0) {
    throw new Error(`Could not find AFFiNE documents for: ${[...unmatched].join(", ")}`);
  }
  console.log(`Verified cover metadata for ${updated} AFFiNE book documents.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
