import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Star,
  Home as HomeIcon,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalCart, addLocalCartItem } from "@/lib/local-cart";
import { CountrySelector } from "@/components/CountrySelector";
import { CartDrawer } from "@/components/CartDrawer";
import logo from "@/assets/logo.png";
import { toast } from "sonner";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "@/lib/products.functions";
import { resolveAsset, resolveCategoryAsset } from "@/lib/asset-map";
import { formatINR } from "@/lib/format";

// ============================================================================
// 1. ANNOUNCEMENT BAR (Exactly 36px forest, rotating single line)
// ============================================================================
const ANNOUNCEMENTS = [
  {
    type: "festival",
    text: "Himalayan Harvest Festival: free delivery across 20 Dzongkhags over Nu. 1,500",
    action: null,
  },
  {
    type: "coupon",
    text: "Code TSHECHU20 for 20% off",
    action: "copy",
  },
  {
    type: "care",
    text: "Care: +975 17 17 17 17 (WhatsApp)",
    action: "whatsapp",
    url: "https://wa.me/97517171717",
  },
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = ANNOUNCEMENTS[index];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("TSHECHU20");
      setCopied(true);
      toast.success("Coupon code TSHECHU20 copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <aside
      aria-label="Store announcement"
      className="h-[36px] bg-[#1F3D2B] text-[#FAF6EE] text-[11px] sm:text-xs font-medium tracking-wide flex items-center justify-center px-4 overflow-hidden select-none border-b border-[#2C523B]"
    >
      <div
        key={index}
        className="flex items-center justify-center gap-2 animate-fade-in transition-all duration-300 max-w-4xl text-center"
      >
        <span className="truncate">{current.text}</span>

        {current.action === "copy" && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C98A1B] text-[#1F3D2B] font-bold text-[10px] tracking-wider uppercase hover:bg-[#D99A2B] transition-colors cursor-pointer shrink-0"
            title="Click to copy TSHECHU20"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}

        {current.action === "whatsapp" && (
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="text-[#C98A1B] underline hover:text-[#FAF6EE] transition-colors shrink-0 font-semibold"
          >
            Chat
          </a>
        )}
      </div>
    </aside>
  );
}

// ============================================================================
// 2. SEARCH OVERLAY (Full-width with popular chips and instant live results)
// ============================================================================
const POPULAR_SEARCH_CHIPS = [
  "Shilajit",
  "Wild Honey",
  "Cordyceps Tea",
  "Red Rice",
  "Dalle Pickle",
];

