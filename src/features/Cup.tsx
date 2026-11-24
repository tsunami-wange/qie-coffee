import type { Item } from "./logic";
export function cupSvg(items: Item[]) {
  const ids = items.map((x) => x.id),
    has = (s: string) => ids.includes(s);
  const base = has("B03")
    ? "#be9270"
    : has("B04")
      ? "#c9b384"
      : has("B05")
        ? "#e0cbb0"
        : "#684431";
  let parts = "";
  const colors: Record<string, string> = {
    F01: "#d6b354",
    F02: "#4c4641",
    F03: "#9c7c48",
    F04: "#7b915b",
    F05: "#b2564c",
    F06: "#ce8753",
    F07: "#eee6d0",
    F08: "#b18762",
    F09: "#8d5448",
    F10: "#8a5550",
  };
  items
    .filter((x) => x.group === "F")
    .forEach(
      (x, i) =>
        (parts += `<path d="M110 ${230 - i * 40} Q200 ${250 - i * 40} 290 ${225 - i * 40} L282 ${270 - i * 40} Q200 ${285 - i * 40} 118 ${270 - i * 40}Z" fill="${colors[x.id]}" opacity=".85"/>`),
    );
  items
    .filter((x) => x.group === "T")
    .forEach((x, j) => {
      for (let i = 0; i < 13; i++) {
        const cx = 125 + ((i * 37 + j * 11) % 145),
          cy = 285 + ((i * 13 + j * 7) % 45);
        const color = (
          {
            T01: "#efd49a",
            T02: "#eee3d1",
            T03: "#743e4e",
            T04: "#fff4da",
            T05: "#b798ba",
            T06: "#faf2d5",
            T07: "#45302b",
            T08: "#9a4d45",
          } as Record<string, string>
        )[x.id];
        parts +=
          x.id === "T07"
            ? `<rect x="${cx}" y="${cy}" width="13" height="12" rx="2" fill="${color}"/>`
            : `<ellipse cx="${cx}" cy="${cy}" rx="${x.id === "T03" ? 3 : 8}" ry="${x.id === "T01" ? 3 : 6}" fill="${color}"/>`;
      }
    });
  items
    .filter((x) => x.group === "P")
    .forEach((x, j) => {
      if (x.id === "P04")
        parts += `<path d="M240 165L265 46" stroke="#b59a6c" stroke-width="4"/>${[70, 95, 120].map((y) => `<circle cx="${265 - (y - 46) / 5}" cy="${y}" r="14" fill="#ab4342"/><circle cx="${260 - (y - 46) / 5}" cy="${y - 5}" r="3" fill="#fff" opacity=".7"/>`).join("")}`;
      else if (x.id === "P06")
        parts +=
          '<path d="M107 159Q112 119 145 140Q175 102 203 137Q247 112 278 144L290 166Z" fill="#fff2d9"/>';
      else
        for (let i = 0; i < 12; i++)
          parts += `<path d="M${115 + i * 13} ${151 + (i % 3) * 4 - j * 8} l10 -${10 + (i % 4) * 4} l6 15Z" fill="${x.id === "P01" ? "#493029" : x.id === "P05" ? "#b84965" : x.id === "P07" ? "#a86c32" : "#d2aa69"}"/>`;
    });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420"><defs><clipPath id="cup"><path d="M105 158L127 350Q200 373 273 350L295 158Z"/></clipPath></defs><ellipse cx="200" cy="372" rx="102" ry="15" fill="#302a24" opacity=".1"/><path d="M105 158L127 350Q200 373 273 350L295 158Z" fill="${base}" stroke="#fff7e8" stroke-width="3"/><g clip-path="url(#cup)"><path d="M105 190Q200 218 295 186L286 242Q200 264 114 242Z" fill="#ecd9b6" opacity=".85"/>${parts}</g><ellipse cx="200" cy="158" rx="95" ry="24" fill="#e3c8a1"/><ellipse cx="200" cy="158" rx="80" ry="16" fill="${base}"/><path d="M120 181L138 332" stroke="#fff" opacity=".38" stroke-width="9"/><text x="200" y="260" text-anchor="middle" fill="#294438" font-family="Georgia" font-size="36">Qie.</text><text x="200" y="281" text-anchor="middle" fill="#294438" font-family="sans-serif" font-size="8" letter-spacing="3">YOUR CUP. YOUR RULES.</text>${top(items)}</svg>`;
}
function top(items: Item[]) {
  return items
    .filter((x) => x.group === "P")
    .map((x, j) =>
      x.id === "P04"
        ? '<path d="M248 162L270 40" stroke="#b59a6c" stroke-width="4"/><g fill="#a83d43" stroke="#f2c5a2"><circle cx="265" cy="64" r="13"/><circle cx="260" cy="91" r="13"/><circle cx="255" cy="118" r="13"/></g>'
        : x.id === "P06"
          ? '<path d="M110 153Q130 112 153 137Q183 103 208 134Q250 110 284 152Z" fill="#fff4de"/>'
          : Array.from(
              { length: 10 },
              (_, i) =>
                `<path d="M${115 + i * 16} ${145 + j * 8}l8 -${12 + (i % 3) * 4}l9 18Z" fill="${x.id === "P01" ? "#493029" : x.id === "P05" ? "#ad405a" : "#c59247"}"/>`,
            ).join(""),
    )
    .join("");
}
export default function Cup({ items }: { items: Item[] }) {
  return (
    <div
      className="cup"
      aria-label="Concept coffee illustration"
      role="img"
      dangerouslySetInnerHTML={{ __html: cupSvg(items) }}
    />
  );
}
export async function downloadCard(
  items: Item[],
  name: string,
  auto: string,
  price: number,
  id: string,
  date: string,
  lang: "zh" | "en",
) {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1800;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f3ede2";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#b59a6c";
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, 1004, 1724);
  ctx.fillStyle = "#294438";
  ctx.font = "52px Georgia";
  ctx.fillText("Qie.Coffee  /  喫咖啡", 80, 125);
  ctx.font = "18px sans-serif";
  ctx.fillText("SHANGHAI COFFEE   ·   YOUR CUP. YOUR RULES.", 80, 164);
  const img = new Image();
  const url = URL.createObjectURL(
    new Blob([cupSvg(items)], { type: "image/svg+xml" }),
  );
  try {
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
      img.src = url;
    });
    ctx.drawImage(img, 260, 190, 560, 580);
  } finally {
    URL.revokeObjectURL(url);
  }
  let y = 805;
  const wrap = (s: string, size: number) => {
    ctx.font = `${size}px sans-serif`;
    let line = "";
    for (const ch of s) {
      if (ctx.measureText(line + ch).width > 900) {
        ctx.fillText(line, 90, y);
        y += size * 1.5;
        line = "";
      }
      line += ch;
    }
    ctx.fillText(line, 90, y);
    y += size * 1.6;
  };
  wrap(name || auto, 36);
  wrap(auto, 22);
  wrap(items.map((x) => x.name[lang] + ` ¥${x.price}`).join(" · "), 23);
  wrap(`¥${price.toFixed(2)}`, 40);
  ctx.font = "20px sans-serif";
  ctx.fillText(id + "  ·  " + date, 90, 1630);
  ctx.fillText(
    lang === "zh"
      ? "概念视觉示意 · 实际风味待测试"
      : "Concept illustration · recipe requires testing",
    90,
    1670,
  );
  ctx.font = "30px serif";
  ctx.fillText("一杯上海，万般中国", 90, 1720);
  const blob = await new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("PNG"))), "image/png"),
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Qie-${id}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
