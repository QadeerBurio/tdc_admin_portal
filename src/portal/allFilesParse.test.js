// Q-a (owner): a syntax error anywhere in the portal fails jest, not only the build. Every .js file under src is
// parsed (JSX, modules) the way the build reads it; screens without a render test are covered too.
import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";

const SRC = path.join(__dirname, "..");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(d, e.name)] : []));
const files = walk(SRC);

test("there are files to check", () => { expect(files.length).toBeGreaterThan(100); });

test.each(files.map((f) => [path.relative(SRC, f)]))("%s parses", (rel) => {
  const code = fs.readFileSync(path.join(SRC, rel), "utf8");
  expect(() => parse(code, { sourceType: "module", plugins: ["jsx", "classProperties", "optionalChaining", "nullishCoalescingOperator", "dynamicImport", "exportDefaultFrom"] })).not.toThrow();
});
