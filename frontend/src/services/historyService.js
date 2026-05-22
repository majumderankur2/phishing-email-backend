import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase";

export const saveScanHistory = async (
  scanData
) => {

  const user = auth.currentUser;

  if (!user) return;

  await addDoc(
    collection(
      db,
      "scanHistory",
      user.uid,
      "scans"
    ),
    {
      ...scanData,
      createdAt: serverTimestamp(),
    }
  );
};

export const getUserScanHistory = async () => {

  const user = auth.currentUser;

  if (!user) return [];

  const q = query(
    collection(
      db,
      "scanHistory",
      user.uid,
      "scans"
    ),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};