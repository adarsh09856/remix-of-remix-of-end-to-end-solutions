import { useState, useEffect } from "react";
import { X, Copy, Check, MessageCircle, Sparkles, Mail, ShieldCheck, ShoppingBag, Globe } from "lucide-react";
import promoBanner from "@/assets/promo-banner.png";
import { toast } from "sonner";

const STORAGE_KEY = "takinmart_promo_popup_dismissed_v2";
const PROMO_CODE = "WSUKSU26";

interface PromoPopupModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PromoPopupModal({ isOpen: controlledIsOpen, onClose }: PromoPopupModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    // Listen for custom trigger events from any header, banner, or footer link
    const handleOpenEvent = () => {
      setInternalIsOpen(true);
    };
    window.addEventListener("takinmart:open-promo", handleOpenEvent);
    window.addEventListener("gth:open-promo", handleOpenEvent);
    return () => {
      window.removeEventListener("takinmart:open-promo", handleOpenEvent);
      window.removeEventListener("gth:open-promo", handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (isControlled) return;

    // Check if dismissed recently (within 24 hours)
    try {
      const dismissedUntil = localStorage.getItem(STORAGE_KEY);
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        return;
      }
    } catch {
      // ignore localStorage errors
    }

    // Delay popup slightly for smooth first impression
    const timer = setTimeout(() => {
      setInternalIsOpen(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isControlled]);

  const handleClose = () => {
    if (isControlled) {
      onClose?.();
    } else {
      setInternalIsOpen(false);
    }

    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      } catch {
        // ignore
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    toast.success("Promo Code Copied!", {
      description: `Use '${PROMO_CODE}' during checkout for exclusive discounts.`,
    });
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dontShowAgain, isControlled]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-card border border-primary/40 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 cursor-default"
        role="dialog"
        aria-modal="true"
        aria-label="Takin Mart Himalayan Harvest - Tshechu Offers"
      >
        {/* Floating Close Button (X) */}
        <button
          onClick={handleClose}
          aria-label="Close promotional flyer"
          className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-black/70 text-white hover:bg-black/95 hover:scale-110 transition-all border border-white/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          {/* Main Visual Banner (Takin Mart Himalayan Harvest Tshechu Offers) */}
          <div className="relative w-full bg-slate-950 overflow-hidden">
            <img
              src={promoBanner}
              alt="Takin Mart — Himalayan Harvest Tshechu Offers (Herbal, Agro, Farming, Handicrafts)"
              className="w-full h-auto object-cover max-h-[500px]"
            />
          </div>

          {/* Quick Action Bar under Banner */}
          <div className="p-4 sm:p-6 bg-gradient-to-b from-card via-card to-muted/40 border-t border-border/80">
            {/* Promo Code Highlight */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-gold/15 border border-gold/40">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <Sparkles className="w-5 h-5 text-gold shrink-0" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Himalayan Harvest · Tshechu Special Offer
                  </div>
                  <div className="text-sm sm:text-base font-bold text-foreground">
                    Use Promo Code: <span className="text-gold font-mono tracking-wider font-extrabold">{PROMO_CODE}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-slate-950 text-xs sm:text-sm font-bold shadow-md hover:bg-gold/90 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied to Clipboard!" : "Copy Code"}
              </button>
            </div>

            {/* Authentic Categories Banner */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 font-medium">
                🏺 Handicrafts
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 font-medium">
                🌿 Organic Products
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 font-medium">
                🍲 Traditional Foods
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 font-medium">
                🪷 Wellness & Herbal
              </div>
              <div className="p-2 rounded-lg bg-primary/5 border border-primary/15 font-medium col-span-2 sm:col-span-1">
                🎁 Gifts & Souvenirs
              </div>
            </div>

            {/* Direct Contact Helplines */}
            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3 text-center sm:text-left">
                Direct Global Order & Logistics Desks
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                {/* Bhutan HQ */}
                <a
                  href="tel:+97517970050"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/80 bg-background hover:border-primary/50 hover:bg-muted transition-colors"
                >
                  <span className="text-base">🇧🇹</span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">Bhutan HQ</div>
                    <div className="text-muted-foreground font-mono">+975-1797-0050</div>
                  </div>
                </a>

                {/* WhatsApp 24/7 */}
                <a
                  href="https://wa.me/918514889385?text=Hello%20Takin%20Mart,%20I%20have%20an%20inquiry%20regarding%20the%20Tshechu%20Offers%20(code%20WSUKSU26)."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500/60 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">WhatsApp 24/7</div>
                    <div className="text-muted-foreground font-mono">+91-8514889385</div>
                  </div>
                </a>

                {/* UK - London */}
                <a
                  href="tel:+447586203728"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/80 bg-background hover:border-primary/50 hover:bg-muted transition-colors"
                >
                  <span className="text-base">🇬🇧</span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">UK - London Desk</div>
                    <div className="text-muted-foreground font-mono">+44-7586203728</div>
                  </div>
                </a>

                {/* Australia */}
                <a
                  href="tel:+61404343370"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/80 bg-background hover:border-primary/50 hover:bg-muted transition-colors"
                >
                  <span className="text-base">🇦🇺</span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">Australia Desk</div>
                    <div className="text-muted-foreground font-mono">+61-404-343-370</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Departmental Email Inboxes */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Official Departmental Inboxes (@takinmart.bt)
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {["info", "office", "gm", "ceo", "bdm", "support"].map((prefix) => (
                  <a
                    key={prefix}
                    href={`mailto:${prefix}@takinmart.bt`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-primary hover:text-primary-foreground transition-colors font-mono text-[11px]"
                  >
                    <Mail className="w-3 h-3 opacity-70" />
                    {prefix}@takinmart.bt
                  </a>
                ))}
              </div>
            </div>

            {/* Footer dismissal */}
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Don't show this offer popup for the next 24 hours</span>
              </label>

              <button
                onClick={handleClose}
                className="text-primary hover:underline font-semibold"
              >
                Shop Tshechu Offers →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
