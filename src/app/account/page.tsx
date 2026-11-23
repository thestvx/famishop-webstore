"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useCustomerAuth } from "@/lib/useCustomerAuth";
import { getCustomerProfile, updateCustomerProfile, getCustomerAddresses, addCustomerAddress, deleteCustomerAddress, getCustomerWishlist, toggleCustomerWishlist, CustomerProfile, CustomerAddress } from "@/lib/customerStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchProducts } from "@/lib/productsStore";
import { logoutCustomer } from "@/lib/customerAuth";

export default function AccountPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const { t, formatPrice, locale } = useI18n();
  const [tab, setTab] = useState("overview");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let active = true;
    (async () => {
      try {
        const [p, addr, wish, prods] = await Promise.all([
          getCustomerProfile(user.uid),
          getCustomerAddresses(user.uid),
          getCustomerWishlist(user.uid),
          fetchProducts(),
        ]);
        if (!active) return;
        setProfile(p || {
          uid: user.uid,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
          email: user.email || "",
          phoneNumber: "",
          countryCode: "FR",
          phoneVerified: false,
          emailVerified: user.emailVerified,
          accountStatus: "active",
        });
        setAddresses(addr);
        setWishlist(wish);
        setProducts(prods);
        // orders
        if (isSupabaseConfigured() && supabase) {
          const { data } = await supabase
            .from("orders")
            .select("*")
            .or(`customer_uid.eq.${user.uid},customer_email.eq.${user.email || ""}`)
            .order("created_at", { ascending: false });
          if (active) setOrders(data || []);
        }
        // reviews scan
        const userReviews: any[] = [];
        prods.forEach((prod: any) => {
          const list = Array.isArray(prod.reviews) ? prod.reviews : prod.prices?.reviews || [];
          list.forEach((r: any) => {
            if (r.userId === user.uid || r.userEmail === user.email) {
              userReviews.push({ ...r, product: prod });
            }
          });
        });
        if (active) setReviews(userReviews);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, authLoading, router]);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => String(o.status || "").toLowerCase() === "completed" || String(o.status || "").toLowerCase() === "processing").length;
  const pendingOrders = orders.filter((o) => String(o.status || "").toLowerCase() === "pending").length;
  const cancelledOrders = orders.filter((o) => String(o.status || "").toLowerCase() === "cancelled").length;
  const totalSpent = orders
    .filter((o) => !["cancelled", "canceled", "refunded"].includes(String(o.status || "").toLowerCase()))
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const handleLogout = async () => {
    await logoutCustomer();
    router.push("/login");
  };

  if (authLoading || loading) {
    return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;
  }
  if (!user || !profile) return null;

  const tabs = [
    { id: "overview", label: t("account.overview") },
    { id: "profile", label: t("account.profile") },
    { id: "orders", label: t("account.orders") },
    { id: "addresses", label: t("account.addresses") },
    { id: "reviews", label: t("account.reviews") },
    { id: "wishlist", label: t("account.wishlist") },
    { id: "settings", label: t("account.settings") },
  ];

  const wishlistProducts = products.filter((p) => wishlist.includes(String(p.id)));

  return (
    <main className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-frame mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="bg-white rounded-2xl border border-black/10 p-4 h-fit">
          <div className="mb-4">
            <div className="font-bold">{profile.firstName} {profile.lastName}</div>
            <div className="text-sm text-black/60">{profile.email}</div>
          </div>
          <nav className="space-y-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${tab === t.id ? "bg-black text-white" : "hover:bg-gray-100"}`}>
                {t.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">
              Log Out
            </button>
          </nav>
        </aside>
        <section className="lg:col-span-3 bg-white rounded-2xl border border-black/10 p-6">
          {tab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Welcome back, {profile.firstName || "Customer"}!</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="rounded-xl border p-4"><div className="text-sm text-black/60">Total Orders</div><div className="text-2xl font-bold">{totalOrders}</div></div>
                <div className="rounded-xl border p-4"><div className="text-sm text-black/60">Pending</div><div className="text-2xl font-bold">{pendingOrders}</div></div>
                <div className="rounded-xl border p-4"><div className="text-sm text-black/60">Completed</div><div className="text-2xl font-bold">{completedOrders}</div></div>
                <div className="rounded-xl border p-4"><div className="text-sm text-black/60">Cancelled</div><div className="text-2xl font-bold">{cancelledOrders}</div></div>
                <div className="rounded-xl border p-4"><div className="text-sm text-black/60">Total Spent</div><div className="text-2xl font-bold">{formatPrice(totalSpent)}</div></div>
                <div className="rounded-xl border p-4"><div className="text-sm text-black/60">Reviews</div><div className="text-2xl font-bold">{reviews.length}</div></div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Recent Orders</h3>
                {orders.slice(0, 5).length === 0 ? <div className="text-sm text-black/60">No orders yet.</div> : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="border rounded-xl p-3 text-sm">
                        <div className="flex justify-between"><span>#{o.id}</span><span>{o.status}</span></div>
                        <div className="text-black/60">{new Date(o.created_at).toLocaleDateString()}</div>
                        <div className="font-bold">{formatPrice(Number(o.total || 0))}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === "profile" && (
            <ProfileTab profile={profile} user={user} onSave={async (data) => {
              await updateCustomerProfile(user.uid, data);
              setProfile((prev) => (prev ? { ...prev, ...data } : prev));
            }} />
          )}
          {tab === "orders" && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold">My Orders</h2>
              {orders.length === 0 ? <div className="text-sm text-black/60">No orders yet.</div> : orders.map((o) => (
                <div key={o.id} className="border rounded-xl p-4 text-sm">
                  <div className="flex justify-between font-semibold"><span>Order #{o.id}</span><span>{o.status}</span></div>
                  <div className="text-black/60">{new Date(o.created_at).toLocaleString()}</div>
                  <div>Payment: {o.payment_status} ({o.payment_method})</div>
                  <div>Shipping: {o.shipping_method}</div>
                  <div className="font-bold mt-1">{formatPrice(Number(o.total || 0))}</div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">View details</summary>
                    <div className="mt-2 space-y-1">
                      {Array.isArray(o.items) && o.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.name} × {it.quantity}</span>
                          <span>{formatPrice(Number(it.price || 0) * Number(it.quantity || 1))}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
          {tab === "addresses" && (
            <AddressesTab uid={user.uid} addresses={addresses} setAddresses={setAddresses} />
          )}
          {tab === "reviews" && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold">My Reviews</h2>
              {reviews.length === 0 ? <div className="text-sm text-black/60">No reviews yet.</div> : reviews.map((r, idx) => (
                <div key={idx} className="border rounded-xl p-4 text-sm">
                  <div className="font-semibold">{r.product?.title}</div>
                  <div>Rating: {r.rating}/5</div>
                  <div>{r.content}</div>
                  <div className="text-black/50">{r.date}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "wishlist" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {wishlistProducts.length === 0 ? <div className="text-sm text-black/60">No wishlist items.</div> : wishlistProducts.map((p) => (
                <div key={p.id} className="border rounded-xl p-3">
                  <img src={p.srcUrl} alt={p.title} className="w-full aspect-square object-contain mb-2" />
                  <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                  <div className="font-bold">{formatPrice(p.price)}</div>
                  <button onClick={async () => {
                    const next = await toggleCustomerWishlist(user.uid, p.id);
                    setWishlist((prev) => next ? [...prev, String(p.id)] : prev.filter((id) => id !== String(p.id)));
                  }} className="mt-2 text-xs text-red-600">Remove</button>
                </div>
              ))}
            </div>
          )}
          {tab === "settings" && (
            <div className="space-y-4 text-sm">
              <h2 className="text-xl font-bold">Account Settings</h2>
              <div>Email verified: {profile.emailVerified ? "Yes" : "No"}</div>
              <div>Phone verified: {profile.phoneVerified ? "Yes" : "No"}</div>
              <button onClick={handleLogout} className="bg-black text-white px-5 py-2 rounded-full text-sm">Log Out</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProfileTab({ profile, user, onSave }: { profile: CustomerProfile; user: any; onSave: (data: any) => Promise<void> }) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phoneNumber);
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My Profile</h2>
      <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
      <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
      <input className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <div className="text-sm text-black/60">Email: {profile.email}</div>
      <button disabled={saving} onClick={async () => {
        setSaving(true);
        await onSave({ firstName, lastName, phoneNumber: phone });
        setSaving(false);
      }} className="bg-black text-white px-5 py-2 rounded-full text-sm disabled:opacity-50">
        Save
      </button>
    </div>
  );
}

function AddressesTab({ uid, addresses, setAddresses }: { uid: string; addresses: CustomerAddress[]; setAddresses: React.Dispatch<React.SetStateAction<CustomerAddress[]>> }) {
  const [form, setForm] = useState<CustomerAddress>({ fullName: "", phoneNumber: "", country: "France", city: "", postalCode: "", streetAddress: "", apartment: "", isDefault: false });
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">My Addresses</h2>
      <div className="space-y-2">
        {addresses.map((a) => (
          <div key={a.id} className="border rounded-xl p-3 text-sm">
            <div className="font-semibold">{a.fullName}</div>
            <div>{a.streetAddress} {a.apartment}</div>
            <div>{a.postalCode} {a.city}, {a.country}</div>
            <div>{a.phoneNumber}</div>
            <button onClick={async () => {
              if (!a.id) return;
              await deleteCustomerAddress(uid, a.id);
              setAddresses((prev) => prev.filter((x) => x.id !== a.id));
            }} className="mt-2 text-xs text-red-600">Delete</button>
          </div>
        ))}
      </div>
      <div className="border rounded-xl p-4 space-y-2">
        <input className="w-full px-3 py-2 rounded border text-sm" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <input className="w-full px-3 py-2 rounded border text-sm" placeholder="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
        <input className="w-full px-3 py-2 rounded border text-sm" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <input className="w-full px-3 py-2 rounded border text-sm" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input className="w-full px-3 py-2 rounded border text-sm" placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
        <input className="w-full px-3 py-2 rounded border text-sm" placeholder="Street address" value={form.streetAddress} onChange={(e) => setForm({ ...form, streetAddress: e.target.value })} />
        <input className="w-full px-3 py-2 rounded border text-sm" placeholder="Apartment" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} />
        <button disabled={saving} onClick={async () => {
          setSaving(true);
          const id = await addCustomerAddress(uid, form);
          setAddresses((prev) => [{ ...form, id }, ...prev]);
          setForm({ fullName: "", phoneNumber: "", country: "France", city: "", postalCode: "", streetAddress: "", apartment: "", isDefault: false });
          setSaving(false);
        }} className="bg-black text-white px-5 py-2 rounded-full text-sm disabled:opacity-50">
          Add Address
        </button>
      </div>
    </div>
  );
}
