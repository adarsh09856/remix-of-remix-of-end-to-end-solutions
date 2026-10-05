import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/account.functions";
import { Bell, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Takin Mart" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const fetchFn = useServerFn(listMyNotifications);
  const markAll = useServerFn(markAllNotificationsRead);
  const markOne = useServerFn(markNotificationRead);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-notifications"], queryFn: () => fetchFn() });

  const allMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-notifications"] }); qc.invalidateQueries({ queryKey: ["notif-count"] }); },
  });
  const oneMut = useMutation({
    mutationFn: (id: string) => markOne({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-notifications"] }); qc.invalidateQueries({ queryKey: ["notif-count"] }); },
  });

  const list = data ?? [];
  const unread = list.filter((n: any) => !n.read_at).length;

  return (
    <div className="container-page py-12 max-w-3xl">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-4xl">Notifications</h1>
        {unread > 0 && <button onClick={() => allMut.mutate()} className="text-sm text-primary hover:underline"><Check className="h-4 w-4 inline" /> Mark all read</button>}
      </div>
      <p className="text-muted-foreground mb-8"><Link to="/account" className="hover:text-primary">My Account</Link></p>

      {list.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Bell className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">You're all caught up.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((n: any) => {
            const inner = (
              <>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${n.read_at ? "bg-border" : "bg-gold"}`} />
                  <div className="flex-1">
                    <div className="font-medium">{n.title}</div>
                    {n.body && <div className="text-sm text-muted-foreground mt-0.5">{n.body}</div>}
                    <div className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <a href={n.link} onClick={() => !n.read_at && oneMut.mutate(n.id)} className={`block rounded-2xl border p-4 transition ${n.read_at ? "border-border bg-card" : "border-gold/40 bg-gold/5 hover:border-gold"}`}>{inner}</a>
                ) : (
                  <div className={`rounded-2xl border p-4 ${n.read_at ? "border-border bg-card" : "border-gold/40 bg-gold/5"}`}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
