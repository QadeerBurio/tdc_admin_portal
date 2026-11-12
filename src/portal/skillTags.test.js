import { splitSkillText, looksLikeList, addTags, tagsOf, MAX_SKILLS, MAX_SKILL_LENGTH } from "./skillTags";

test("splitSkillText: commas, semicolons, new lines, ' - ', bullets", () => {
  expect(splitSkillText("React, Node.js; SQL")).toEqual(["React", "Node.js", "SQL"]);
  expect(splitSkillText("React\nNode.js\r\nSQL")).toEqual(["React", "Node.js", "SQL"]);
  expect(splitSkillText("React - Node.js - SQL")).toEqual(["React", "Node.js", "SQL"]);
  expect(splitSkillText("• React\n- Node.js\n* SQL\n1. Git\n2) Docker")).toEqual(["React", "Node.js", "SQL", "Git", "Docker"]);
  expect(splitSkillText("React • Node.js · SQL")).toEqual(["React", "Node.js", "SQL"]);
});

test("splitSkillText: never inside brackets; words with hyphens and symbols stay whole", () => {
  expect(splitSkillText("Python (pandas, numpy), SQL [MySQL, Postgres] - Git")).toEqual(["Python (pandas, numpy)", "SQL [MySQL, Postgres]", "Git"]);
  expect(splitSkillText("Cloud (AWS [EC2, S3],\nGCP), Linux")).toEqual(["Cloud (AWS [EC2, S3], GCP)", "Linux"]);
  expect(splitSkillText("front-end, C++, C#, Node.js, e-commerce")).toEqual(["front-end", "C++", "C#", "Node.js", "e-commerce"]);
  expect(splitSkillText(" ,, React   Native ,\n\n")).toEqual(["React Native"]);
});

test("looksLikeList: a list or a long text is split; one short skill isn't", () => {
  expect(looksLikeList("React, Node.js")).toBe(true);
  expect(looksLikeList("We are looking for someone who knows React and Node.js")).toBe(true);
  expect(looksLikeList("• React")).toBe(true);
  expect(looksLikeList("React")).toBe(false);
  expect(looksLikeList("Python (pandas, numpy)")).toBe(false);
});

test("addTags: trimmed, no repeats, at most 15, each at most 40 characters", () => {
  expect(addTags(["React"], [" Node.js ", "react", ""])).toEqual({ tags: ["React", "Node.js"], refused: [{ tag: "react", reason: "already added" }] });
  const long = "x".repeat(MAX_SKILL_LENGTH + 1);
  expect(addTags([], [long]).refused[0].reason).toBe("over 40 characters");
  expect(addTags([], ["x".repeat(MAX_SKILL_LENGTH)]).tags).toHaveLength(1);
  const full = Array.from({ length: MAX_SKILLS }, (_, i) => `S${i}`);
  const r = addTags(full, ["one more"]);
  expect(r.tags).toHaveLength(15);
  expect(r.refused[0]).toEqual({ tag: "one more", reason: "at most 15 skills" });
});

test("tagsOf: a stored list as it is; old comma text split", () => {
  expect(tagsOf(["React", " Node.js "])).toEqual(["React", "Node.js"]);
  expect(tagsOf("React, Node.js")).toEqual(["React", "Node.js"]);
  expect(tagsOf(undefined)).toEqual([]);
});
