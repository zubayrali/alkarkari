import { describe, expect, it } from "vitest";
import { parsePrompts } from "../lib/remark-review-prompts";

describe("parsePrompts", () => {
  it("parses blank-line-separated Q/A pairs", () => {
    const prompts = parsePrompts("Q: one?\nA: 1\n\nQ: two?\nA: 2");
    expect(prompts.map((p) => [p.question, p.answer])).toEqual([
      ["one?", "1"],
      ["two?", "2"],
    ]);
  });

  it("keeps enumerated 'A.'/'Q.' continuation lines inside the field", () => {
    const [p] = parsePrompts("Q: pick one\nA: Options:\nA. first\nB. second");
    expect(p.answer).toBe("Options:\nA. first\nB. second");
  });

  it("gives distinct ids to prompts with shifted Q/A boundaries", () => {
    const [x] = parsePrompts("Q: ab\nA: c");
    const [y] = parsePrompts("Q: a\nA: bc");
    expect(x.id).not.toBe(y.id);
  });

  it("attaches QI:/AI: images without treating them as fields", () => {
    const [p] = parsePrompts("Q: what?\nQI: q.png\nA: that\nAI: a.png");
    expect(p.question).toBe("what?");
    expect(p.answer).toBe("that");
    expect(p.questionAttachment).toContain("q.png");
    expect(p.answerAttachment).toContain("a.png");
  });
});
