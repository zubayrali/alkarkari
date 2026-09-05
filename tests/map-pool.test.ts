import { describe, expect, it } from "vitest";

/** Mirrors scripts/generate-affine.ts mapPool for unit coverage. */
async function mapPool<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let nextIndex = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      await worker(items[index]!, index);
    }
  }));
}

describe("mapPool", () => {
  it("respects concurrency and covers every item", async () => {
    let active = 0;
    let maxActive = 0;
    const seen: number[] = [];
    await mapPool([1, 2, 3, 4, 5], 2, async (item) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      seen.push(item);
      active -= 1;
    });
    expect(seen.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
