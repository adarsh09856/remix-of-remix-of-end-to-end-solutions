import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function AuthenticatedPending() {
  return (
    <div className="container-page py-16">
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
        <div className="h-64 w-full rounded-xl bg-muted/70" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingMs: 500,
  pendingMinMs: 0,
  pendingComponent: AuthenticatedPending,
  beforeLoad: async ({ location }) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user && !location.pathname.startsWith("/admin")) {
        throw redirect({ to: "/auth", search: { redirect: location.href } });
      }
      return { user: data?.session?.user ?? null };
    } catch (e) {
      if ((e as any)?.to || (e as any)?.href) throw e;
      if (location.pathname.startsWith("/admin")) {
        return { user: null };
      }
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
