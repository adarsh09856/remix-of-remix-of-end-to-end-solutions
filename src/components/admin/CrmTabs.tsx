import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowRightLeft, Check, Mail, Phone } from "lucide-react";
import {
  crmListLeads, crmUpsertLead, crmSetLeadStatus, crmDeleteLead,
  crmListEnquiries, crmUpdateEnquiry, crmConvertEnquiryToLead, crmDeleteEnquiry,
  crmListTasks, crmUpsertTask, crmDeleteTask, crmListActivity,
} from "@/lib/crm.functions";
import { formatINR } from "@/lib/format";

const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;
const SOURCES = ["manual", "website", "whatsapp", "referral", "instagram", "walk-in", "enquiry"] as const;

function errMsg(e: unknown) { return e instanceof Error ? e.message : "Something went wrong"; }

function Pill({ children, tone = "muted" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    muted: "bg-secondary text-foreground",
    primary: "bg-primary text-primary-foreground",
    gold: "bg-gold text-gold-foreground",
    danger: "bg-destructive text-destructive-foreground",
    accent: "bg-accent text-accent-foreground",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tones[tone]}`}>{children}</span>;
}

const leadTone = (s: string) => ({ new: "gold", contacted: "accent", qualified: "primary", won: "primary", lost: "danger" } as any)[s] ?? "muted";

/* ---------------- LEADS ---------------- */
export function LeadsTab() {
  const qc = useQueryClient();
  const list = useServerFn(crmListLeads);
  const upsert = useServerFn(crmUpsertLead);
  const setStatus = useServerFn(crmSetLeadStatus);
  const del = useServerFn(crmDeleteLead);
  const { data = [], isLoading } = useQuery({ queryKey: ["crm-leads"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["crm-leads"] }); qc.invalidateQueries({ queryKey: ["crm-stats"] }); };

  const save = useMutation({
    mutationFn: (d: any) => upsert({ data: d }),
    onSuccess: () => { toast.success("Lead saved"); setEditing(null); refresh(); },
    onError: (e) => toast.error(errMsg(e)),
  });
  const move = useMutation({ mutationFn: (d: any) => setStatus({ data: d }), onSuccess: refresh, onError: (e) => toast.error(errMsg(e)) });
  const remove = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: () => { toast.success("Lead deleted"); refresh(); } });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {(["board", "list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-1.5 text-sm capitalize ${view === v ? "bg-primary text-primary-foreground" : ""}`}>{v}</button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={() => setEditing({ name: "", source: "manual", status: "new", value_inr: 0 })} className="btn-hero inline-flex items-center gap-2"><Plus className="h-4 w-4" /> New lead</button>
      </div>

      {isLoading ? <div className="h-40 rounded-2xl bg-card border border-border animate-pulse" /> : view === "board" ? (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {LEAD_STATUSES.map((s) => {
            const items = (data as any[]).filter((l) => l.status === s);
            return (
              <div key={s} className="rounded-2xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Pill tone={leadTone(s)}>{s}</Pill>
                  <span className="text-xs text-muted-foreground">{items.length} · {formatINR(items.reduce((a, l) => a + Number(l.value_inr || 0), 0))}</span>
                </div>
                <div className="space-y-2">
                  {items.map((l) => (
                    <div key={l.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => setEditing(l)} className="text-left font-semibold text-sm hover:underline">{l.name}</button>
                        <span className="text-xs font-semibold">{formatINR(Number(l.value_inr || 0))}</span>
                      </div>
                      {l.company && <div className="text-xs text-muted-foreground">{l.company}</div>}
                      <div className="mt-1 text-[11px] text-muted-foreground capitalize">{l.source}</div>
                      <select value={l.status} onChange={(e) => move.mutate({ id: l.id, status: e.target.value })} className="mt-2 w-full rounded-lg border border-border bg-card px-2 py-1 text-xs capitalize">
                        {LEAD_STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </div>
                  ))}
                  {items.length === 0 && <div className="py-4 text-center text-xs text-muted-foreground">No leads</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Source</th><th className="p-3">Status</th><th className="p-3">Value</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {(data as any[]).map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-3 font-medium">{l.name}<div className="text-xs text-muted-foreground">{l.company}</div></td>
                  <td className="p-3 text-xs">{l.email}<div>{l.phone}</div></td>
                  <td className="p-3 capitalize">{l.source}</td>
                  <td className="p-3"><Pill tone={leadTone(l.status)}>{l.status}</Pill></td>
                  <td className="p-3">{formatINR(Number(l.value_inr || 0))}</td>
                  <td className="p-3 whitespace-nowrap text-right">
                    <button onClick={() => setEditing(l)} className="p-2 hover:bg-secondary rounded-lg" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => confirm("Delete this lead?") && remove.mutate(l.id)} className="p-2 hover:bg-secondary rounded-lg text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No leads yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? "Edit lead" : "New lead"} onClose={() => setEditing(null)}>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate({ ...editing, value_inr: Number(editing.value_inr || 0) }); }} className="grid gap-3 sm:grid-cols-2">
            <input className={input} required placeholder="Name" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <input className={input} placeholder="Company" value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
            <input className={input} placeholder="Email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            <input className={input} placeholder="Phone" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            <select className={input} value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            <select className={input} value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            <input className={input} type="number" min={0} placeholder="Deal value" value={editing.value_inr ?? 0} onChange={(e) => setEditing({ ...editing, value_inr: e.target.value })} />
            <textarea className={`${input} sm:col-span-2`} rows={4} placeholder="Notes" value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            <div className="sm:col-span-2 flex justify-between gap-2">
              {editing.id ? <button type="button" onClick={() => { if (confirm("Delete this lead?")) { remove.mutate(editing.id); setEditing(null); } }} className="text-sm text-destructive">Delete</button> : <span />}
              <button className="btn-hero" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save lead"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- ENQUIRIES ---------------- */
export function EnquiriesTab() {
  const qc = useQueryClient();
  const list = useServerFn(crmListEnquiries);
  const update = useServerFn(crmUpdateEnquiry);
  const convert = useServerFn(crmConvertEnquiryToLead);
  const del = useServerFn(crmDeleteEnquiry);
  const { data = [], isLoading } = useQuery({ queryKey: ["crm-enquiries"], queryFn: () => list() });
  const [filter, setFilter] = useState("open");
  const [replyFor, setReplyFor] = useState<Record<string, string>>({});
  const refresh = () => ["crm-enquiries", "crm-leads", "crm-stats"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const upd = useMutation({ mutationFn: (d: any) => update({ data: d }), onSuccess: () => { toast.success("Enquiry updated"); refresh(); }, onError: (e) => toast.error(errMsg(e)) });
  const conv = useMutation({ mutationFn: (id: string) => convert({ data: { id } }), onSuccess: () => { toast.success("Converted to lead"); refresh(); }, onError: (e) => toast.error(errMsg(e)) });
  const rm = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: refresh });

  const rows = (data as any[]).filter((e) => filter === "all" || e.status === filter);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["open", "in_progress", "resolved", "spam", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1.5 text-sm capitalize ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>
            {f.replace("_", " ")} ({f === "all" ? data.length : (data as any[]).filter((e) => e.status === f).length})
          </button>
        ))}
      </div>
      {isLoading && <div className="h-32 rounded-2xl bg-card border border-border animate-pulse" />}
      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((e) => (
          <div key={e.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{e.name}</div>
                <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {e.email && <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1 hover:underline"><Mail className="h-3 w-3" />{e.email}</a>}
                  {e.phone && <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 hover:underline"><Phone className="h-3 w-3" />{e.phone}</a>}
                </div>
              </div>
              <Pill tone={e.status === "open" ? "gold" : e.status === "resolved" ? "primary" : e.status === "spam" ? "danger" : "accent"}>{e.status.replace("_", " ")}</Pill>
            </div>
            {e.subject && <div className="mt-3 text-sm font-medium">{e.subject}</div>}
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{e.message}</p>
            <div className="mt-1 text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
            <textarea className={`${input} mt-3`} rows={2} placeholder="Internal reply / note" value={replyFor[e.id] ?? e.reply ?? ""} onChange={(ev) => setReplyFor({ ...replyFor, [e.id]: ev.target.value })} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => upd.mutate({ id: e.id, reply: replyFor[e.id] ?? e.reply ?? null, status: "resolved" })} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground"><Check className="h-3 w-3" /> Save & resolve</button>
              <button onClick={() => upd.mutate({ id: e.id, status: "in_progress" })} className="rounded-lg border border-border px-3 py-1.5 text-xs">In progress</button>
              <button onClick={() => conv.mutate(e.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs"><ArrowRightLeft className="h-3 w-3" /> Convert to lead</button>
              <button onClick={() => upd.mutate({ id: e.id, status: "spam" })} className="rounded-lg border border-border px-3 py-1.5 text-xs">Spam</button>
              <button onClick={() => confirm("Delete enquiry?") && rm.mutate(e.id)} className="ml-auto rounded-lg p-1.5 text-destructive hover:bg-secondary" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {!isLoading && rows.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No enquiries here. Messages from the Contact page appear automatically.</div>}
    </div>
  );
}

/* ---------------- TASKS ---------------- */
export function TasksTab() {
  const qc = useQueryClient();
  const list = useServerFn(crmListTasks);
  const upsert = useServerFn(crmUpsertTask);
  const del = useServerFn(crmDeleteTask);
  const { data = [] } = useQuery({ queryKey: ["crm-tasks"], queryFn: () => list() });
  const [draft, setDraft] = useState({ title: "", due_date: "", priority: "normal" });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["crm-tasks"] }); qc.invalidateQueries({ queryKey: ["crm-stats"] }); };
  const save = useMutation({ mutationFn: (d: any) => upsert({ data: d }), onSuccess: refresh, onError: (e) => toast.error(errMsg(e)) });
  const rm = useMutation({ mutationFn: (id: string) => del({ data: { id } }), onSuccess: refresh });
  const today = new Date().toISOString().slice(0, 10);
  const prTone = (p: string) => ({ urgent: "danger", high: "gold", normal: "muted", low: "muted" } as any)[p];

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); if (!draft.title.trim()) return; save.mutate({ ...draft, status: "open" }); setDraft({ title: "", due_date: "", priority: "normal" }); }} className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <input className={input} placeholder="Add a task… e.g. Call supplier about honey restock" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className={input} type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
        <select className={input} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{["low", "normal", "high", "urgent"].map((p) => <option key={p}>{p}</option>)}</select>
        <button className="btn-hero inline-flex items-center justify-center gap-1"><Plus className="h-4 w-4" /> Add</button>
      </form>
      <div className="space-y-2">
        {(data as any[]).map((t) => {
          const overdue = t.status !== "done" && t.due_date && t.due_date < today;
          return (
            <div key={t.id} className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${overdue ? "border-destructive" : "border-border"}`}>
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={t.status === "done"} onChange={(e) => save.mutate({ id: t.id, title: t.title, details: t.details, due_date: t.due_date, priority: t.priority, status: e.target.checked ? "done" : "open" })} />
              <div className={`min-w-0 flex-1 ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                <div className="text-sm font-medium truncate">{t.title}</div>
                {t.due_date && <div className={`text-xs ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{overdue ? "Overdue · " : "Due "}{t.due_date}</div>}
              </div>
              <Pill tone={prTone(t.priority)}>{t.priority}</Pill>
              <button onClick={() => rm.mutate(t.id)} className="rounded-lg p-1.5 text-destructive hover:bg-secondary" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          );
        })}
        {data.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No tasks yet</div>}
      </div>
    </div>
  );
}

/* ---------------- ACTIVITY ---------------- */
export function ActivityTab({ compact = false }: { compact?: boolean }) {
  const list = useServerFn(crmListActivity);
  const { data = [] } = useQuery({ queryKey: ["crm-activity"], queryFn: () => list() });
  const rows = compact ? (data as any[]).slice(0, 8) : (data as any[]);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {!compact && <h3 className="mb-3 font-display text-lg">Recent activity</h3>}
      <ol className="relative space-y-4 border-l border-border pl-5">
        {rows.map((a) => (
          <li key={a.id}>
            <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-gold" />
            <div className="text-sm">{a.summary ?? `${a.entity} ${a.action}`}</div>
            <div className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-muted-foreground">No activity yet</li>}
      </ol>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button aria-label="Close" className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-6 shadow-hover">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl">{title}</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
