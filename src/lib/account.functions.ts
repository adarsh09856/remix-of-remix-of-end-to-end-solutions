import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAccountDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (profileError) throw new Error(profileError.message);

    if (!profile) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, full_name: (context.claims?.user_metadata as any)?.full_name ?? null }, { onConflict: "id", ignoreDuplicates: true });
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id,role", ignoreDuplicates: true });
      const retry = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (retry.error) throw new Error(retry.error.message);
      profile = retry.data;
    }

    const [adminRes, ordersRes, addressesRes, wishlistRes, notificationsRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
      supabase.from("orders").select("*, order_items(*)").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("wishlist").select("product_id, created_at, products:product_id(id,name,slug,price_inr,unit,image_url,stock,rating_avg,rating_count,badge)").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (addressesRes.error) throw new Error(addressesRes.error.message);
    if (wishlistRes.error) throw new Error(wishlistRes.error.message);
    if (notificationsRes.error) throw new Error(notificationsRes.error.message);

    return {
      profile,
      admin: !!adminRes.data,
      orders: ordersRes.data ?? [],
      addresses: addressesRes.data ?? [],
      wishlist: wishlistRes.data ?? [],
      notifications: notificationsRes.data ?? [],
      email: (context.claims as any)?.email ?? "",
    };
  });

// ---------- ADDRESSES ----------
const AddressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1).max(40),
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(30),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(80).default("Bhutan"),
  is_default: z.boolean().default(false),
});

export const listMyAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("addresses").select("*").order("is_default", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AddressSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (data.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }
    const payload = { ...data, user_id: userId };
    if (data.id) {
      const { error } = await supabase.from("addresses").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabase.from("addresses").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteMyAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("addresses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- WISHLIST ----------
export const listMyWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist").select("product_id, created_at, products:product_id(id,name,slug,price_inr,unit,image_url,stock,rating_avg,rating_count,badge)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase.from("wishlist").select("product_id").eq("user_id", userId).eq("product_id", data.productId).maybeSingle();
    if (existing) {
      await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", data.productId);
      return { inWishlist: false };
    }
    await supabase.from("wishlist").insert({ user_id: userId, product_id: data.productId });
    return { inWishlist: true };
  });

export const wishlistContains = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase.from("wishlist").select("product_id").eq("product_id", data.productId).maybeSingle();
    return { inWishlist: !!row };
  });

// ---------- REVIEWS ----------
const ReviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  body: z.string().trim().max(2000).optional().nullable(),
});

export const listProductReviews = createServerFn({ method: "POST" })
  .inputValidator((d: { productId: string }) => z.object({ productId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const c = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: reviews, error } = await c.from("reviews")
      .select("id, rating, title, body, created_at, user_id")
      .eq("product_id", data.productId).eq("status", "approved")
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    // join names from profiles
    const ids = [...new Set((reviews ?? []).map((r) => r.user_id))];
    if (ids.length === 0) return [];
    const { data: profs } = await c.from("profiles").select("id, full_name").in("id", ids);
    const nameMap = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
    return (reviews ?? []).map((r) => ({ ...r, author_name: nameMap.get(r.user_id) ?? "Customer" }));
  });

export const upsertMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReviewSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // verify the user has ordered this product
    const { data: oi } = await supabase
      .from("order_items").select("order_id, orders!inner(user_id,status)")
      .eq("product_id", data.product_id).limit(1);
    if (!oi || oi.length === 0) throw new Error("You can only review products you've ordered");
    const { error } = await supabase.from("reviews").upsert(
      { ...data, user_id: userId, status: "approved" },
      { onConflict: "product_id,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reviews").select("*, products:product_id(name, slug, image_url)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- NOTIFICATIONS ----------
export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const unreadNotificationCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    return count ?? 0;
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    return { ok: true };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", data.id);
    return { ok: true };
  });
