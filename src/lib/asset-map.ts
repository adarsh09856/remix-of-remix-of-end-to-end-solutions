// Maps image_url strings stored in DB to bundled asset URLs.
import redRice from "@/assets/p-red-rice.jpg";
import honey from "@/assets/p-honey.jpg";
import greenTea from "@/assets/p-green-tea.jpg";
import chiliSauce from "@/assets/p-chili-sauce.jpg";
import shiitake from "@/assets/p-shiitake.jpg";
import buckwheat from "@/assets/p-buckwheat.jpg";
import driedChilies from "@/assets/p-dried-chilies.jpg";
import timur from "@/assets/p-timur.jpg";
import suja from "@/assets/p-suja.jpg";
import cordyceps from "@/assets/p-cordyceps.jpg";
import giftHamper from "@/assets/p-gift-hamper.jpg";
import millet from "@/assets/p-millet.jpg";
import mustardOil from "@/assets/p-mustard-oil.jpg";

import cGrains from "@/assets/c-grains.jpg";
import cHoney from "@/assets/c-honey.jpg";
import cSpices from "@/assets/c-spices.jpg";
import cDried from "@/assets/c-dried.jpg";
import cTea from "@/assets/c-tea.jpg";
import cWellness from "@/assets/c-wellness.jpg";
import cGifts from "@/assets/c-gifts.jpg";

const map: Record<string, string> = {
  "/src/assets/p-red-rice.jpg": redRice,
  "/src/assets/p-honey.jpg": honey,
  "/src/assets/p-green-tea.jpg": greenTea,
  "/src/assets/p-chili-sauce.jpg": chiliSauce,
  "/src/assets/p-shiitake.jpg": shiitake,
  "/src/assets/p-buckwheat.jpg": buckwheat,
  "/src/assets/p-dried-chilies.jpg": driedChilies,
  "/src/assets/p-timur.jpg": timur,
  "/src/assets/p-suja.jpg": suja,
  "/src/assets/p-cordyceps.jpg": cordyceps,
  "/src/assets/p-gift-hamper.jpg": giftHamper,
  "/src/assets/p-millet.jpg": millet,
  "/src/assets/p-mustard-oil.jpg": mustardOil,
  "/src/assets/c-grains.jpg": cGrains,
  "/src/assets/c-honey.jpg": cHoney,
  "/src/assets/c-spices.jpg": cSpices,
  "/src/assets/c-dried.jpg": cDried,
  "/src/assets/c-tea.jpg": cTea,
  "/src/assets/c-wellness.jpg": cWellness,
  "/src/assets/c-gifts.jpg": cGifts,
};

export const categoryAssetBySlug: Record<string, string> = {
  "grains-cereals": cGrains,
  "wild-honey": cHoney,
  "spices-condiments": cSpices,
  "dried-foods": cDried,
  "tea-beverages": cTea,
  "wellness": cWellness,
  "gift-hampers": cGifts,
  "handicrafts": cGifts,
  "organic-products": cGrains,
  "traditional-foods": cSpices,
  "wellness-herbal": cWellness,
  "gifts-souvenirs": cGifts,
  "c-grains": cGrains,
  "c-honey": cHoney,
  "c-spices": cSpices,
  "c-dried": cDried,
  "c-tea": cTea,
  "c-wellness": cWellness,
  "c-gifts": cGifts,
};

export function resolveCategoryAsset(slug?: string, url?: string | null): string {
  if (slug && categoryAssetBySlug[slug]) return categoryAssetBySlug[slug];
  if (url && map[url]) return map[url];
  if (url) {
    const filename = url.split("/").pop()?.replace(/\.[^.]+$/, "");
    if (filename && categoryAssetBySlug[filename]) return categoryAssetBySlug[filename];
  }
  return resolveAsset(url) || cGrains;
}

export function resolveAsset(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (url.startsWith("storage://products/")) {
    return `/api/public/product-image?path=${encodeURIComponent(url.replace("storage://products/", ""))}`;
  }
  if (url.includes("/__l5e/assets-v1/")) {
    const filename = url.split("/").pop();
    if (filename) return `/products/${filename}`;
  }
  return map[url] ?? url;
}
