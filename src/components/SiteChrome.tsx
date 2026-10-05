import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalCart } from "@/lib/local-cart";
import { CountrySelector } from "@/components/CountrySelector";
import logo from "@/assets/logo.png";

export function AnnouncementBar() {
  return (
    <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs">
      <div className="container-page flex items-center justify-between gap-3 py-2 sm:py-2.5">
        <span className="opacity-90 truncate">🌿 Authentic Bhutanese goodness, delivered</span>
        <span className="hidden sm:inline opacity-90 shrink-0">Free shipping on orders over Nu. 1,500</span>
      </div>
    </div>
  );
}


export function Header() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { count: cartCount } = useLocalCart();

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

  const nav = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About Bhutan" },
    { to: "/story", label: "Our Story" },
    { to: "/contact", label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <AnnouncementBar />
      <div className="container-page flex items-center justify-between gap-2 py-3 sm:py-4">
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink">
          <img src={logo} alt="" width={36} height={36} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0" />
          <div className="leading-tight min-w-0">
            <div className="font-display text-base sm:text-xl font-semibold tracking-tight text-primary whitespace-nowrap">
              Takin<span className="text-gold"> Mart</span>
            </div>
            <div className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">
              Authentic Bhutanese Agro
            </div>

          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-foreground/80 hover:text-primary transition-colors"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <CountrySelector compact />
          <a href="/shop" aria-label="Search" className="hidden sm:inline-flex p-2.5 rounded-full hover:bg-muted transition">
            <Search className="h-[18px] w-[18px]" />
          </a>
          <a
            href={userId ? "/account" : "/auth"}
            aria-label="Account"
            className="p-2 sm:p-2.5 rounded-full hover:bg-muted transition"
          >
            <User className="h-[18px] w-[18px]" />
          </a>
          <a href="/cart" aria-label="Cart" className="relative p-2 sm:p-2.5 rounded-full hover:bg-muted transition">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gold text-gold-foreground text-[10px] font-bold rounded-full h-5 w-5 grid place-items-center">
                {cartCount}
              </span>
            )}
          </a>
          <button
            className="lg:hidden p-2 sm:p-2.5 rounded-full hover:bg-muted"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container-page flex flex-col py-4 gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="py-2.5 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="container-page py-16 grid gap-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8 invert brightness-0" />
            <span className="font-display text-xl">Takin Mart</span>
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            Authentic agro-based products from the pristine Bhutanese Himalayas, sourced directly from the
            farmers who grow them.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider opacity-80">Quick Links</h4>
          <ul className="space-y-2.5 text-sm opacity-80">
            <li><Link to="/shop">Shop All</Link></li>
            <li><Link to="/about">About Bhutan</Link></li>
            <li><Link to="/story">Our Story</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider opacity-80">Customer Care</h4>
          <ul className="space-y-2.5 text-sm opacity-80">
            <li><Link to="/account">My Account</Link></li>
            <li><Link to="/orders">Order History</Link></li>
            <li><Link to="/faq">FAQs</Link></li>
            <li><Link to="/contact">Shipping & Returns</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider opacity-80">We Deliver To</h4>
          <ul className="space-y-2.5 text-sm opacity-80">
            <li>🇧🇹 Bhutan</li>
            <li>Thimphu, Paro, Punakha and beyond</li>
          </ul>
          <p className="text-xs opacity-60 mt-6">Support: +975 17 17 17 17</p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container-page py-5 text-xs opacity-70 flex flex-wrap justify-between gap-2">
          <span>© 2026 Takin Mart. All Rights Reserved.</span>
          <span>Made with care in the Himalayas</span>
        </div>
      </div>
    </footer>
  );
}
