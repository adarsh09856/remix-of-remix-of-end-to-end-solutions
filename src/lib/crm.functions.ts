import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

async function logActivity(
  supabase: any,
  actorId: string,
  entity: string,
  entityId: string | null,
  action: string,
  summary: string,
) {
  await supabase.from("crm_activity").insert({
    actor_id: actorId,
    entity,
    entity_id: entityId,
    action,
    summary,
  });
}

/* ---------------- LEADS ---------------- */

const LeadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(140),
  email: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  company: z.string().trim().max(140).optional().nullable(),
  source: z.enum(["manual", "website", "whatsapp", "referral", "instagram", "walk-in", "enquiry"]).default("manual"),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).default("new"),
  value_inr: z.number().min(0).default(0),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const crmListLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const crmUpsertLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LeadSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload: any = { ...data };
    if (data.id) {
      delete payload.id;
      const { error } = await context.supabase.from("crm_leads").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logActivity(context.supabase, context.userId, "lead", data.id, "updated", `Lead “${data.name}” updated`);
    } else {
      payload.owner_id = context.userId;
      const { data: row, error } = await context.supabase.from("crm_leads").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      await logActivity(context.supabase, context.userId, "lead", row?.id ?? null, "created", `Lead “${data.name}” created`);
    }
    return { ok: true };
  });

export const crmSetLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "contacted", "qualified", "won", "lost"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_leads")
      .update({ status: data.status, last_contacted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(context.supabase, context.userId, "lead", data.id, "status", `Lead moved to ${data.status}`);
    return { ok: true };
  });

export const crmDeleteLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("crm_leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- ENQUIRIES ---------------- */

export const crmSubmitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(140),
        email: z.string().trim().email().max(160).optional().nullable(),
        phone: z.string().trim().max(40).optional().nullable(),
        subject: z.string().trim().max(160).optional().nullable(),
        message: z.string().trim().min(1).max(4000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("crm_enquiries").insert(data as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const crmListEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("crm_enquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const crmUpdateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved", "spam"]).optional(),
        reply: z.string().trim().max(4000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: any = { handled_by: context.userId };
    if (data.status) patch.status = data.status;
    if (data.reply !== undefined) patch.reply = data.reply;
    const { error } = await context.supabase.from("crm_enquiries").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(context.supabase, context.userId, "enquiry", data.id, "updated", `Enquiry updated${data.status ? ` → ${data.status}` : ""}`);
    return { ok: true };
  });

export const crmConvertEnquiryToLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: enq, error: readErr } = await context.supabase
      .from("crm_enquiries")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!enq) throw new Error("Enquiry not found");
    const { error } = await context.supabase.from("crm_leads").insert({
      name: enq.name,
      email: enq.email,
      phone: enq.phone,
      source: "enquiry",
      status: "new",
      notes: enq.message,
      owner_id: context.userId,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("crm_enquiries").update({ status: "in_progress", handled_by: context.userId }).eq("id", data.id);
    await logActivity(context.supabase, context.userId, "enquiry", data.id, "converted", `Enquiry from ${enq.name} converted to a lead`);
    return { ok: true };
  });

export const crmDeleteEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("crm_enquiries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- TASKS ---------------- */

const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  details: z.string().trim().max(2000).optional().nullable(),
  due_date: z.string().trim().max(20).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  status: z.enum(["open", "in_progress", "done"]).default("open"),
});

export const crmListTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("crm_tasks")
      .select("*")
      .order("status")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const crmUpsertTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TaskSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload: any = { ...data };
    if (!payload.due_date) payload.due_date = null;
    if (data.id) {
      delete payload.id;
      const { error } = await context.supabase.from("crm_tasks").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      payload.created_by = context.userId;
      payload.assignee_id = context.userId;
      const { error } = await context.supabase.from("crm_tasks").insert(payload);
      if (error) throw new Error(error.message);
      await logActivity(context.supabase, context.userId, "task", null, "created", `Task “${data.title}” created`);
    }
    return { ok: true };
  });

export const crmDeleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("crm_tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- CUSTOMER NOTES ---------------- */

export const crmListCustomerNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ customerId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("crm_customer_notes")
      .select("*")
      .eq("customer_id", data.customerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const crmAddCustomerNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ customerId: z.string().uuid(), body: z.string().trim().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("crm_customer_notes")
      .insert({ customer_id: data.customerId, body: data.body, author_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const crmDeleteCustomerNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("crm_customer_notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- ACTIVITY + PIPELINE STATS ---------------- */

export const crmListActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("crm_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const crmPipelineStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const [leads, enquiries, tasks] = await Promise.all([
      context.supabase.from("crm_leads").select("status,value_inr"),
      context.supabase.from("crm_enquiries").select("status"),
      context.supabase.from("crm_tasks").select("status,due_date"),
    ]);
    const leadRows = (leads.data ?? []) as any[];
    const enquiryRows = (enquiries.data ?? []) as any[];
    const taskRows = (tasks.data ?? []) as any[];
    const today = new Date().toISOString().slice(0, 10);
    return {
      leadTotal: leadRows.length,
      leadNew: leadRows.filter((l) => l.status === "new").length,
      leadWon: leadRows.filter((l) => l.status === "won").length,
      pipelineValue: leadRows
        .filter((l) => l.status !== "lost")
        .reduce((sum, l) => sum + Number(l.value_inr ?? 0), 0),
      enquiryOpen: enquiryRows.filter((e) => e.status === "open").length,
      enquiryTotal: enquiryRows.length,
      taskOpen: taskRows.filter((t) => t.status !== "done").length,
      taskOverdue: taskRows.filter((t) => t.status !== "done" && t.due_date && t.due_date < today).length,
    };
  });
