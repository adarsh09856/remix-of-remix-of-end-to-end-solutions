import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Takin Mart" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const fetchFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchFn() });
  const [form, setForm] = useState({
    full_name: "", phone: "", address_line1: "", address_line2: "",
    city: "", state: "", postal_code: "", country: "Bhutan",
  });
  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name ?? "", phone: profile.phone ?? "",
      address_line1: profile.address_line1 ?? "", address_line2: profile.address_line2 ?? "",
      city: profile.city ?? "", state: profile.state ?? "",
      postal_code: profile.postal_code ?? "", country: profile.country ?? "Bhutan",
    });
  }, [profile]);

  const m = useMutation({
    mutationFn: () => updateFn({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full bg-card border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary";

  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="font-display text-4xl mb-2">Profile & Address</h1>
      <p className="text-muted-foreground mb-8">We use this for shipping your orders.</p>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-4">
        <input className={input} placeholder="Full name" required maxLength={120} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className={input} placeholder="Phone" maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={input} placeholder="Address line 1" maxLength={200} value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
        <input className={input} placeholder="Address line 2" maxLength={200} value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
        <div className="grid sm:grid-cols-3 gap-4">
          <input className={input} placeholder="City" maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className={input} placeholder="State" maxLength={100} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input className={input} placeholder="Postal code" maxLength={20} value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
        </div>
        <div className="flex rounded-lg border border-border bg-card p-1 text-sm">
          {["Bhutan"].map((country) => (
            <button
              key={country}
              type="button"
              onClick={() => setForm({ ...form, country })}
              className={`flex-1 rounded-md px-4 py-2.5 transition ${form.country === country ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {country}
            </button>
          ))}
        </div>
        <button disabled={m.isPending} className="btn-hero">{m.isPending ? "Saving…" : "Save profile"}</button>
      </form>
    </div>
  );
}
