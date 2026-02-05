import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  DocumentData
} from "firebase/firestore";

export interface WidgetConfig {
  id: string;
  title: string;
  type: "card" | "chart" | "table";
  apiEndpoint: string;
  selectedApiKeyId?: string;
  refreshInterval?: number;
  dataMapping: Record<string, string>;
  config?: any; // For specialized widgets like IndianAPI
}

export interface DashboardData {
  widgets: WidgetConfig[];
  // Change types to 'any' to handle both mutable and readonly arrays from library types
  layout: any; 
}

/**
 * Helper to remove undefined keys which Firestore rejects.
 * JSON.stringify removes keys with undefined values.
 */
const cleanForFirestore = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

/**
 * Listen to dashboard changes in real-time
 */
export function listenDashboard(userId: string, callback: (data: DashboardData | null) => void) {
  const docRef = doc(db, "dashboards", userId);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as DashboardData;
      callback(data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error listening to dashboard:", error);
    callback(null);
  });
}

/**
 * Save dashboard data
 */
export async function saveDashboard(userId: string, data: DashboardData): Promise<void> {
  try {
    const docRef = doc(db, "dashboards", userId);
    // Sanitize data to remove 'undefined' values before saving
    const cleanData = cleanForFirestore(data);
    
    await setDoc(docRef, cleanData, { merge: true });
    console.log("Dashboard saved for user:", userId);
  } catch (error) {
    console.error("Error saving dashboard:", error);
    throw error;
  }
}

/**
 * Delete a specific widget
 */
export async function deleteWidget(userId: string, widgetId: string): Promise<void> {
  try {
    const docRef = doc(db, "dashboards", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as DashboardData;
      const updatedWidgets = data.widgets.filter(w => w.id !== widgetId);
      const updatedLayout = Array.isArray(data.layout) ? data.layout.filter((l: any) => l.i !== widgetId) : [];
      
      const cleanUpdates = cleanForFirestore({
        widgets: updatedWidgets,
        layout: updatedLayout
      });

      await updateDoc(docRef, cleanUpdates);
      
      console.log("Widget deleted:", widgetId);
    }
  } catch (error) {
    console.error("Error deleting widget:", error);
    throw error;
  }
}

/**
 * Get dashboard data (one-time)
 */
export async function getDashboard(userId: string): Promise<DashboardData | null> {
  try {
    const docRef = doc(db, "dashboards", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as DashboardData;
    }
    return null;
  } catch (error) {
    console.error("Error getting dashboard:", error);
    throw error;
  }
}