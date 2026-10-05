import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users2, MessageSquare, ListChecks, Activity,
  Package, FolderTree, Boxes, ShoppingBag, Users, Tag, Star,
  Settings as SettingsIcon, Store, Menu, X, ChevronRight, Search, LogOut,
} from "lucide-react";

export type AdminTab =
  | "overview" | "leads" | "enquiries" | "tasks" | "activity"
  | "products" | "categories" | "inventory"
  | "orders" | "customers" | "coupons" | "reviews" | "settings";

type NavItem = { key: AdminTab; label: string; icon: any; badge?: number };
type NavGroup = { title: string; items: NavItem[] };

export function adminNavGroups(counts: Partial<Record<AdminTab, number>> = {}): NavGroup[] {
  return [
    {
      title: "Overview",
      items: [{ key: "overview", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Relationships",
      items: [
        { key: "leads", label: "Leads", icon: Users2, badge: counts.leads },
        { key: "enquiries", label: "Enquiries", icon: MessageSquare, badge: counts.enquiries },
        { key: "tasks", label: "Tasks", icon: ListChecks, badge: counts.tasks },
        { key: "activity", label: "Activity log", icon: Activity },
      ],
    },
    {
      title: "Catalog",
      items: [
        { key: "products", label: "Products", icon: Package },
        { key: "categories", label: "Categories", icon: FolderTree },
        { key: "inventory", label: "Inventory", icon: Boxes },
      ],
    },
    {
      title: "Commerce",
      items: [
        { key: "orders", label: "Orders", icon: ShoppingBag },
        { key: "customers", label: "Customers", icon: Users },
        { key: "coupons", label: "Coupons", icon: Tag },
        { key: "reviews", label: "Reviews", icon: Star },
      ],
    },
    {
      title: "System",
      items: [{ key: "settings", label: "Settings", icon: SettingsIcon }],
    },
  ];
}

export function AdminShell({
  tab, onTab, counts, children, title, subtitle,
}: {
  tab: AdminTab;
  onTab: (t: AdminTab) => void;
  counts?: Partial<Record<AdminTab, number>>;
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = adminNavGroups(counts);

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-gold-foreground font-display text-lg">T</div>
        <div className="leading-tight">
          <div className="font-display text-base">Takin Mart</div>
          <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">CRM Console</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-50">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => { onTab(item.key); setMobileOpen(false); }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-gold text-gold-foreground font-semibold shadow-soft"
                        : "opacity-80 hover:opacity-100 hover:bg-primary-foreground/10"
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge ? (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-gold-foreground/15" : "bg-primary-foreground/15"}`}>
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition ${active ? "opacity-70" : "opacity-0 group-hover:opacity-50"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 pb-5 space-y-2">
        <Link to="/pos" className="flex items-center gap-2 rounded-xl bg-primary-foreground/10 px-3 py-2.5 text-sm hover:bg-primary-foreground/20 transition">
          <Store className="h-4 w-4" /> Open POS register
        </Link>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("takinmart_admin_session");
              window.location.reload();
            }
          }}
          className="flex w-full items-center gap-2 rounded-xl bg-primary-foreground/5 text-primary-foreground/80 px-3 py-2.5 text-sm hover:bg-destructive/80 hover:text-white transition text-left"
        >
          <LogOut className="h-4 w-4" /> Lock &amp; Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[70vh] bg-secondary/40">
      <div className="flex">
        {/* desktop sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-primary text-primary-foreground sticky top-0 max-h-screen">
          {SidebarBody}
        </aside>

        {/* mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button aria-label="Close menu" className="absolute inset-0 bg-foreground/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-primary text-primary-foreground shadow-hover">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-full p-2 hover:bg-primary-foreground/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              {SidebarBody}
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button
                className="lg:hidden rounded-xl border border-border p-2"
                onClick={() => setMobileOpen(true)}
                aria-label="Open admin menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl sm:text-2xl truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary transition"
                >
                  <Search className="h-4 w-4" /> Visit store
                </Link>
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("takinmart_admin_session");
                      window.location.reload();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition"
                  title="Sign out of Admin Console"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Sign out</span>
                </button>
              </div>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function StatTile({
  label, value, hint, icon: Icon, tone = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: any;
  tone?: "primary" | "gold" | "accent" | "danger" | "muted";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    gold: "bg-gold text-gold-foreground",
    accent: "bg-accent text-accent-foreground",
    danger: "bg-destructive text-destructive-foreground",
    muted: "bg-card text-foreground border border-border",
  };
  return (
    <div className={`rounded-2xl p-5 shadow-card ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.14em] opacity-75">{label}</div>
          <div className="font-display text-2xl sm:text-3xl mt-1.5 truncate">{value}</div>
          {hint && <div className="text-xs opacity-75 mt-1">{hint}</div>}
        </div>
        <Icon className="h-5 w-5 opacity-80 shrink-0" />
      </div>
    </div>
  );
}
