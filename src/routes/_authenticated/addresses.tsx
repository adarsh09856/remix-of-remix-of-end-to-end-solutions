import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listMyAddresses, upsertMyAddress, deleteMyAddress } from "@/lib/account.functions";
import { toast } from "sonner";
import { Plus, MapPin, Pencil, Trash2, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/addresses")({
  head: () => ({ meta: [{ title: "Addresses — Takin Mart" }] }),
  component: AddressesPage,
});

const empty = {
  label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "Bhutan", is_default: false,
};

function AddressesPage() {
  const fetchFn = useServerFn(listMyAddresses);
  const upsertFn = useServerFn(upsertMyAddress);
  const deleteFn = useServerFn(deleteMyAddress);
  const qc = useQueryClient();
  const { data: list } = useQuery({ queryKey: ["my-addresses"], queryFn: () => fetchFn() });
  const [editing, setEditing] = useState<any | null>(null);

  const upsert = useMutation({
    mutationFn: (a: any) => upsertFn({ data: a }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-addresses"] }); setEditing(null); toast.success("Address saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-addresses"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container-page py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-4xl">Addresses</h1>
        <button onClick={() => setEditing(empty)} className="btn-hero"><Plus className="h-4 w-4" /> New address</button>
      </div>
      <p className="text-muted-foreground mb-8"><Link to="/account" className="hover:text-primary">My Account</Link> · Saved shipping addresses</p>

      {(list ?? []).length === 0 && !editing && (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <MapPin className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">No addresses yet.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(list ?? []).map((a: any) => (
          <div key={a.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{a.label}</span>
                  {a.is_default && <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Default</span>}
                </div>
                <div className="text-sm mt-1">{a.full_name}</div>
                <div className="text-sm text-muted-foreground">{a.phone}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(a)} className="text-primary p-1.5 hover:bg-muted rounded"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => { if (confirm("Delete address?")) del.mutate(a.id); }} className="text-destructive p-1.5 hover:bg-muted rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
              {a.city}, {a.state} {a.pincode}<br />
              {a.country}
            </p>
          </div>
        ))}
      </div>

      {editing && <AddressForm value={editing} onSave={(v: any) => upsert.mutate(v)} onClose={() => setEditing(null)} saving={upsert.isPending} />}
    </div>
  );
}

function AddressForm({ value, onSave, onClose, saving }: any) {
  const [f, setF] = useState(value);
  const input = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary";
  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl mb-4">{f.id ? "Edit" : "New"} address</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {["Home", "Work", "Other"].map((l) => (
              <button key={l} type="button" onClick={() => setF({ ...f, label: l })} className={`rounded-lg px-3 py-2 text-xs font-medium border ${f.label === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{l}</button>
            ))}
          </div>
          <input className={input} placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
          <input className={input} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input className={input} placeholder="Address line 1" value={f.line1} onChange={(e) => setF({ ...f, line1: e.target.value })} />
          <input className={input} placeholder="Address line 2 (optional)" value={f.line2 ?? ""} onChange={(e) => setF({ ...f, line2: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <input className={input} placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
            <input className={input} placeholder="State" value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} />
            <input className={input} placeholder="PIN" value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value })} />
          </div>
          <div className="flex rounded-lg border border-border bg-background p-1 text-sm">
            {["Bhutan"].map((c) => (
              <button key={c} type="button" onClick={() => setF({ ...f, country: c })} className={`flex-1 rounded-md px-4 py-2 ${f.country === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{c}</button>
            ))}
          </div>
          <button type="button" onClick={() => setF({ ...f, is_default: !f.is_default })} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${f.is_default ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {f.is_default && <Check className="h-4 w-4" />} Use as default
          </button>
        </div>
        <div className="flex gap-2 mt-6">
          <button disabled={saving} onClick={() => onSave(f)} className="btn-hero flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          <button onClick={onClose} className="btn-ghost-hero flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}
