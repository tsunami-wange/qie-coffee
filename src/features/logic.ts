export type L = { zh: string; en: string };
export type Item = {
  id: string;
  name: L;
  price: number;
  ingredients: L;
  allergens: string[];
  alcohol: boolean;
  group?: string;
  main: string;
  sub: string;
  notes: L;
};
export type Product = Item & {
  status: string;
  seasonal: boolean;
  spec: L;
  image: string;
  tags: string[];
  description: L;
  temperature: string[];
  sweetness: string[];
};
export type Line = {
  key: string;
  name: L;
  price: number;
  qty: number;
  spec: L;
  recipe?: Item[];
  concept?: boolean;
};
export type Rule = {
  id: string;
  severity: string;
  any: string[];
  with: string[];
  zh: string;
  en: string;
};
export function issues(ids: string[], rules: Rule[]) {
  return rules.filter(
    (r) =>
      r.any.some((x) => ids.includes(x)) &&
      (!r.with.length || r.with.some((x) => ids.includes(x))),
  );
}
export function total(items: { price: number; qty?: number }[]) {
  return (
    Math.round(items.reduce((a, b) => a + b.price * (b.qty ?? 1), 0) * 100) /
    100
  );
}
export function recipePrice(ids: string[], options: Item[]) {
  return total(options.filter((x) => new Set(ids).has(x.id)));
}
export function recipeKey(ids: string[], name: string) {
  return "DIY:" + JSON.stringify([Array.from(new Set(ids)).sort(), name]);
}
export function addLine(cart: Line[], line: Line) {
  const old = cart.find((x) => x.key === line.key);
  return old
    ? cart.map((x) =>
        x.key === line.key ? { ...x, qty: x.qty + line.qty } : x,
      )
    : [...cart, line];
}
export function toggle(
  ids: string[],
  item: Item,
  options: Item[],
  limits: Record<string, number>,
  rules: Rule[],
) {
  if (ids.includes(item.id)) return ids.filter((x) => x !== item.id);
  let next = ids;
  if (item.group === "B")
    next = ids.filter((id) => options.find((o) => o.id === id)?.group !== "B");
  else if (
    ids.filter((id) => options.find((o) => o.id === id)?.group === item.group)
      .length >= limits[item.group!]
  )
    throw new Error("limit");
  next = [...next, item.id];
  if (issues(next, rules).some((x) => x.severity === "block"))
    throw new Error("blocked");
  return next;
}
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
