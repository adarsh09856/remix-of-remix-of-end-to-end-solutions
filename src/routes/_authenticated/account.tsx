import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAccountDashboard } from "@/lib/account.functions";
import { Package, User as UserIcon, MapPin, Heart, Star, Bell, LogOut, Shield, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Takin Mart" }] }),
  component: AccountPage,
});

function AccountPage() {
  const fetchDashboard = useServerFn(getAccountDashboard);
  const { data: dashboard } = useQuery({
    queryKey: ["account-dashboard"],
    queryFn: () => fetchDashboard(),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = dashboard?.profile;
  const admin = dashboard?.admin ?? false;
  const orders = dashboard?.orders ?? [];
  const addrs = dashboard?.addresses ?? [];
  const wish = dashboard?.wishlist ?? [];
  const notifs = dashboard?.notifications ?? [];
  const email = dashboard?.email ?? "";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const totalSpent = (orders ?? []).filter((o: any) => o.status === "paid" || o.status === "fulfilled" || o.status === "delivered")
    .reduce((s: number, o: any) => s + Number(o.total_inr), 0);
  const unread = (notifs ?? []).filter((n: any) => !n.read_at).length;

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-4xl">My Account</h1>
          <p className="text-muted-foreground mt-2">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Signed in as</div>
          <div className="font-medium">{email}</div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid sm:grid-cols-4 gap-3 mt-8">
        <Stat label="Orders" value={orders?.length ?? 0} />
        <Stat label="Total spent" value={`Nu. ${Math.round(totalSpent).toLocaleString("en-IN")}`} />
        <Stat label="Wishlist" value={wish?.length ?? 0} />
        <Stat label="Addresses" value={addrs?.length ?? 0} />
      </div>

      {/* Tiles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <Tile to="/orders" icon={Package} title="My Orders" desc={`${orders?.length ?? 0} order${(orders?.length ?? 0) === 1 ? "" : "s"} placed`} />
        <Tile to="/addresses" icon={MapPin} title="Addresses" desc={`${addrs?.length ?? 0} saved`} />
        <Tile to="/wishlist" icon={Heart} title="Wishlist" desc={`${wish?.length ?? 0} item${(wish?.length ?? 0) === 1 ? "" : "s"} saved`} />
        <Tile to="/notifications" icon={Bell} title="Notifications" desc={unread > 0 ? `${unread} unread` : "All caught up"} accent={unread > 0} />
        <Tile to="/my-reviews" icon={Star} title="My Reviews" desc="Reviews you've written" />
        <Tile to="/profile" icon={UserIcon} title="Profile & Security" desc="Name, phone, password" />
        <Tile to="/shop" icon={ShoppingBag} title="Shop more" desc="Discover Bhutanese goodness" />
        {admin && <Tile to="/admin" icon={Shield} title="Admin Panel" desc="Manage the storefront" />}
      </div>

      <button onClick={signOut} className="mt-10 inline-flex items-center gap-2 text-sm text-destructive hover:underline">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-2xl px-5 py-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl text-primary mt-1">{value}</div>
    </div>
  );
}

function Tile({ to, icon: Icon, title, desc, accent }: any) {
  return (
    <Link to={to} className={`bg-card border rounded-2xl p-6 hover:shadow-[var(--shadow-soft)] transition-all ${accent ? "border-gold" : "border-border hover:border-primary"}`}>
      <Icon className={`h-6 w-6 ${accent ? "text-gold-foreground" : "text-primary"}`} />
      <h3 className="font-display text-xl mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
