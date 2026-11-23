import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
  reload,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

export type CustomerAuthInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  countryCode: string;
};

export async function registerCustomer(input: CustomerAuthInput) {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, input.email.trim(), input.password);
  await updateProfile(cred.user, { displayName: `${input.firstName} ${input.lastName}`.trim() });
  await sendEmailVerification(cred.user);
  return cred.user;
}

export async function loginCustomer(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return cred.user;
}

export async function resetCustomerPassword(email: string) {
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

export async function resendCustomerVerification(user: User) {
  await sendEmailVerification(user);
}

export async function refreshCustomer(user: User) {
  await reload(user);
  return firebaseAuth.currentUser;
}

export async function logoutCustomer() {
  await signOut(firebaseAuth);
}

export function subscribeCustomerAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback);
}
