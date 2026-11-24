import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import productsRaw from "./data/products.json";
import optionsRaw from "./data/diy-options.json";
import rules from "./data/compatibility-rules.json";
import editorial from "./data/editorial.json";
import zh from "./locales/zh-CN.json";
import en from "./locales/en-US.json";
import Cup, { downloadCard } from "./features/Cup";
import {
  addLine,
  issues,
  load,
  recipeKey,
  recipePrice,
  toggle,
  total,
  type Item,
  type Product,
  type Line,
  type L,
} from "./features/logic";
import "./styles.css";
const products = productsRaw as Product[],
  options = optionsRaw as Item[];
type Lang = "zh" | "en";
type Work = {
  id: string;
  date: string;
  ids: string[];
  name: string;
  favorite: boolean;
};
type Order = {
  id: string;
  date: string;
  lines: Line[];
  mode: string;
  nickname: string;
  note: string;
  total: number;
};
const groups = ["B", "F", "T", "P"];
const steps = ["base", "flavor", "texture", "topping", "finish"];
const mainNames: Record<string, L> = {
  "Qie.Classic": { zh: "Qie.Classic 经典系列", en: "Qie.Classic" },
  "Qie.Lab": { zh: "Qie.Lab 喫怪实验室", en: "Qie.Lab" },
  "Qie.Mix": { zh: "Qie.Mix 万般随侬", en: "Qie.Mix" },
  Shared: { zh: "共享配套产品", en: "Pastries, sets & gifts" },
};
function App() {
  const [lang, setLang] = useState<Lang>(() => load("qie-lang", "zh"));
  const t = (k: string) => (lang === "zh" ? zh : en)[k as keyof typeof zh] || k;
  const l = (v: L) => v[lang];
  const [page, setPage] = useState(
    ["home", "menu", "mix", "culture", "orders"].includes(
      location.hash.slice(1),
    )
      ? location.hash.slice(1)
      : "home",
  );
  const [cart, setCart] = useState<Line[]>(() => load("qie-cart", []));
  const [orders, setOrders] = useState<Order[]>(() => load("qie-orders", []));
  const [works, setWorks] = useState<Work[]>(() => load("qie-works", []));
  const [toast, setToast] = useState("");
  const [demo, setDemo] = useState(false);
  const [modal, setModal] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [max, setMax] = useState(120);
  const [tag, setTag] = useState("all");
  const [qty, setQty] = useState(1);
  const [temp, setTemp] = useState("");
  const [sweet, setSweet] = useState("");
  const [mode, setMode] = useState("dine");
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [custom, setCustom] = useState("");
  const [designId, setDesignId] = useState<string>(() => crypto.randomUUID());
  const [designDate, setDesignDate] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" }),
  );
  const [busy, setBusy] = useState(false);
  const [region, setRegion] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = options.filter((o) => ids.includes(o.id));
  const price = recipePrice(ids, options);
  const auto: L = {
    zh: selected.map((o) => o.name.zh).join("") + "咖啡",
    en: selected.map((o) => o.name.en).join(" + ") + " Coffee",
  };
  const problems = issues(ids, rules.rules);
  const valid =
    selected.some((o) => o.group === "B") &&
    !problems.some((x) => x.severity === "block");
  useEffect(() => {
    const f = () => {
      if (location.hash === "#main") {
        document.getElementById("main")?.focus();
        return;
      }
      setPage(
        ["home", "menu", "mix", "culture", "orders"].includes(
          location.hash.slice(1),
        )
          ? location.hash.slice(1)
          : "home",
      );
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    for (const [k, v] of Object.entries({
      "qie-cart": cart,
      "qie-orders": orders,
      "qie-works": works,
      "qie-lang": lang,
    })) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch {
        setToast(t("storageError"));
      }
    }
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [cart, orders, works, lang]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    const d = dialog.current;
    if (modal || cartOpen || checkout || receipt) {
      if (!d?.open) d?.showModal();
    } else d?.close();
  }, [modal, cartOpen, checkout, receipt]);
  function close() {
    setModal(null);
    setCartOpen(false);
    setCheckout(false);
    setReceipt(null);
  }
  function openProduct(p: Product) {
    setQty(1);
    setTemp(p.temperature[0] || "");
    setSweet(p.sweetness[0] || "");
    setModal(p);
  }
  function add(line: Line) {
    setCart((c) => addLine(c, line));
    setToast(t("added"));
  }
  function addProduct(p: Product) {
    if (p.status !== "available" && !demo) return;
    const spec: L = {
      zh: [p.spec.zh, temp ? t(temp) : "", sweet ? t(sweet) : ""]
        .filter(Boolean)
        .join(" · "),
      en: [
        p.spec.en,
        temp ? en[temp as keyof typeof en] : "",
        sweet ? en[sweet as keyof typeof en] : "",
      ]
        .filter(Boolean)
        .join(" · "),
    };
    spec.zh = [
      p.spec.zh,
      temp ? zh[temp as keyof typeof zh] : "",
      sweet ? zh[sweet as keyof typeof zh] : "",
    ]
      .filter(Boolean)
      .join(" · ");
    add({
      key: p.id + ":" + temp + ":" + sweet,
      name: p.name,
      price: p.price,
      qty,
      spec,
      concept: p.status !== "available",
    });
    setModal(null);
  }
  function addDIY(arr = selected, name = custom) {
    if (
      !arr.some((x) => x.group === "B") ||
      issues(
        arr.map((x) => x.id),
        rules.rules,
      ).some((x) => x.severity === "block")
    ) {
      setToast(t("required"));
      return;
    }
    const names = {
      zh: arr.map((x) => x.name.zh).join("") + "咖啡",
      en: arr.map((x) => x.name.en).join(" + ") + " Coffee",
    };
    add({
      key: recipeKey(
        arr.map((x) => x.id),
        name,
      ),
      name: name ? { zh: name, en: name } : names,
      price: total(arr),
      qty: 1,
      spec: {
        zh: "DIY 概念杯 · 容量待测试",
        en: "DIY concept cup · volume to be tested",
      },
      recipe: arr,
      concept: true,
    });
  }
  function save() {
    if (!valid) {
      setToast(t("required"));
      return;
    }
    const w = {
      id: designId,
      date: designDate,
      ids: [...ids],
      name: custom,
      favorite: false,
    };
    setWorks((prev) => [w, ...prev.filter((x) => x.id !== w.id)]);
    setToast(t("saved"));
  }
  async function download(w?: Work) {
    const arr = w ? options.filter((x) => w.ids.includes(x.id)) : selected;
    if (!arr.some((x) => x.group === "B")) {
      setToast(t("required"));
      return;
    }
    setBusy(true);
    try {
      await downloadCard(
        arr,
        w?.name ?? custom,
        arr.map((x) => x.name[lang]).join(lang === "zh" ? "" : " + ") +
          (lang === "zh" ? "咖啡" : " Coffee"),
        total(arr),
        w?.id ?? designId,
        w?.date ?? designDate,
        lang,
      );
    } catch {
      setToast(t("downloadError"));
    } finally {
      setBusy(false);
    }
  }
  function choose(o: Item) {
    try {
      setIds(toggle(ids, o, options, rules.limits, rules.rules));
    } catch (e) {
      setToast(t((e as Error).message));
    }
  }
  function changeQty(key: string, n: number) {
    setCart((c) =>
      c
        .map((x) =>
          x.key === key ? { ...x, qty: Math.max(0, Math.min(99, n)) } : x,
        )
        .filter((x) => x.qty > 0),
    );
  }
  function placeOrder() {
    if (!cart.length) return;
    const o = {
      id: "QIE-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
      date: new Date().toISOString(),
      lines: structuredClone(cart),
      mode,
      nickname,
      note,
      total: total(cart),
    };
    setOrders((prev) => [o, ...prev]);
    setCart([]);
    setCheckout(false);
    setCartOpen(false);
    setReceipt(o);
  }
  const image = (p: Product) => (
    <img
      src={import.meta.env.BASE_URL + p.image}
      alt={l(p.name) + " · " + t("visual")}
      loading="lazy"
    />
  );
  const category = (s: string) =>
    lang === "zh"
      ? s
      : editorial.categories[s as keyof typeof editorial.categories] || s;
  const card = (p: Product) => (
    <button className="product" key={p.id} onClick={() => openProduct(p)}>
      {image(p)}
      <span className="product-info">
        <span className="eyebrow">
          {p.seasonal
            ? t("seasonal")
            : p.main === "Shared"
              ? category(p.sub)
              : p.main}
        </span>
        <strong>{l(p.name)}</strong>
        <span className="secondary">
          {lang === "zh" ? p.name.en : category(p.sub)}
        </span>
        <span className="product-bottom">
          <b>¥{p.price}</b>
          <small>
            {p.status === "available" ? t("available") : t(p.status)}
          </small>
          <span className="plus">＋</span>
        </span>
      </span>
    </button>
  );
  const cartBody = () => (
    <>
      <div className="section-head">
        <h2>{t("cart")}</h2>
        <span>{cart.reduce((s, x) => s + x.qty, 0)}</span>
      </div>
      {!cart.length ? (
        <p className="empty">{t("empty")}</p>
      ) : (
        cart.map((x) => (
          <div className="cart-line" key={x.key}>
            <strong>{l(x.name)}</strong>
            <small>{l(x.spec)}</small>
            {x.concept && <small>{t("conceptRecipe")}</small>}
            {x.recipe && (
              <small>{x.recipe.map((i) => l(i.name)).join(" · ")}</small>
            )}
            <div className="row">
              <div className="quantity">
                <button
                  aria-label={t("qty") + " -"}
                  onClick={() => changeQty(x.key, x.qty - 1)}
                >
                  −
                </button>
                <span>{x.qty}</span>
                <button
                  aria-label={t("qty") + " +"}
                  onClick={() => changeQty(x.key, x.qty + 1)}
                >
                  ＋
                </button>
              </div>
              <span>¥{(x.qty * x.price).toFixed(2)}</span>
              <button
                className="text-button"
                onClick={() => changeQty(x.key, 0)}
              >
                {t("remove")}
              </button>
            </div>
          </div>
        ))
      )}
      <div className="section-head">
        <b>{t("total")}</b>
        <strong>¥{total(cart).toFixed(2)}</strong>
      </div>
      <button
        className="primary wide"
        disabled={!cart.length}
        onClick={() => {
          setCartOpen(false);
          setCheckout(true);
        }}
      >
        {t("checkout")}
      </button>
      <p className="hint">{t("checkoutHint")}</p>
    </>
  );
  const shown = products.filter(
    (p) =>
      (cat === "all" || p.main === cat || p.sub === cat) &&
      p.price <= max &&
      (tag === "all" || p.tags.includes(tag) || p.status === tag) &&
      [p.name.zh, p.name.en, p.ingredients.zh, p.ingredients.en]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header>
        <a className="brand" href="#home">
          <span>
            Qie.Coffee <i>喫咖啡</i>
          </span>
          <small>SHANGHAI COFFEE</small>
        </a>
        <nav aria-label="Main navigation">
          {["home", "menu", "mix", "culture"].map((p) => (
            <a key={p} className={page === p ? "active" : ""} href={"#" + p}>
              {t(p)}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            aria-label="Switch language"
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <button className="bag" onClick={() => setCartOpen(true)}>
            {t("cart")} <b>{cart.reduce((s, x) => s + x.qty, 0)}</b>
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {page === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">SHANGHAI SPIRIT. CHINESE FLAVORS.</p>
                <h1>
                  {lang === "zh" ? (
                    <>
                      一杯上海，
                      <br />
                      <em>万般中国。</em>
                    </>
                  ) : (
                    <>
                      Taste Shanghai.
                      <br />
                      <em>Discover China.</em>
                    </>
                  )}
                </h1>
                <p className="hero-en">
                  {lang === "zh"
                    ? "Taste Shanghai, Discover China."
                    : "一杯上海，万般中国"}
                </p>
                <p>
                  {lang === "zh"
                    ? "从熟悉的街头滋味，到意想不到的一杯。\n在上海，让中国风味自由相遇。"
                    : "From familiar neighborhood flavors to an unexpected cup. Let Chinese flavors meet freely in Shanghai."}
                </p>
                <div className="actions">
                  <a className="primary" href="#menu">
                    {t("menu")}
                  </a>
                  <a className="outline" href="#mix">
                    {t("mix")}
                  </a>
                </div>
                <div className="hero-bottom">{t("value")}</div>
              </div>
              <div className="hero-art">
                <span className="vertical">一杯上海 · 万般中国</span>
                <div className="art-circle" />
                <Cup
                  items={options.filter((x) =>
                    ["B05", "F01", "T03", "T02", "P04", "P06"].includes(x.id),
                  )}
                />
                <span className="art-caption">
                  THE SHANGHAI BLEND
                  <br />
                  <small>{t("visual")}</small>
                </span>
                <span className="stamp">
                  喫<br />
                  咖啡
                </span>
              </div>
            </section>
            <section className="intro">
              <p className="eyebrow">A NEW WAY TO TASTE CHINA</p>
              <h2>{t("story")}</h2>
              <p>{t("storyBody")}</p>
            </section>
            <section className="series-grid">
              {["Classic", "Lab", "Mix"].map((m, i) => (
                <a
                  className={"series series-" + m}
                  href={m === "Mix" ? "#mix" : "#menu"}
                  onClick={() => setCat("Qie." + m)}
                  key={m}
                >
                  <span className="eyebrow">
                    {
                      [
                        "品尝中国 / TASTE",
                        "重新想象 / REIMAGINE",
                        "亲手创造 / CREATE",
                      ][i]
                    }
                  </span>
                  <h2>Qie.{m}</h2>
                  <p>{t(m.toLowerCase() + "Slogan")}</p>
                  <span className="series-mark">{["典", "怪", "侬"][i]}</span>
                </a>
              ))}
            </section>
            <section className="section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">THE EDIT</p>
                  <h2>{t("new")}</h2>
                </div>
                <a href="#menu">{t("menu")}</a>
              </div>
              <div className="grid four">
                {products
                  .filter((p) => ["L01", "L02", "L03", "M01"].includes(p.id))
                  .map(card)}
              </div>
              <p className="hint">{t("recommendHint")}</p>
            </section>
            <section className="mix-banner">
              <div>
                <p className="eyebrow">QIE.MIX / YOUR CUP. YOUR RULES.</p>
                <h2>{t("mixSlogan")}</h2>
                <p>
                  {lang === "zh"
                    ? "5 种基底，30 项选择，一杯属于你的灵感。"
                    : "5 bases. 30 options. One cup of your own."}
                </p>
                <a href="#mix" className="primary">
                  {t("finish")}
                </a>
              </div>
              <div className="banner-word">随侬</div>
            </section>
            <section className="section">
              <div className="section-head">
                <h2>{t("recommend")}</h2>
                <small>{t("recommendHint")}</small>
              </div>
              <div className="grid four">
                {products
                  .filter((p) => ["C01", "C08", "C09", "M02"].includes(p.id))
                  .map(card)}
              </div>
            </section>
            <section className="section">
              <h2>{t("pair")}</h2>
              <div className="grid four">
                {products
                  .filter(
                    (p) => p.main === "Shared" && p.status === "available",
                  )
                  .filter((_, i) => [0, 2, 21, 22].includes(i))
                  .slice(0, 4)
                  .map(card)}
                {products
                  .filter(
                    (p) =>
                      p.sub === "文创与旅游伴手礼" && p.status === "available",
                  )
                  .slice(0, 2)
                  .map(card)}
              </div>
            </section>
          </>
        )}
        {page === "menu" && (
          <>
            <div className="page-title">
              <p className="eyebrow">THE MENU / SHANGHAI COFFEE</p>
              <h1>{t("menu")}</h1>
              <p>{t("checkoutHint")}</p>
            </div>
            <div className="menu-layout">
              <aside className="categories">
                <button
                  className={cat === "all" ? "selected" : ""}
                  onClick={() => setCat("all")}
                >
                  {t("all")} <small>63</small>
                </button>
                {Object.entries(mainNames).map(([key, value]) => (
                  <div key={key}>
                    <button
                      className={cat === key ? "selected" : ""}
                      onClick={() => setCat(key)}
                    >
                      {l(value)}
                    </button>
                    {Array.from(
                      new Set(
                        products
                          .filter((p) => p.main === key)
                          .map((p) => p.sub),
                      ),
                    ).map((sub) => (
                      <button
                        className={"sub " + (cat === sub ? "selected" : "")}
                        key={sub}
                        onClick={() => setCat(sub)}
                      >
                        {category(sub)}
                      </button>
                    ))}
                    {key === "Qie.Mix" && <a href="#mix">{t("mix")} DIY</a>}
                  </div>
                ))}
              </aside>
              <section>
                <div className="filters">
                  <input
                    aria-label={t("search")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search")}
                  />
                  <label>
                    {t("price")} ¥{max}
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={max}
                      onChange={(e) => setMax(+e.target.value)}
                    />
                  </label>
                  <label>
                    {t("tag")}
                    <select
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                    >
                      {[
                        "all",
                        "available",
                        "seasonal",
                        "Classic",
                        "Lab",
                        "Mix",
                      ].map((x) => (
                        <option key={x} value={x}>
                          {t(x)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="demo">
                  <input
                    type="checkbox"
                    checked={demo}
                    onChange={(e) => setDemo(e.target.checked)}
                  />
                  {t("demo")}
                  <small>{t("demoHint")}</small>
                </label>
                <div className="section-head">
                  <h2>
                    {cat === "all"
                      ? t("all")
                      : mainNames[cat]
                        ? l(mainNames[cat])
                        : category(cat)}
                  </h2>
                  <span>{shown.length}</span>
                </div>
                <div className="grid menu-grid">{shown.map(card)}</div>
                {!shown.length && <p>{t("emptyResults")}</p>}
              </section>
              <aside className="cart-panel">{cartBody()}</aside>
            </div>
          </>
        )}
        {page === "mix" && (
          <>
            <div className="page-title">
              <p className="eyebrow">
                QIE.MIX / A LITTLE EXPERIMENT, A LOT OF YOU.
              </p>
              <h1>{t("mixSlogan")}</h1>
              <p>{t("conceptRecipe")}</p>
            </div>
            <div className="steps">
              {steps.map((s, i) => (
                <button
                  key={s}
                  className={step === i ? "selected" : ""}
                  onClick={() => setStep(i)}
                >
                  <span>{i + 1}</span>
                  {t(s)}
                </button>
              ))}
            </div>
            <section className="designer">
              <div className="ingredients">
                <h2>{t(steps[step])}</h2>
                <p className="hint">
                  {step === 0
                    ? t("required")
                    : step < 4
                      ? `${t("max")} ${rules.limits[groups[step] as keyof typeof rules.limits]}`
                      : t("conceptRecipe")}
                </p>
                {step < 4 ? (
                  <div className="option-grid">
                    {options
                      .filter((o) => o.group === groups[step])
                      .map((o) => (
                        <button
                          key={o.id}
                          aria-pressed={ids.includes(o.id)}
                          className={
                            "option " + (ids.includes(o.id) ? "chosen" : "")
                          }
                          onClick={() => choose(o)}
                        >
                          <span
                            className={"ingredient-dot ingredient-" + o.id}
                          />
                          <strong>{l(o.name)}</strong>
                          <span>
                            ¥{o.price} {ids.includes(o.id) ? "✓" : "＋"}
                          </span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <>
                    <label>
                      {t("custom")}
                      <input
                        maxLength={50}
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        placeholder={l(auto)}
                      />
                    </label>
                    <p className="eyebrow">{t("autoName")}</p>
                    <h3>{l(auto)}</h3>
                    <button
                      className="outline"
                      onClick={save}
                      disabled={!valid}
                    >
                      {t("save")}
                    </button>
                    <button
                      className="outline"
                      disabled={!valid || busy}
                      onClick={() => download()}
                    >
                      {t(busy ? "loading" : "download")}
                    </button>
                  </>
                )}
                <div className="actions">
                  <button
                    className="outline"
                    disabled={step === 0}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    {t("back")}
                  </button>
                  {step < 4 && (
                    <button
                      className="primary"
                      disabled={!selected.some((o) => o.group === "B")}
                      onClick={() => setStep((s) => s + 1)}
                    >
                      {t("next")}
                    </button>
                  )}
                </div>
              </div>
              <div className="cup-stage">
                <p className="eyebrow">MADE BY YOU. INSPIRED BY CHINA.</p>
                <Cup items={selected} />
                <p className="hint">{t("visual")}</p>
              </div>
              <aside className="recipe">
                <p className="eyebrow">YOUR RECIPE</p>
                <h2>{custom || l(auto)}</h2>
                {selected.length === 0 && <p>{t("required")}</p>}
                {selected.map((o) => (
                  <div className="recipe-line" key={o.id}>
                    <span>{l(o.name)}</span>
                    <span>
                      ¥{o.price}{" "}
                      <button
                        aria-label={t("remove") + " " + l(o.name)}
                        onClick={() => setIds(ids.filter((id) => id !== o.id))}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                ))}
                {problems.map((p) => (
                  <p className={"notice " + p.severity} key={p.id}>
                    {p[lang]}
                  </p>
                ))}
                <p className="hint">
                  {t("allergens")}:{" "}
                  {[...new Set(selected.flatMap((x) => x.allergens))]
                    .map(t)
                    .join(", ") || "—"}
                </p>
                <p className="hint">{t("unknown")}</p>
                {selected.some((o) => o.group === "T") && (
                  <p className="hint">{t("spoon")}</p>
                )}
                <div className="section-head">
                  <span>{t("total")}</span>
                  <strong className="price" key={price}>
                    ¥{price}
                  </strong>
                </div>
                <button
                  className="primary wide"
                  disabled={!valid}
                  onClick={() => addDIY()}
                >
                  {t("add")}
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    setIds([]);
                    setCustom("");
                    setStep(0);
                    setDesignId(crypto.randomUUID());
                    setDesignDate(
                      new Date().toLocaleDateString("en-CA", {
                        timeZone: "Asia/Shanghai",
                      }),
                    );
                  }}
                >
                  {t("reset")}
                </button>
                <p className="hint">{t("conceptRecipe")}</p>
              </aside>
            </section>
          </>
        )}
        {page === "culture" && (
          <>
            <section className="culture-hero">
              <p className="eyebrow">QIE.COFFEE / THE SHANGHAI PERSPECTIVE</p>
              <h1>
                {lang === "zh"
                  ? "一杯上海，万般中国。"
                  : "Taste Shanghai, Discover China."}
              </h1>
              <h2>{t("story")}</h2>
              <p>{t("storyBody")}</p>
              <p>{t("storyMore")}</p>
              <div className="value-path">{t("value")}</div>
              <p className="hint">
                <a
                  href="https://english.shanghai.gov.cn/en-GlobalTasteinShanghai2026-LocalFlavors/20260416/b2c7838bef6944fba895deb8a17e4698.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  {lang === "zh"
                    ? "文化延伸阅读：上海市政府 · 海派蝴蝶酥"
                    : "Read more: Shanghai government · Palmier culture"}
                </a>
              </p>
            </section>
            <section className="series-grid">
              {["Classic", "Lab", "Mix"].map((m) => (
                <div className={"series series-" + m} key={m}>
                  <h2>Qie.{m}</h2>
                  <p>{t(m.toLowerCase() + "Slogan")}</p>
                </div>
              ))}
            </section>
            <section className="section">
              <p className="eyebrow">A FLAVOR ATLAS</p>
              <h2>{t("map")}</h2>
              <p>{t("mapHint")}</p>
              <div className="flavor-atlas">
                <div className="regions">
                  {editorial.regions.map((r, i) => (
                    <button
                      className={region === i ? "selected" : ""}
                      key={r.en}
                      onClick={() => setRegion(i)}
                    >
                      {r[lang]}
                    </button>
                  ))}
                  <p>{l(editorial.regions[region].text)}</p>
                </div>
                <div className="grid three">
                  {products
                    .filter((p) => editorial.regions[region].ids.includes(p.id))
                    .map(card)}
                </div>
              </div>
            </section>
            <section className="section">
              <h2>{t("works")}</h2>
              <p className="hint">
                {lang === "zh"
                  ? "仅保存于本机浏览器，无联网用户评论。"
                  : "Saved only in this browser. No online community reviews."}
              </p>
              {!works.length && <p>{t("noWorks")}</p>}
              <div className="grid three">
                {works.map((w) => {
                  const arr = options.filter((o) => w.ids.includes(o.id));
                  return (
                    <article className="work" key={w.id}>
                      <Cup items={arr} />
                      <h3>{w.name || arr.map((o) => l(o.name)).join(" + ")}</h3>
                      <p>{arr.map((o) => l(o.name)).join(" · ")}</p>
                      <p>
                        ¥{total(arr)} · {w.date}
                      </p>
                      <div className="actions">
                        <button onClick={() => addDIY(arr, w.name)}>
                          {t("add")}
                        </button>
                        <button
                          onClick={() => {
                            setIds(w.ids);
                            setCustom(w.name);
                            setDesignId(w.id);
                            setDesignDate(w.date);
                            setStep(4);
                            location.hash = "mix";
                          }}
                        >
                          {t("edit")}
                        </button>
                        <button
                          aria-pressed={w.favorite}
                          onClick={() =>
                            setWorks(
                              works.map((x) =>
                                x.id === w.id
                                  ? { ...x, favorite: !x.favorite }
                                  : x,
                              ),
                            )
                          }
                        >
                          {w.favorite ? "♥" : "♡"}{" "}
                          {t(w.favorite ? "unfavorite" : "favorite")}
                        </button>
                        <button disabled={busy} onClick={() => download(w)}>
                          {t("download")}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
        {page === "orders" && (
          <section className="section">
            <h1>{t("orders")}</h1>
            {!orders.length ? (
              <p>{t("noOrders")}</p>
            ) : (
              orders.map((o) => (
                <button
                  className="order-row"
                  onClick={() => setReceipt(o)}
                  key={o.id}
                >
                  <strong>{o.id}</strong>
                  <span>
                    {new Date(o.date).toLocaleString(
                      lang === "zh" ? "zh-CN" : "en-US",
                      { timeZone: "Asia/Shanghai" },
                    )}
                  </span>
                  <b>¥{o.total}</b>
                </button>
              ))
            )}
          </section>
        )}
      </main>
      <footer>
        <div className="brand">
          <span>
            Qie.Coffee <i>喫咖啡</i>
          </span>
          <small>SHANGHAI COFFEE</small>
        </div>
        <p>{t("value")}</p>
        <a href="#orders">{t("orders")}</a>
        <small>{t("checkoutHint")}</small>
      </footer>
      <button className="mobile-cart" onClick={() => setCartOpen(true)}>
        {t("cart")} ({cart.reduce((s, x) => s + x.qty, 0)}){" "}
        <b>¥{total(cart).toFixed(2)}</b> · {t("checkout")}
      </button>
      <dialog
        ref={dialog}
        onCancel={close}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <button
          className="dialog-close"
          aria-label={t("close")}
          onClick={close}
        >
          ×
        </button>
        {modal && (
          <div className="detail">
            <div>{image(modal)}</div>
            <div>
              <p className="eyebrow">
                {modal.main} / {category(modal.sub)}
              </p>
              <h2>{l(modal.name)}</h2>
              <p>{lang === "zh" ? modal.name.en : modal.name.zh}</p>
              <h3>¥{modal.price}</h3>
              <span className="badge">{t(modal.status)}</span>
              {modal.seasonal && <span className="badge">{t("seasonal")}</span>}
              <p>{l(modal.description)}</p>
              <p className="hint">{l(modal.notes)}</p>
              <h3>{t("ingredients")}</h3>
              <p>{l(modal.ingredients)}</p>
              <p>
                {t("spec")}: {l(modal.spec)}
              </p>
              <h3>{t("inspiration")}</h3>
              <p>
                {editorial.inspirations[
                  modal.id as keyof typeof editorial.inspirations
                ]?.[lang] ||
                  t(
                    modal.main === "Qie.Mix"
                      ? "mixSlogan"
                      : modal.main === "Qie.Classic"
                        ? "classicSlogan"
                        : "storyMore",
                  )}
              </p>
              {modal.sub === "中国奇味挑战" && (
                <p>
                  {t("curiosity")}:{" "}
                  {"●".repeat(3 + (Number(modal.id.slice(1)) % 3))} / 5
                </p>
              )}
              <p className="notice">{t("conceptRecipe")}</p>
              <p>
                {t("allergens")}: {modal.allergens.map(t).join(", ") || "—"}
              </p>
              <p className="hint">{t("unknown")}</p>
              {modal.alcohol && <p className="notice">{t("alcohol")}</p>}
              {modal.id === "L04" && (
                <p>
                  {lang === "zh"
                    ? "风味意象，不添加肉馅。"
                    : "Flavor inspiration only; no meat filling."}
                </p>
              )}
              {modal.main === "Qie.Mix" && <p>{t("spoon")}</p>}
              <div className="actions">
                {modal.temperature.length > 0 && (
                  <label>
                    {t("temperature")}
                    <select
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                    >
                      {modal.temperature.map((v) => (
                        <option key={v} value={v}>
                          {t(v)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {modal.sweetness.length > 0 && (
                  <label>
                    {t("sweetness")}
                    <select
                      value={sweet}
                      onChange={(e) => setSweet(e.target.value)}
                    >
                      {modal.sweetness.map((v) => (
                        <option key={v} value={v}>
                          {t(v)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  {t("qty")}
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, Math.min(99, +e.target.value || 1)))
                    }
                  />
                </label>
              </div>
              <button
                className="primary wide"
                disabled={modal.status !== "available" && !demo}
                onClick={() => addProduct(modal)}
              >
                {modal.status !== "available" && !demo
                  ? t("concept")
                  : t("add")}{" "}
                · ¥{modal.price * qty}
              </button>
            </div>
          </div>
        )}
        {cartOpen && <div className="modal-content">{cartBody()}</div>}
        {checkout && (
          <div className="modal-content">
            <h2>{t("checkout")}</h2>
            <p>{t("checkoutHint")}</p>
            {cart.map((x) => (
              <p key={x.key}>
                {l(x.name)} × {x.qty} <b>¥{x.price * x.qty}</b>
              </p>
            ))}
            <h3>
              {t("total")} ¥{total(cart)}
            </h3>
            <div className="actions">
              {["dine", "take"].map((m) => (
                <label key={m}>
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === m}
                    onChange={() => setMode(m)}
                  />
                  {t(m)}
                </label>
              ))}
            </div>
            <label>
              {t("nickname")}
              <input
                maxLength={30}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            <label>
              {t("note")}
              <textarea
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <button
              className="primary wide"
              onClick={placeOrder}
              disabled={!cart.length}
            >
              {t("confirm")}
            </button>
          </div>
        )}
        {receipt && (
          <div className="modal-content receipt">
            <p className="brand">Qie.Coffee 喫咖啡</p>
            <h2>{t("receipt")}</h2>
            <p>{t("checkoutHint")}</p>
            <p>
              {t("orderId")}: {receipt.id}
            </p>
            <p>
              {t("time")}:{" "}
              {new Date(receipt.date).toLocaleString(
                lang === "zh" ? "zh-CN" : "en-US",
                { timeZone: "Asia/Shanghai" },
              )}{" "}
              CST
            </p>
            {receipt.lines.map((x) => (
              <div className="cart-line" key={x.key}>
                <strong>{l(x.name)}</strong>
                <p>{l(x.spec)}</p>
                {x.recipe && (
                  <p>
                    {x.recipe
                      .map((o) => l(o.name) + ` ¥${o.price}`)
                      .join(" · ")}
                  </p>
                )}
                <div className="row">
                  ¥{x.price} × {x.qty}
                  <b>¥{x.price * x.qty}</b>
                </div>
              </div>
            ))}
            <h3>
              {t("total")}: ¥{receipt.total.toFixed(2)}
            </h3>
            <p>
              {t(receipt.mode)} · {receipt.nickname}
            </p>
            <p>{receipt.note}</p>
            <button className="outline" onClick={() => window.print()}>
              {t("print")}
            </button>
          </div>
        )}
      </dialog>
      {toast && (
        <div role="status" className="toast">
          {toast}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
