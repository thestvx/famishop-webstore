import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

export type CustomerProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt?: any;
  updatedAt?: any;
  accountStatus?: string;
  marketingOptIn?: boolean;
};

export async function saveCustomerProfile(profile: CustomerProfile) {
  const ref = doc(firestore, "users", profile.uid);
  await setDoc(
    ref,
    {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  const ref = doc(firestore, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as any) };
}

export async function updateCustomerProfile(uid: string, data: Partial<CustomerProfile>) {
  const ref = doc(firestore, "users", uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export type CustomerAddress = {
  id?: string;
  fullName: string;
  phoneNumber: string;
  country: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  apartment?: string;
  isDefault?: boolean;
};

export async function getCustomerAddresses(uid: string): Promise<CustomerAddress[]> {
  const ref = collection(firestore, "users", uid, "addresses");
  const snap = await getDocs(query(ref, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function addCustomerAddress(uid: string, address: CustomerAddress) {
  const ref = collection(firestore, "users", uid, "addresses");
  const docRef = await addDoc(ref, { ...address, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return docRef.id;
}

export async function updateCustomerAddress(uid: string, addressId: string, address: Partial<CustomerAddress>) {
  const ref = doc(firestore, "users", uid, "addresses", addressId);
  await updateDoc(ref, { ...address, updatedAt: serverTimestamp() });
}

export async function deleteCustomerAddress(uid: string, addressId: string) {
  const ref = doc(firestore, "users", uid, "addresses", addressId);
  await deleteDoc(ref);
}

export async function getCustomerWishlist(uid: string): Promise<string[]> {
  const ref = collection(firestore, "users", uid, "wishlist");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.id);
}

export async function toggleCustomerWishlist(uid: string, productId: string | number) {
  const id = String(productId);
  const ref = doc(firestore, "users", uid, "wishlist", id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { productId: id, addedAt: serverTimestamp() });
  return true;
}
