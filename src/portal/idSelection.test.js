import { formatIds, universityOptions, matchesUniversity, NO_UNIVERSITY } from "./idSelection";

test("formatIds: ids:<a,b,c>, order kept, duplicates and blanks dropped", () => {
  expect(formatIds(["a", "b", "a", "", null, " c "])).toBe("ids:a,b,c");
  expect(formatIds([])).toBe("ids:");
});

test("universityOptions: by name with counts, students without one last", () => {
  const users = [
    { university: { _id: "u2", name: "SZABIST" } },
    { university: { _id: "u1", name: "IBA Karachi" } },
    { university: { _id: "u2", name: "SZABIST" } },
    { university: null },
  ];
  expect(universityOptions(users)).toEqual([
    { value: "u1", label: "IBA Karachi", count: 1 },
    { value: "u2", label: "SZABIST", count: 2 },
    { value: NO_UNIVERSITY, label: "no university", count: 1 },
  ]);
});

test("matchesUniversity", () => {
  const a = { university: { _id: "u1" } };
  const none = { university: null };
  expect(matchesUniversity(a, "all")).toBe(true);
  expect(matchesUniversity(a, "u1")).toBe(true);
  expect(matchesUniversity(a, "u2")).toBe(false);
  expect(matchesUniversity(none, NO_UNIVERSITY)).toBe(true);
  expect(matchesUniversity(a, NO_UNIVERSITY)).toBe(false);
});
