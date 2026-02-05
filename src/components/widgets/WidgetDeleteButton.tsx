"use client";

import { useState } from "react";
import { Trash2, AlertCircle } from "lucide-react";

interface WidgetDeleteButtonProps {
  widgetId: string;
  widgetTitle: string;
  onDelete: (widgetId: string) => void;
  className?: string;
}

export default function WidgetDeleteButton({
  widgetId,
  widgetTitle,
  onDelete,
  className = ""
}: WidgetDeleteButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`h-8 w-8 p-0 rounded-md flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors ${className}`}
        onClick={() => setShowDialog(true)}
        title={`Delete "${widgetTitle}"`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-lg border shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold">Delete Widget</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Are you sure you want to delete <strong className="font-semibold">{widgetTitle}</strong>?
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                This action cannot be undone and the widget will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(widgetId);
                    setShowDialog(false);
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Delete Widget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}