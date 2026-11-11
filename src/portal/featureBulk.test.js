import { batches, needsTypedConfirm, typedMatches, flagsForRole, mergeResults, actionText, BATCH } from "./featureBulk";

test("batches of at most 500, order kept", () => {
  const ids = Array.from({ length: 1201 }, (_, i) => `id${i}`);
  const b = batches(ids);
  expect(b.map((x) => x.length)).toEqual([500, 500, 201]);
  expect(b.flat()).toEqual(ids);
  expect(BATCH).toBe(500);
  expect(batches([])).toEqual([]);
});

test("typed confirmation only over 500, exact number", () => {
  expect(needsTypedConfirm(500)).toBe(false);
  expect(needsTypedConfirm(501)).toBe(true);
  expect(typedMatches("1201", 1201)).toBe(true);
  expect(typedMatches("1,201", 1201)).toBe(true);
  expect(typedMatches(" 1201 ", 1201)).toBe(true);
  expect(typedMatches("1200", 1201)).toBe(false);
  expect(typedMatches("", 1201)).toBe(false);
  expect(typedMatches(undefined, 1201)).toBe(false);
});

test("flags for a role", () => {
  const flags = [{ flag: "loyaltyV2", roles: ["brand", "student"] }, { flag: "employerFirstHireFree", roles: ["employee"] }];
  expect(flagsForRole(flags, "student").map((f) => f.flag)).toEqual(["loyaltyV2"]);
  expect(flagsForRole(flags, "employee").map((f) => f.flag)).toEqual(["employerFirstHireFree"]);
  expect(flagsForRole(flags, "traveler")).toEqual([]);
  expect(flagsForRole(null, "student")).toEqual([]);
});

test("merge batch results, failed batches listed by id", () => {
  const m = mergeResults([
    { ids: ["a", "b"], result: { changed: ["a"], unchanged: ["b"], skipped: [] } },
    { ids: ["c"], error: new Error("x") },
    { ids: ["d"], result: { changed: [], unchanged: [], skipped: [{ id: "d", why: "not found" }] } },
  ]);
  expect(m).toEqual({ changed: ["a"], unchanged: ["b"], skipped: [{ id: "d", why: "not found" }], failed: ["c"] });
});

test("action text", () => {
  expect(actionText("Loyalty", true, 214)).toBe("turn on Loyalty for 214 accounts");
  expect(actionText("Surprise Box", false, 1)).toBe("turn off Surprise Box for 1 account");
  expect(actionText("Loyalty", true, 1201)).toBe("turn on Loyalty for 1,201 accounts");
});
