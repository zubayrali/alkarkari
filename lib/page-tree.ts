import type { Node, Root } from "fumadocs-core/page-tree";

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

/** Remove the generated /tags pages from the sidebar tree (they stay routable). */
export function hideTagPages(tree: Root): Root {
  return {
    ...tree,
    children: tree.children.filter((node) => !containsTagPage(node)),
  };
}
