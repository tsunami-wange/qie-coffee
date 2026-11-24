import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  recipePrice,
  recipeKey,
  addLine,
  toggle,
  issues,
  total,
} from "../src/features/logic.ts";
const read = (p: string) =>
  JSON.parse(
    fs.readFileSync(new URL("../src/data/" + p, import.meta.url), "utf8"),
  );
const p = read("products.json"),
  o = read("diy-options.json"),
  r = read("compatibility-rules.json");
test("complete menu, unique IDs, category counts and independent image paths", () => {
  assert.equal(p.length, 63);
  assert.equal(o.length, 30);
  assert.equal(new Set([...p, ...o].map((x) => x.id)).size, 93);
  assert.equal(new Set([...p, ...o].map((x) => x.sub)).size, 14);
  assert.deepEqual(
    ["B", "F", "T", "P"].map((g) => o.filter((x) => x.group === g).length),
    [5, 10, 8, 7],
  );
  assert.deepEqual(
    ["Qie.Classic", "Qie.Lab", "Qie.Mix", "Shared"].map(
      (m) => p.filter((x) => x.main === m).length,
    ),
    [17, 12, 6, 28],
  );
  for (const x of p) {
    assert.ok(fs.existsSync("public/" + x.image));
    assert.ok(x.name.en);
    assert.ok(x.ingredients.en);
    assert.ok(x.price > 0);
  }
});
test("all options have independent exact price addition, deduped base", () => {
  for (const x of o)
    assert.equal(
      recipePrice(["B01", x.id, x.id], o),
      x.id === "B01" ? 20 : 20 + x.price,
    );
  assert.equal(
    recipePrice(["B03", "F01", "F02", "T01", "T02", "T03", "P01", "P04"], o),
    58,
  );
});
test("limits enforced for all four groups and base replacement", () => {
  for (const g of ["F", "T", "P"]) {
    const opts = o.filter((x) => x.group === g);
    let ids = ["B01"];
    for (const x of opts.slice(0, r.limits[g]))
      ids = toggle(ids, x, o, r.limits, []);
    assert.throws(
      () => toggle(ids, opts[r.limits[g]], o, r.limits, []),
      /limit/,
    );
    assert.equal(toggle(ids, opts[0], o, r.limits, []).length, ids.length - 1);
  }
  assert.deepEqual(
    toggle(
      ["B01"],
      o.find((x) => x.id === "B05"),
      o,
      r.limits,
      r.rules,
    ),
    ["B05"],
  );
});
test("compatibility works in both selection orders and distinguishes warnings", () => {
  assert.throws(
    () =>
      toggle(
        ["B03"],
        o.find((x) => x.id === "F05"),
        o,
        r.limits,
        r.rules,
      ),
    /blocked/,
  );
  assert.throws(
    () =>
      toggle(
        ["B01", "F05"],
        o.find((x) => x.id === "B03"),
        o,
        r.limits,
        r.rules,
      ),
    /blocked/,
  );
  assert.equal(issues(["F05", "T04"], r.rules)[0].severity, "warning");
  assert.equal(issues(["F07"], r.rules)[0].id, "alcohol");
});
test("customized lines preserve recipe and names; different recipes do not merge", () => {
  const base = {
    name: { zh: "我的咖啡", en: "My cup" },
    spec: { zh: "杯", en: "cup" },
    price: 23,
    qty: 1,
    recipe: o.slice(0, 1),
  };
  const a = { ...base, key: recipeKey(["B01", "F01"], "A") },
    b = { ...base, key: recipeKey(["B01", "F02"], "A") };
  let c = addLine([], a);
  c = addLine(c, b);
  c = addLine(c, a);
  assert.equal(c.length, 2);
  assert.equal(c[0].qty, 2);
  assert.equal(total(c), 69);
  assert.equal(recipeKey(["F01", "B01"], "A"), a.key);
  assert.notEqual(recipeKey(["B01", "F01"], "B"), a.key);
});
test("public JSON excludes cost and budget columns and untranslated Chinese in English ingredients", () => {
  for (const x of [...p, ...o]) {
    assert.doesNotMatch(x.ingredients.en, /[\u4e00-\u9fff]/);
    assert.doesNotMatch(JSON.stringify(x), /采购|单份净用量|BOM|材料成本/);
  }
  const zh = JSON.parse(fs.readFileSync("src/locales/zh-CN.json", "utf8")),
    en = JSON.parse(fs.readFileSync("src/locales/en-US.json", "utf8"));
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
});
