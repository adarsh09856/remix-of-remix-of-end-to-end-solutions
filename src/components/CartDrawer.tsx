import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Gift,
  Check,
  Truck,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import {
  useLocalCart,
  updateLocalCartItem,
  removeLocalCartItem,
  type LocalCartItem,
} from "@/lib/local-cart";
import defaultHoney from "@/assets/p-honey.jpg";
import { toast } from "sonner";

const FREE_SHIPPING_THRESHOLD = 1500;
const GIFT_WRAP_FEE = 150;

export function CartDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, count } = useLocalCart();
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Calculate items subtotal
  const subtotal = items.reduce((acc, item) => {
    const price = typeof item.product.price_inr === "number"
      ? item.product.price_inr
      : parseFloat(item.product.price_inr as string) || 0;
    return acc + price * item.quantity;
  }, 0);

  const discountAmount = promoApplied ? Math.round((subtotal * discountPercent) / 100) : 0;
  const giftWrapAmount = giftWrap ? GIFT_WRAP_FEE : 0;
  const deliveryFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 120;
  const grandTotal = Math.max(0, subtotal - discountAmount + giftWrapAmount + deliveryFee);

  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const applyPromo = () => {
    const cleaned = promoCode.trim().toUpperCase();
    if (cleaned === "TSHECHU20") {
      setDiscountPercent(20);
      setPromoApplied(true);
      toast.success("Coupon TSHECHU20 applied! 20% festival discount activated.");
    } else if (cleaned === "HARVEST10") {
      setDiscountPercent(10);
      setPromoApplied(true);
      toast.success("Coupon HARVEST10 applied! 10% discount activated.");
    } else {
      toast.error("Invalid coupon code. Try TSHECHU20.");
    }
  };

  const removePromo = () => {
    setPromoApplied(false);
    setDiscountPercent(0);
    setPromoCode("");
    toast.info("Coupon removed.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#3A2A20]/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF6EE] text-[#3A2A20] shadow-[0_20px_60px_rgba(31,61,43,0.18)] border-l border-[rgba(58,42,32,0.12)] flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-[rgba(58,42,32,0.12)] bg-[#FFFFFF] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F0E8D8] text-[#1F3D2B]">
                <ShoppingBag className="w-4 h-4 text-[#1F3D2B]" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#1F3D2B] leading-none">
                  Your Himalayan Basket
                </h3>
                <span className="text-xs text-[#736357]">
                  {count} {count === 1 ? "treasure" : "treasures"} selected
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#736357] hover:text-[#1F3D2B] hover:bg-[#F0E8D8]/60 transition cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Progress Bar */}
          <div className="bg-[#F0E8D8]/70 px-5 py-3 border-b border-[rgba(58,42,32,0.08)]">
            <div className="flex items-center justify-between text-xs font-medium text-[#1F3D2B] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#C98A1B]" />
                {amountNeededForFreeShipping > 0 ? (
                  <>
                    Add <strong className="font-mono text-[#C98A1B]">Nu. {amountNeededForFreeShipping.toLocaleString()}</strong> more for Free Pan-Bhutan Delivery
                  </>
                ) : (
                  <span className="text-[#1F3D2B] font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 inline" /> You qualify for FREE Delivery across all 20 Dzongkhags!
                  </span>
                )}
              </span>
              <span className="font-mono text-[11px] text-[#736357]">
                {Math.round(freeShippingProgress)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#FFFFFF] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C98A1B] to-[#1F3D2B] transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List / Empty State */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#F0E8D8] grid place-items-center text-[#C98A1B]">
                  <ShoppingBag className="w-8 h-8 stroke-1" />
                </div>
                <h4 className="font-serif text-xl font-medium text-[#1F3D2B]">
                  Your basket is waiting
                </h4>
                <p className="text-xs text-[#736357] max-w-xs mx-auto leading-relaxed">
                  Discover wild Bumthang honey, high-altitude Shilajit, and organic red rice harvested with care.
                </p>
                <div className="pt-2">
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1F3D2B] text-[#FAF6EE] px-6 py-2.5 text-xs font-semibold shadow-sm hover:opacity-95 transition"
                  >
                    <span>Browse Kingdom Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => {
                const itemPrice = typeof item.product.price_inr === "number"
                  ? item.product.price_inr
                  : parseFloat(item.product.price_inr as string) || 0;
                const itemTotal = itemPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="flex gap-3.5 rounded-2xl border border-[rgba(58,42,32,0.08)] bg-[#FFFFFF] p-3 shadow-sm hover:border-[rgba(58,42,32,0.18)] transition"
                  >
                    {/* Image */}
                    <div className="h-18 w-18 rounded-xl bg-[#FAF6EE] border border-[rgba(58,42,32,0.08)] overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={item.product.image_url || defaultHoney}
                        alt={item.product.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = defaultHoney;
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to="/product/$slug"
                            params={{ slug: item.product.slug }}
                            onClick={onClose}
                            className="font-serif text-xs sm:text-sm font-semibold text-[#1F3D2B] hover:text-[#C98A1B] transition-colors truncate"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeLocalCartItem(item.product.id)}
                            className="text-[#736357]/60 hover:text-[#B5523A] transition p-0.5"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-[#736357] mt-0.5">
                          {item.product.unit || "Single item"}
                        </div>
                      </div>

                      {/* Stepper & Price */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border border-[rgba(58,42,32,0.15)] bg-[#FAF6EE] p-0.5">
                          <button
                            type="button"
                            onClick={() => updateLocalCartItem(item.product.id, item.quantity - 1)}
                            className="h-5 w-5 grid place-items-center rounded-full hover:bg-[#F0E8D8] text-[#3A2A20] transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-mono font-bold text-[#1F3D2B]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLocalCartItem(item.product.id, item.quantity + 1)}
                            className="h-5 w-5 grid place-items-center rounded-full hover:bg-[#F0E8D8] text-[#3A2A20] transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-xs sm:text-sm font-bold text-[#1F3D2B]">
                            Nu. {itemTotal.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Gift Wrap Option */}
            {items.length > 0 && (
              <div className="rounded-2xl border border-[rgba(58,42,32,0.1)] bg-[#FFFFFF] p-3 text-xs flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                    className="h-4 w-4 rounded border-[#3A2A20]/30 text-[#1F3D2B] focus:ring-[#C98A1B]"
                  />
                  <div>
                    <div className="font-semibold text-[#1F3D2B] flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#C98A1B]" />
                      <span>Traditional Bhutanese Gift Wrap</span>
                    </div>
                    <div className="text-[10px] text-[#736357]">
                      Handwoven Yathra band &amp; parchment card
                    </div>
                  </div>
                </label>
                <span className="font-mono font-semibold text-[#1F3D2B] shrink-0 text-xs">
                  +Nu. 150
                </span>
              </div>
            )}

            {/* Order Notes Accordion */}
            {items.length > 0 && (
              <div className="rounded-2xl border border-[rgba(58,42,32,0.1)] bg-[#FFFFFF] p-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="w-full flex items-center justify-between font-medium text-[#1F3D2B] hover:text-[#C98A1B] transition"
                >
                  <span>{showNotes ? "− Hide Order Instructions" : "+ Add Gift Message or Delivery Notes"}</span>
                </button>
                {showNotes && (
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Please leave at front desk, or write gift note: 'Happy Tshechu from family'..."
                    rows={2}
                    className="mt-2 w-full rounded-xl border border-[rgba(58,42,32,0.12)] p-2 text-xs bg-[#FAF6EE] text-[#3A2A20] outline-none placeholder:text-[#736357]/60"
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[rgba(58,42,32,0.12)] bg-[#FFFFFF] space-y-3.5 shadow-lg">
              {/* Promo Code Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Coupon code (e.g. TSHECHU20)"
                    disabled={promoApplied}
                    className="w-full rounded-xl border border-[rgba(58,42,32,0.15)] bg-[#FAF6EE] px-3 py-2 text-xs font-mono uppercase text-[#1F3D2B] placeholder:normal-case placeholder:text-[#736357]/60 outline-none focus:border-[#C98A1B]"
                  />
                  {!promoApplied && (
                    <button
                      type="button"
                      onClick={() => setPromoCode("TSHECHU20")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#C98A1B] hover:underline"
                    >
                      TSHECHU20
                    </button>
                  )}
                </div>
                {promoApplied ? (
                  <button
                    type="button"
                    onClick={removePromo}
                    className="px-3 py-2 rounded-xl border border-[rgba(58,42,32,0.15)] text-xs text-[#B5523A] font-semibold hover:bg-rose-50 transition"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyPromo}
                    className="px-4 py-2 rounded-xl bg-[#F0E8D8] text-xs font-bold text-[#1F3D2B] hover:bg-[#C98A1B] hover:text-[#FAF6EE] transition"
                  >
                    Apply
                  </button>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[#736357] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#3A2A20]">Nu. {subtotal.toLocaleString()}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-[#B5523A] font-medium">
                    <span>Festival Coupon ({discountPercent}%)</span>
                    <span className="font-mono">−Nu. {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {giftWrap && (
                  <div className="flex justify-between text-[#1F3D2B]">
                    <span>Handmade Gift Wrap</span>
                    <span className="font-mono">+Nu. {GIFT_WRAP_FEE.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pan-Bhutan Delivery</span>
                  <span className="font-mono text-[#3A2A20]">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-semibold uppercase text-[10px]">Free</span>
                    ) : (
                      `Nu. ${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1F3D2B] pt-2 border-t border-[rgba(58,42,32,0.08)]">
                  <span>Estimated Total</span>
                  <span className="font-mono text-base text-[#1F3D2B]">
                    Nu. {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <Link
                  to="/checkout"
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-[#1F3D2B] text-[#FAF6EE] py-3.5 text-sm font-semibold shadow-md hover:bg-[#2D583E] transition"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Direct WhatsApp Quick Order */}
                <a
                  href={`https://wa.me/97517171717?text=${encodeURIComponent(
                    `Hi Takin Mart, I would like to order: ${items
                      .map((i) => `${i.quantity}x ${i.product.name}`)
                      .join(", ")}. Total: Nu. ${grandTotal}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 text-emerald-800 py-2.5 text-xs font-semibold hover:bg-emerald-100 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Order via WhatsApp Direct (+975 17 17 17 17)</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