function SearchOverlay({
  isOpen,
  onClose,
  onOpenCart,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FALLBACK_PRODUCTS.slice(0, 4); // show 4 featured items initially
    return FALLBACK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.categories?.name.toLowerCase().includes(q) ||
        p.artisan_name?.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product Search"
      className="fixed inset-0 z-50 bg-[#3A2A20]/50 backdrop-blur-md flex flex-col animate-fade-in"
    >
      <div className="bg-[#FAF6EE] border-b border-[#EADFCB] shadow-lg max-h-[90vh] flex flex-col">
        {/* Search header input row */}
        <div className="container-page py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#3A2A20]/50" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search wild honey, pure Shilajit, red rice, herbal tea, pickles..."
                className="w-full pl-12 pr-10 py-3.5 rounded-full bg-[#FAF6EE] border border-[#EADFCB] text-[#3A2A20] placeholder:text-[#3A2A20]/45 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent transition shadow-inner"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#3A2A20]/50 hover:text-[#3A2A20]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full border border-[#EADFCB] text-[#3A2A20] hover:bg-[#F0E8D8] transition shrink-0"
              aria-label="Close search overlay"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Popular search chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#3A2A20]/60 font-medium">Popular:</span>
            {POPULAR_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setQuery(chip)}
                className={`px-3 py-1 rounded-full border transition cursor-pointer text-xs ${
                  query.toLowerCase() === chip.toLowerCase()
                    ? "bg-[#1F3D2B] text-[#FAF6EE] border-[#1F3D2B]"
                    : "bg-[#F0E8D8]/60 text-[#3A2A20] border-[#EADFCB] hover:border-[#1F3D2B] hover:bg-[#FAF6EE]"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search Results */}
        <div className="overflow-y-auto px-4 py-6 border-t border-[#EADFCB]/70 flex-1">
          <div className="container-page">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-wider text-[#3A2A20]/70 font-semibold font-sans">
                {query.trim()
                  ? `Found ${filteredProducts.length} Himalayan treasures`
                  : "Trending Himalayan Harvests"}
              </h3>
              {query.trim() && (
                <Link
                  to="/shop"
                  search={{ q: query.trim() } as any}
                  onClick={onClose}
                  className="text-xs text-[#1F3D2B] font-semibold hover:underline inline-flex items-center gap-1"
                >
                  View in full catalog <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-[#3A2A20]/70">
                <p className="text-base font-serif text-[#3A2A20]">
                  No harvest found matching &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs mt-1 text-[#3A2A20]/60">
                  Try searching for Shilajit, wild honey, Dalle pickle, or cordyceps.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => {
                  const img = resolveAsset(p.image_url);
                  return (
                    <div
                      key={p.id}
                      className="group flex flex-col justify-between rounded-2xl p-3 bg-[#FAF6EE] border border-[#EADFCB] hover:border-[#1F3D2B]/40 hover:shadow-md transition"
                    >
                      <Link
                        to={`/product/${p.slug}` as any}
                        onClick={onClose}
                        className="block overflow-hidden rounded-xl bg-[#F0E8D8]/70 aspect-square relative mb-3"
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={p.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-[#3A2A20]/50">
                            Harvest Photo
                          </div>
                        )}
                        {p.badge && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1F3D2B] text-[#FAF6EE]">
                            {p.badge}
                          </span>
                        )}
                      </Link>

                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#C98A1B] mb-1">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="font-semibold">{p.rating_avg.toFixed(1)}</span>
                          <span className="text-[#3A2A20]/50 font-normal">
                            ({p.rating_count})
                          </span>
                        </div>
                        <Link
                          to={`/product/${p.slug}` as any}
                          onClick={onClose}
                          className="font-serif text-sm font-semibold text-[#1F3D2B] line-clamp-1 group-hover:text-[#C98A1B] transition"
                        >
                          {p.name}
                        </Link>
                        <p className="text-[11px] text-[#3A2A20]/65 line-clamp-1 mt-0.5">
                          {p.tagline || p.unit}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#EADFCB]/60 flex items-center justify-between">
                        <span className="font-serif text-sm font-bold text-[#1F3D2B] tnum">
                          Nu. {formatINR(p.price_inr)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            addLocalCartItem(
                              {
                                id: p.id,
                                name: p.name,
                                slug: p.slug,
                                price_inr: p.price_inr,
                                unit: p.unit,
                                image_url: p.image_url,
                              },
                              1
                            );
                            toast.success(`${p.name} added to cart`);
                            onClose();
                            onOpenCart();
                          }}
                          className="px-2.5 py-1 rounded-full bg-[#1F3D2B] text-[#FAF6EE] text-[11px] font-medium hover:bg-[#2C523B] transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}

// ============================================================================
// 3. SHOP MEGA MENU (7 Categories as image tiles + Featured Product)
// ============================================================================
function ShopMegaMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 right-0 z-50 bg-[#FAF6EE] border-b border-[#EADFCB] shadow-2xl py-8 animate-fade-in"
    >
      <div className="container-page">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Categories Grid (Col 9) */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#C98A1B] font-semibold">
                  Kingdom Catalog
                </p>
                <h3 className="font-serif text-xl font-light text-[#1F3D2B]">
                  Shop by <span className="italic font-normal text-[#C98A1B]">category</span>
                </h3>
              </div>
              <Link
                to="/shop"
                onClick={onClose}
                className="text-xs font-semibold text-[#1F3D2B] hover:text-[#C98A1B] inline-flex items-center gap-1 group transition"
              >
                Browse all 19 items
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {FALLBACK_CATEGORIES.map((cat) => {
                const img = resolveCategoryAsset(cat.slug, cat.image_url);
                return (
                  <Link
                    key={cat.id}
                    to="/shop"
                    search={{ category: cat.slug } as any}
                    onClick={onClose}
                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-[#F0E8D8]/50 border border-[#EADFCB] p-2.5 hover:border-[#1F3D2B]/40 hover:bg-[#FAF6EE] hover:shadow-md transition"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#FAF6EE] mb-2.5">
                      {img ? (
                        <img
                          src={img}
                          alt={cat.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs">
                          {cat.name}
                        </div>
                      )}
                    </div>
                    <span className="font-serif text-xs sm:text-sm font-semibold text-[#1F3D2B] group-hover:text-[#C98A1B] transition truncate">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-[#3A2A20]/60 line-clamp-1 mt-0.5">
                      {cat.description.split(",")[0]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Featured Highlight Card (Col 4) */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 bg-[#F0E8D8] rounded-2xl border border-[#EADFCB] p-5 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1F3D2B] text-[#FAF6EE] text-[10px] font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="h-3 w-3 text-[#C98A1B]" />
                <span>Featured Treasure</span>
              </div>
              <h4 className="font-serif text-lg font-medium text-[#1F3D2B] leading-snug">
                Jinlab Cordyceps Honey
              </h4>
              <p className="text-xs text-[#3A2A20]/75 mt-1 leading-relaxed">
                Raw high-altitude Bumthang forest honey infused with certified wild Himalayan Cordyceps sinensis.
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-base font-bold text-[#1F3D2B] tnum">
                  Nu. 1,490
                </span>
                <span className="text-xs text-[#3A2A20]/60">/ 250g jar</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#EADFCB] flex items-center justify-between">
              <span className="text-[11px] text-[#3A2A20]/70 font-medium">
                Sourced from Bumthang
              </span>
              <Link
                to="/product/jinlab-cordyceps-honey"
                onClick={onClose}
                className="px-3 py-1.5 rounded-full bg-[#1F3D2B] text-[#FAF6EE] text-xs font-semibold hover:bg-[#2C523B] transition"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. HEADER (Clean, one row, 72px, Frosted cream on scroll)
// ============================================================================
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { count: cartCount } = useLocalCart();

  // Scroll listener for frosted glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Supabase Auth listener
  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) setUserId(data.session?.user.id ?? null);
      })
      .catch(() => {
        if (mounted) setUserId(null);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUserId(session?.user.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { to: "/", label: "Home", exact: true },
    { to: "/shop", label: "Shop", isMega: true },
    { to: "/about", label: "About Bhutan" },
    { to: "/story", label: "Our Story" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* 1. Exactly 36px forest announcement bar */}
        <AnnouncementBar />

        {/* 2. Exactly 72px main navbar row */}
        <div
          className={`h-[72px] transition-colors duration-300 border-b ${
            scrolled
              ? "bg-[#FAF6EE]/95 backdrop-blur-md border-[#EADFCB] shadow-sm"
              : "bg-[#FAF6EE] border-[#EADFCB]"
          }`}
        >
          <div className="container-page h-full flex items-center justify-between gap-4">
            {/* Logo Left */}
            <Link
              to="/"
              className="flex items-center gap-2.5 min-w-0 shrink group select-none"
              aria-label="Takin Mart Home"
            >
              <img
                src={logo}
                alt="Takin Mart Emblem"
                width={40}
                height={40}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-transform duration-300 group-hover:scale-105"
              />
              <div className="leading-tight">
                <span className="font-serif text-lg sm:text-xl font-normal tracking-tight text-[#1F3D2B] block">
                  Takin <span className="italic text-[#C98A1B]">Mart</span>
                </span>
                <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.22em] text-[#3A2A20]/65 font-medium">
                  Bhutan Agro-Wellness
                </span>
              </div>
            </Link>

            {/* Centered Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#3A2A20]/80">
              {navLinks.map((item) =>
                item.isMega ? (
                  <div
                    key={item.to}
                    className="relative"
                    onMouseEnter={() => setMegaMenuOpen(true)}
                  >
                    <Link
                      to={item.to}
                      className="inline-flex items-center gap-1 hover:text-[#1F3D2B] transition py-2"
                      activeProps={{ className: "text-[#1F3D2B] font-semibold" }}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          megaMenuOpen ? "rotate-180 text-[#C98A1B]" : "text-[#3A2A20]/50"
                        }`}
                      />
                    </Link>
                  </div>
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="hover:text-[#1F3D2B] transition py-2"
                    activeProps={{ className: "text-[#1F3D2B] font-semibold" }}
                    activeOptions={{ exact: Boolean(item.exact) }}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Currency Selector */}
              <CountrySelector compact />

              {/* Search Icon */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search Bhutanese Harvest"
                className="p-2 sm:p-2.5 rounded-full text-[#3A2A20]/80 hover:text-[#1F3D2B] hover:bg-[#F0E8D8] transition"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Account Icon */}
              <a
                href={userId ? "/account" : "/auth"}
                aria-label={userId ? "My Account" : "Sign In"}
                className="p-2 sm:p-2.5 rounded-full text-[#3A2A20]/80 hover:text-[#1F3D2B] hover:bg-[#F0E8D8] transition"
              >
                <User className="h-5 w-5" />
              </a>

              {/* Cart Drawer Trigger */}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                aria-label={`Open shopping cart with ${cartCount} items`}
                className="relative p-2 sm:p-2.5 rounded-full text-[#3A2A20]/80 hover:text-[#1F3D2B] hover:bg-[#F0E8D8] transition"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#C98A1B] text-[#1F3D2B] text-[10px] font-bold rounded-full h-5 w-5 grid place-items-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="lg:hidden p-2 rounded-full text-[#3A2A20] hover:bg-[#F0E8D8] transition"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <ShopMegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF6EE] border-b border-[#EADFCB] px-4 py-5 shadow-xl animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#3A2A20] hover:bg-[#F0E8D8] transition"
                  activeProps={{ className: "bg-[#F0E8D8] text-[#1F3D2B] font-semibold" }}
                  activeOptions={{ exact: Boolean(item.exact) }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 pt-4 border-t border-[#EADFCB] flex flex-col gap-2.5 text-xs text-[#3A2A20]/75">
              <a
                href="https://wa.me/97517171717"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[#1F3D2B] font-semibold"
              >
                <Phone className="h-4 w-4 text-[#C98A1B]" />
                WhatsApp Care: +975 17 17 17 17
              </a>
              <p className="text-[11px] text-[#3A2A20]/60">
                Pan-Bhutan express shipping across all 20 Dzongkhags.
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenCart={() => setCartDrawerOpen(true)}
      />

      {/* Slide-in Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      {/* Mobile Bottom Navigation Bar (Home, Shop, Search, Cart, Account) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#FAF6EE]/95 backdrop-blur-md border-t border-[#EADFCB] px-3 py-2 flex items-center justify-around text-[#3A2A20] pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <Link
          to="/"
          className="flex flex-col items-center gap-1 text-[10px] font-medium hover:text-[#1F3D2B] transition"
          activeProps={{ className: "text-[#1F3D2B] font-bold" }}
        >
          <HomeIcon className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          to="/shop"
          className="flex flex-col items-center gap-1 text-[10px] font-medium hover:text-[#1F3D2B] transition"
          activeProps={{ className: "text-[#1F3D2B] font-bold" }}
        >
          <Sparkles className="h-5 w-5" />
          <span>Shop</span>
        </Link>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-medium hover:text-[#1F3D2B] transition"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </button>

        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className="relative flex flex-col items-center gap-1 text-[10px] font-medium hover:text-[#1F3D2B] transition"
        >
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-[#C98A1B] text-[#1F3D2B] text-[9px] font-bold rounded-full h-4 w-4 grid place-items-center">
              {cartCount}
            </span>
          )}
          <span>Cart</span>
        </button>

        <a
          href={userId ? "/account" : "/auth"}
          className="flex flex-col items-center gap-1 text-[10px] font-medium hover:text-[#1F3D2B] transition"
        >
          <User className="h-5 w-5" />
          <span>{userId ? "Account" : "Sign In"}</span>
        </a>
      </nav>
    </>
  );
}

// ============================================================================
// 5. FOOTER (Forest #1F3D2B, 4 columns, Himalayan apothecary aesthetic)
// ============================================================================
export function Footer() {
  return (
    <footer className="mt-24 bg-[#1F3D2B] text-[#FAF6EE] pb-20 lg:pb-0">
      <div className="container-page py-16 grid gap-12 md:grid-cols-4">
        {/* Col 1: Brand */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <img
              src={logo}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full bg-[#FAF6EE] p-0.5"
            />
            <span className="font-serif text-xl text-[#FAF6EE] tracking-tight">
              Takin <span className="italic text-[#C98A1B]">Mart</span>
            </span>
          </div>
          <p className="text-xs text-[#FAF6EE]/75 leading-relaxed">
            Authentic agro-based products from the pristine Bhutanese Himalayas, sourced
            directly from the farmers who grow them.
          </p>
          <div className="mt-4 pt-3 border-t border-[#FAF6EE]/15">
            <span className="text-[11px] text-[#C98A1B] font-medium tracking-wide">
              100% Certified Bhutan Organic · Carbon-Negative Nation
            </span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="text-xs font-semibold mb-4 uppercase tracking-widest text-[#C98A1B]">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-xs text-[#FAF6EE]/75">
            <li>
              <Link to="/shop" className="hover:text-[#FAF6EE] transition">
                Shop All
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-[#FAF6EE] transition">
                About Bhutan
              </Link>
            </li>
            <li>
              <Link to="/story" className="hover:text-[#FAF6EE] transition">
                Our Story
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-[#FAF6EE] transition">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Customer Care */}
        <div>
          <h4 className="text-xs font-semibold mb-4 uppercase tracking-widest text-[#C98A1B]">
            Customer Care
          </h4>
          <ul className="space-y-2 text-xs text-[#FAF6EE]/75">
            <li>
              <Link to="/account" className="hover:text-[#FAF6EE] transition">
                My Account
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-[#FAF6EE] transition">
                Order History
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-[#FAF6EE] transition">
                FAQs
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-[#FAF6EE] transition">
                Shipping & Returns
              </Link>
            </li>
            <li className="pt-2">
              <a
                href="mailto:support@takinmart.bt"
                className="text-xs hover:underline flex items-center gap-1 text-[#C98A1B]"
              >
                ✉ support@takinmart.bt
              </a>
            </li>
            <li>
              <a
                href="mailto:info@takinmart.bt"
                className="text-xs hover:underline flex items-center gap-1 text-[#C98A1B]"
              >
                ✉ info@takinmart.bt
              </a>
            </li>
          </ul>
        </div>

        {/* Col 4: Corporate Inquiries */}
        <div>
          <h4 className="text-xs font-semibold mb-4 uppercase tracking-widest text-[#C98A1B]">
            Corporate Inquiries
          </h4>
          <ul className="space-y-1.5 text-xs text-[#FAF6EE]/75">
            <li>
              Wholesale:{" "}
              <a href="mailto:bdm@takinmart.bt" className="text-[#C98A1B] hover:underline">
                bdm@takinmart.bt
              </a>
            </li>
            <li>
              Dispatch:{" "}
              <a href="mailto:office@takinmart.bt" className="text-[#C98A1B] hover:underline">
                office@takinmart.bt
              </a>
            </li>
            <li>
              GM:{" "}
              <a href="mailto:gm@takinmart.bt" className="text-[#C98A1B] hover:underline">
                gm@takinmart.bt
              </a>
            </li>
            <li>
              CEO:{" "}
              <a href="mailto:ceo@takinmart.bt" className="text-[#C98A1B] hover:underline">
                ceo@takinmart.bt
              </a>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-[#FAF6EE]/15 text-xs text-[#FAF6EE]/85 space-y-1">
            <p>
              Hotline:{" "}
              <a href="tel:+97517171717" className="font-semibold text-[#FAF6EE] hover:underline">
                +975 17 17 17 17
              </a>
            </p>
            <p>
              HQ Desk:{" "}
              <a href="tel:+97517970050" className="font-semibold text-[#FAF6EE] hover:underline">
                +975-1797-0050
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#FAF6EE]/15">
        <div className="container-page py-5 text-xs text-[#FAF6EE]/65 flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 Takin Mart. All Rights Reserved. · Made with care in the Himalayas</span>
          <a
            href="https://goldentakinholidays.bt"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#C98A1B] hover:text-[#FAF6EE] transition font-medium"
          >
            Visit Golden Takin Holidays <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
