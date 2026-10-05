import { useEffect, useMemo, useState } from "react";

export type LocalCartProduct = {
  id: string;
  name: string;
  slug: string;
  price_inr: number | string;
  price_in?: number | string | null;
  price_us?: number | string | null;
  unit: string;
  image_url?: string | null;
  stock?: number | null;
};

export type LocalCartItem = {
  id: string;
  product: LocalCartProduct;
  quantity: number;
};

const CART_KEY = "drukharvest_guest_cart";
const LEGACY_CART_KEY = "drukhavest_guest_cart";
const CART_EVENT = "drukharvest-cart-updated";
const LEGACY_CART_EVENT = "drukhavest-cart-updated";

function readCart(): LocalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(CART_KEY) ?? window.localStorage.getItem(LEGACY_CART_KEY) ?? "[]";
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: LocalCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.localStorage.removeItem(LEGACY_CART_KEY);
  window.dispatchEvent(new CustomEvent(CART_EVENT));
  window.dispatchEvent(new CustomEvent(LEGACY_CART_EVENT));
}

export function addLocalCartItem(product: LocalCartProduct, quantity = 1) {
  const items = readCart();
  const existing = items.find((item) => item.product.id === product.id);
  const safeQty = Math.max(1, Math.min(99, quantity));
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + safeQty);
  } else {
    items.push({ id: product.id, product, quantity: safeQty });
  }
  writeCart(items);
}

export function updateLocalCartItem(productId: string, quantity: number) {
  if (quantity < 1) {
    removeLocalCartItem(productId);
    return;
  }
  const next = readCart().map((item) =>
    item.product.id === productId ? { ...item, quantity: Math.min(99, quantity) } : item,
  );
  writeCart(next);
}

export function removeLocalCartItem(productId: string) {
  writeCart(readCart().filter((item) => item.product.id !== productId));
}

export function clearLocalCart() {
  writeCart([]);
}

export function useLocalCart() {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(readCart());
    refresh();
    setReady(true);
    window.addEventListener(CART_EVENT, refresh);
    window.addEventListener(LEGACY_CART_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_EVENT, refresh);
      window.removeEventListener(LEGACY_CART_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  return { items, count, ready };
}