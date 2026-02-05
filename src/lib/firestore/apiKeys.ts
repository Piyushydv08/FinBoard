import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
    query,
    where
} from "firebase/firestore";

export interface ApiKey {
    id: string;
    label: string;
    provider: string; // e.g., 'Alpha Vantage', 'Finnhub'
    key: string;
    createdAt: number;
}

// Collection reference: users/{userId}/apiKeys
const getKeysCollection = (userId: string) =>
    collection(db, "users", userId, "apiKeys");

export const addApiKey = async (userId: string, data: Omit<ApiKey, "id" | "createdAt">) => {
    try {
        const docRef = await addDoc(getKeysCollection(userId), {
            ...data,
            createdAt: Date.now(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error("Error adding API key:", error);
        throw error;
    }
};

export const getApiKeys = async (userId: string): Promise<ApiKey[]> => {
    try {
        const q = query(getKeysCollection(userId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as ApiKey));
    } catch (error) {
        console.error("Error fetching API keys:", error);
        throw error;
    }
};

export const deleteApiKey = async (userId: string, keyId: string) => {
    try {
        await deleteDoc(doc(db, "users", userId, "apiKeys", keyId));
    } catch (error) {
        console.error("Error deleting API key:", error);
        throw error;
    }
};
