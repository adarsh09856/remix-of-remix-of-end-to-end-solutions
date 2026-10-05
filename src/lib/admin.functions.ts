import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const userIds = Array.from(new Set((data ?? []).map((order: any) => order.user_id).filter(Boolean)));
    const [{ data: profiles }, usersRes] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from("profiles").select("id, full_name, phone, city, country").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.id, profile]));
    const emailMap = new Map((usersRes.data?.users ?? []).map((user: any) => [user.id, user.email ?? ""]));
    return (data ?? []).map((order: any) => ({
      ...order,
      customer_profile: profileMap.get(order.user_id) ?? null,
      customer_email: emailMap.get(order.user_id) ?? "",
    }));
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    try {
      const { data, error } = await context.supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      // Fall through to fallback catalog
    }
    const { FALLBACK_PRODUCTS } = await import("./products.functions");
    return FALLBACK_PRODUCTS.map((p) => ({
      ...p,
      is_active: true,
      price_inr: p.price_inr,
      stock: p.stock ?? 25,
      categories: { name: (p as any).categories?.name ?? "Bhutan Agro" },
    }));
  });

const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(160).regex(/^[a-z0-9-]+$/),
  category_id: z.string().uuid().nullable(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  price_inr: z.number().min(0),
  price_in: z.number().min(0).nullable().optional(),
  price_us: z.number().min(0).nullable().optional(),
  compare_at_inr: z.number().min(0).nullable().optional(),
  compare_at_in: z.number().min(0).nullable().optional(),
  compare_at_us: z.number().min(0).nullable().optional(),
  unit: z.string().min(1).max(40),
  image_url: z.string().max(500).optional().nullable(),
  gallery: z.array(z.string().max(500)).optional().nullable(),
  badge: z.string().max(40).optional().nullable(),
  origin: z.string().max(120).optional().nullable(),
  stock: z.number().int().min(0),
  low_stock_threshold: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  images: z.array(z.string().max(500)).optional().nullable(),
  sku: z.string().trim().max(60).optional().nullable(),
  barcode: z.string().trim().max(60).optional().nullable(),

  is_active: z.boolean(),
});

export const adminUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProductSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id) {
      const { error } = await context.supabase.from("products").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("products").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "pending" | "paid" | "fulfilled" | "cancelled" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending", "paid", "fulfilled", "cancelled"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const TrackingSchema = z.object({
  id: z.string().uuid(),
  courier: z.string().trim().max(80).optional().nullable(),
  tracking_number: z.string().trim().max(120).optional().nullable(),
  estimated_delivery: z.string().trim().max(20).optional().nullable(),
  admin_notes: z.string().trim().max(1000).optional().nullable(),
});

export const adminUpdateOrderTracking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TrackingSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const clean: any = { ...patch };
    if (!clean.estimated_delivery) clean.estimated_delivery = null;
    const { error } = await supabaseAdmin.from("orders").update(clean).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
});

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.from("categories").select("*").order("sort_order");
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      // Fall through to fallback categories
    }
    const { FALLBACK_CATEGORIES } = await import("./products.functions");
    return FALLBACK_CATEGORIES;
  });

export const adminUpsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CategorySchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("categories").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("categories").insert(data);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error: profilesErr }, { data: roles, error: rolesErr }, usersRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (profilesErr) throw new Error(profilesErr.message);
    if (rolesErr) throw new Error(rolesErr.message);
    if (usersRes.error) throw new Error(usersRes.error.message);
    const emailMap = new Map(usersRes.data.users.map((user) => [user.id, user.email ?? ""]));
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((row: any) => roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role]));
    return (profiles ?? []).map((profile: any) => ({ ...profile, email: emailMap.get(profile.id) ?? "", roles: roleMap.get(profile.id) ?? [] }));
  });

export const adminSetCustomerAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.makeAdmin) {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if (data.userId === context.userId && (count ?? 0) <= 1) throw new Error("You cannot remove the last admin");
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [ordersRes, productsRes, usersRes] = await Promise.all([
      supabaseAdmin.from("orders").select("total_inr,status,created_at"),
      supabaseAdmin.from("products").select("id,stock,is_active"),
      supabaseAdmin.from("profiles").select("id"),
    ]);
    const orders = ordersRes.data ?? [];
    const products = productsRes.data && productsRes.data.length > 0 ? productsRes.data : (await import("./products.functions")).FALLBACK_PRODUCTS;
    const revenue = orders.filter((o: any) => o.status === "paid" || o.status === "fulfilled")
      .reduce((s: number, o: any) => s + Number(o.total_inr), 0);
    return {
      revenue,
      orderCount: orders.length,
      pendingCount: orders.filter((o: any) => o.status === "pending").length,
      productCount: products.length,
      lowStock: products.filter((p: any) => (p.stock ?? 20) < 10).length,
      userCount: (usersRes.data ?? []).length,
    };
  });
