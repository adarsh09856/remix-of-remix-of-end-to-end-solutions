import { useEffect, useState } from "react";

export type CountryCode = "BT" | "IN" | "US";

export const COUNTRIES: Array<{
  code: CountryCode;
  name: string;
  currency: string;
  symbol: string;
  flag: string;
  locale: string;
}> = [
    { code: "BT", name: "Bhutan", currency: "BTN", symbol: "Nu.", flag: "🇧🇹", locale: "en-IN" },
    { code: "IN", name: "India", currency: "INR", symbol: "₹", flag: "🇮🇳", locale: "en-IN" },
    { code: "US", name: "USA", currency: "USD", symbol: "$", flag: "🇺🇸", locale: "en-US" },
  ];

const KEY = "drukharvest_country";
const EVT = "drukharvest-country-changed";

export function getCountryMeta(code: CountryCode) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

// FX rates from BTN (base). BTN is pegged 1:1 to INR.
export const FX_FROM_BTN: Record<CountryCode, number> = {
  BT: 1,
  IN: 1,
  US: 0.012,
};

export function pickPrice(
  product: { price_inr?: number | string | null; price_in?: number | string | null; price_us?: number | string | null },
  code: CountryCode,
): number {
  const base = Number(product.price_inr ?? 0);
  if (code === "IN") {
    const v = product.price_in;
    if (v != null && v !== "") return Number(v);
    return Math.round(base * FX_FROM_BTN.IN);
  }
  if (code === "US") {
    const v = product.price_us;
    if (v != null && v !== "") return Number(v);
    return Math.round(base * FX_FROM_BTN.US * 100) / 100;
  }
  return base;
}

export function pickCompareAt(
  product: { compare_at_inr?: number | string | null; compare_at_in?: number | string | null; compare_at_us?: number | string | null },
  code: CountryCode,
): number | null {
  const raw =
    code === "IN" ? product.compare_at_in ?? product.compare_at_inr :
      code === "US" ? product.compare_at_us : product.compare_at_inr;
  if (raw == null || raw === "") {
    if (code === "US" && product.compare_at_inr != null && product.compare_at_inr !== "") {
      return Math.round(Number(product.compare_at_inr) * FX_FROM_BTN.US * 100) / 100;
    }
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatMoney(amount: number | string, code: CountryCode): string {
  const meta = getCountryMeta(code);
  const n = typeof amount === "string" ? Number(amount) : amount;
  const val = Number.isFinite(n) ? n : 0;
  if (code === "US") {
    return `$${new Intl.NumberFormat(meta.locale, { maximumFractionDigits: 2 }).format(val)}`;
  }
  const num = new Intl.NumberFormat(meta.locale, { maximumFractionDigits: 0 }).format(val);
  return `${meta.symbol} ${num}`;
}

export function formatByCurrency(amount: number | string, currency?: string | null): string {
  const cur = (currency ?? "BTN").toUpperCase();
  const code: CountryCode = cur === "INR" ? "IN" : cur === "USD" ? "US" : "BT";
  return formatMoney(amount, code);
}

function readCountry(): CountryCode {
  if (typeof window === "undefined") return "BT";
  const v = window.localStorage.getItem(KEY);
  return v === "IN" || v === "US" || v === "BT" ? v : "BT";
}

export function setCountry(code: CountryCode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, code);
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useCountry(): [CountryCode, (c: CountryCode) => void, boolean] {
  const [code, setCode] = useState<CountryCode>("BT");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const refresh = () => setCode(readCountry());
    refresh();
    setReady(true);
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return [code, setCountry, ready];
}
