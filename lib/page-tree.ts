import type { Node, Root } from "fumadocs-core/page-tree";
import { source } from "./source";

function containsTagPage(node: Node): boolean {
  if (node.type === "page") {
    return node.url === "/tags" || node.url.startsWith("/tags/");
  }
  if (node.type === "folder") {
    if (node.index && containsTagPage(node.index)) return true;
    return node.children.some(containsTagPage);
  }
  return false;
}

const unlistedUrls = new Set(
  source.getPages().filter((p) => p.data.unlisted).map((p) => p.url),
);

function isUnlistedNode(node: Node): boolean {
  if (node.type === "page") return unlistedUrls.has(node.url);
  if (node.type === "folder") {
    if (node.index && unlistedUrls.has(node.index.url)) return true;
  }
  return false;
}

function filterNodes(nodes: Node[]): Node[] {
  const result: Node[] = [];
  for (const node of nodes) {
    if (containsTagPage(node) || isUnlistedNode(node)) continue;
    if (node.type === "folder") {
      const children = filterNodes(node.children);
      if (children.length === 0 && !node.index) continue;
      result.push({ ...node, children });
    } else {
      result.push(node);
    }
  }
  return result;
}

/** Remove tag pages and unlisted pages from the sidebar tree (they stay routable). */
export function filterPageTree(tree: Root): Root {
  return { ...tree, children: filterNodes(tree.children) };
}
