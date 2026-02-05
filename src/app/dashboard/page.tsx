"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  listenDashboard,
  saveDashboard,
  type WidgetConfig
} from "@/lib/firestore/dashboard";

import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import WidgetWizard from "@/components/widgets/WidgetWizard";
import { Plus, Save, Loader2, X, Menu } from "lucide-react";

// Import Responsive and WidthProvider
import { Responsive, WidthProvider, type Layout } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Use Responsive Grid Layout
const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardPage() {
  const { user } = useAuth();
  
  // State
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layout, setLayout] = useState<Layout>([]); 
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /** 🔴 REAL-TIME SYNC */
  useEffect(() => {
    if (!user) return;

    const unsub = listenDashboard(user.uid, data => {
      if (!data) {
        setWidgets([]);
        setLayout([]);
      } else {
        setWidgets(data.widgets ?? []);
        const rawLayout = data.layout ?? [];
        setLayout(rawLayout as unknown as Layout);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  /** 💾 Save Dashboard */
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveDashboard(user.uid, { widgets, layout: layout as any });
      console.log("Dashboard saved successfully");
    } catch (error) {
      console.error("Error saving dashboard:", error);
    } finally {
      setSaving(false);
    }
  };

  /** ➕ Add Widget */
  const handleAddWidget = (widget: WidgetConfig) => {
    const nextWidgets = [...widgets, widget];
    setWidgets(nextWidgets);

    // Add new item to layout
    setLayout(prev => {
        const newLayoutItem = {
          i: widget.id,
          x: (prev.length * 4) % (isMobile ? 2 : 12),
          y: Infinity,
          w: isMobile ? 2 : 4,
          h: 4,
          minW: isMobile ? 1 : 2,
          minH: 2,
        };
        return [...prev, newLayoutItem];
    });

    setShowWizard(false);
  };

  /** 🗑️ Delete Widget */
  const handleDeleteWidget = async (widgetId: string) => {
    if (!user) return;
    try {
      const updatedWidgets = widgets.filter(w => w.id !== widgetId);
      const updatedLayout = layout.filter(l => l.i !== widgetId);
      setWidgets(updatedWidgets);
      setLayout(updatedLayout);
      await saveDashboard(user.uid, { widgets: updatedWidgets, layout: updatedLayout as any });
    } catch (error) { console.error(error); } 
    finally { setShowDeleteDialog(false); setWidgetToDelete(null); }
  };

  /** 🔄 Layout change */
  const handleLayoutChange = useCallback(
    (currentLayout: Layout, allLayouts: any) => {
      setLayout(currentLayout);
    },
    []
  );

  /** 🚪 Auto-save on layout change */
  useEffect(() => {
    if (!user || layout.length === 0 || widgets.length === 0) return;
    const timeoutId = setTimeout(async () => {
      try {
        await saveDashboard(user.uid, { widgets, layout: layout as any });
      } catch (error) { console.error(error); }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [layout, user]);

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-h-full p-3 md:p-4 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-3 md:py-2 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 md:mt-0">
            {isMobile ? "Tap to rearrange • Changes auto-save" : "Drag to rearrange • Changes auto-save"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {widgets.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 text-sm font-medium border rounded-lg hover:bg-accent disabled:opacity-50 min-h-11"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="md:hidden lg:inline">Save</span>
            </button>
          )}

          <button
            onClick={() => setShowWizard(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg min-h-11"
          >
            <Plus className="h-5 w-5 md:h-4 md:w-4" />
            <span className="md:hidden lg:inline">Add Widget</span>
            <span className="hidden md:inline lg:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Wizard & Delete Dialogs */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <WidgetWizard
            onSave={handleAddWidget}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      )}
      
      {showDeleteDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full border mx-4">
                <h3 className="text-lg font-semibold mb-2">Delete Widget</h3>
                <p className="text-sm text-muted-foreground mb-6">Are you sure?</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => setWidgetToDelete(null)} 
                      className="flex-1 px-4 py-3 text-sm border rounded-lg hover:bg-accent min-h-11"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => widgetToDelete && handleDeleteWidget(widgetToDelete)} 
                      className="flex-1 px-4 py-3 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 min-h-11"
                    >
                      Delete
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Grid Layout */}
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 md:p-16 text-center mt-4 mx-4">
          <div className="rounded-full bg-primary/10 p-4"><Plus className="h-12 w-12 text-primary" /></div>
          <h3 className="text-lg font-semibold">Dashboard Empty</h3>
          <button 
            onClick={() => setShowWizard(true)} 
            className="px-6 py-3 text-sm bg-primary text-primary-foreground rounded-lg min-h-11"
          >
            Create First Widget
          </button>
        </div>
      ) : (
        <div className="flex-1 px-1">
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 768, sm: 640, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 8, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={30}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              isResizable={!isMobile}
              isDraggable={!isMobile}
              margin={[10, 10]}
              containerPadding={[0, 0]}
              allowOverlap={false}
              compactType="vertical"
              preventCollision={true}
            >
              {widgets.map(w => (
                <div key={w.id} className="group relative rounded-lg border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Controls */}
                  <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        className="h-10 w-10 md:h-6 md:w-6 rounded flex items-center justify-center hover:bg-destructive/10 text-destructive"
                        onClick={(e) => { e.stopPropagation(); setWidgetToDelete(w.id); setShowDeleteDialog(true); }}
                        onTouchEnd={(e) => { e.stopPropagation(); setWidgetToDelete(w.id); setShowDeleteDialog(true); }}
                      >
                        <X className="h-5 w-5 md:h-4 md:w-4" />
                      </button>
                  </div>
                  
                  <div className="drag-handle absolute top-0 left-0 right-0 h-10 md:h-8 z-10 cursor-move md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-none" />

                  <WidgetRenderer widget={w} className="h-full w-full pt-10 md:pt-8" />
                </div>
              ))}
            </ResponsiveGridLayout>
        </div>
      )}
    </div>
  );
}