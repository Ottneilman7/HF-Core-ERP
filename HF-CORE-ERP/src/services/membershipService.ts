import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, CURRENT_BUSINESS_ID } from "../lib/firebase";
import type { Membership, MembershipRole, ModuleKey } from "../models/Membership";
import { DEFAULT_MODULES_BY_ROLE } from "../models/Membership";

function memberDocRef(uid: string) {
  return doc(db, "businesses", CURRENT_BUSINESS_ID, "members", uid);
}
function membersCollectionRef() {
  return collection(db, "businesses", CURRENT_BUSINESS_ID, "members");
}

export async function getMyMembership(uid: string): Promise<Membership | null> {
  const snap = await getDoc(memberDocRef(uid));
  return snap.exists() ? (snap.data() as Membership) : null;
}

export async function listMembers(): Promise<Membership[]> {
  const snap = await getDocs(membersCollectionRef());
  return snap.docs.map((d) => d.data() as Membership);
}

export function defaultModulesFor(role: MembershipRole): ModuleKey[] {
  return DEFAULT_MODULES_BY_ROLE[role];
}

export async function upsertMembership(
  uid: string,
  email: string,
  role: MembershipRole,
  modules: ModuleKey[],
  canCreateProducts: boolean,
  displayName?: string
): Promise<Membership> {
  const membership: Membership = {
    uid,
    businessId: CURRENT_BUSINESS_ID,
    role,
    modules,
    canCreateProducts,
    email,
    displayName,
    createdAt: new Date().toISOString(),
  };
  await setDoc(memberDocRef(uid), membership);
  return membership;
}

export async function deleteMembership(uid: string): Promise<void> {
  await deleteDoc(memberDocRef(uid));
}