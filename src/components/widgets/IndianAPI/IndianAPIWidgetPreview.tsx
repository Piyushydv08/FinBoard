"use client";

import { useState } from "react";
import IndianAPIWidget from "./IndianAPIWidget";
import IndianAPIWidgetSelector from "./IndianAPIWidgetSelector";
import { ChevronLeft, ChevronRight, Eye, X, Loader2, AlertCircle , RefreshCw} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface IndianAPIWidgetPreviewProps {
    apiEndpoint: string;
    companyName: string;
    onClose: () => void;
    onAddWidgets: (widgets: Array<{ type: string; config: any }>) => void;
}

export default function IndianAPIWidgetPreview({ 
    apiEndpoint, 
    companyName, 
    onClose,
    onAddWidgets 
}: IndianAPIWidgetPreviewProps) {
    const [step, setStep] = useState<"select" | "preview">("select");
    const [selectedWidgets, setSelectedWidgets] = useState<Record<string, any>>({});
    const [currentPreview, setCurrentPreview] = useState<string | null>(null);

    // Fetch API data once for all widgets
    const { data: apiData, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["indianapi-preview", apiEndpoint],
        queryFn: async () => {
            let apiKeyValue = "";
            let fetchUrl = apiEndpoint;

            // Try to extract API key from URL
            try {
                const urlObj = new URL(fetchUrl);
                const urlKey = urlObj.searchParams.get('apikey') || urlObj.searchParams.get('api_key') || urlObj.searchParams.get('key');
                if (urlKey) apiKeyValue = urlKey;
            } catch (e) {
                const match = fetchUrl.match(/[?&](?:apikey|api_key|key)=([^&]+)/);
                if (match) apiKeyValue = match[1];
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (apiKeyValue) {
                headers['X-Api-Key'] = apiKeyValue;
            }

            // Clean the URL
            try {
                const urlObj = new URL(fetchUrl);
                urlObj.searchParams.delete('apikey');
                urlObj.searchParams.delete('api_key');
                urlObj.searchParams.delete('key');
                fetchUrl = urlObj.toString();
            } catch (e) {
                fetchUrl = fetchUrl.replace(/[?&](apikey|api_key|key)=[^&]+/, '');
            }

            const res = await fetch(fetchUrl, { 
                headers,
                method: 'GET'
            });
            
            const responseText = await res.text();
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${responseText || 'Unknown error'}`);
            }
            
            return JSON.parse(responseText);
        },
        refetchInterval: 300 * 1000,
    });

    const handleWidgetSelect = (widgetId: string, config: any) => {
        setSelectedWidgets(prev => ({
            ...prev,
            [widgetId]: config
        }));
    };

    const handlePreview = (widgetId: string) => {
        setCurrentPreview(widgetId);
        setStep("preview");
    };

    const handleAddWidgets = () => {
        const widgets = Object.values(selectedWidgets).map((config) => ({
            type: config.widgetType,
            config
        }));
        onAddWidgets(widgets);
        onClose();
    };

    const widgetOptions = [
        { id: "price-card", type: "priceCard", title: "Live Price Card" },
        { id: "financial-metrics", type: "financialMetrics", title: "Financial Metrics" },
        { id: "technical-chart", type: "technicalChart", title: "Technical Analysis" },
        { id: "peer-comparison", type: "peerComparison", title: "Peer Comparison" },
        { id: "company-profile", type: "companyProfile", title: "Company Profile" },
        { id: "news-feed", type: "newsFeed", title: "News Feed" },
        { id: "risk-meter", type: "riskMeter", title: "Risk Assessment" },
        { id: "shareholding", type: "shareholding", title: "Shareholding Pattern" }
    ];

    // Loading state
    if (step === "preview" && isLoading) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card rounded-lg border shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
                        <div>
                            <h2 className="text-lg font-semibold">Widget Preview</h2>
                            <p className="text-sm text-muted-foreground">Loading data...</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (step === "preview" && error) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-card rounded-lg border shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
                        <div>
                            <h2 className="text-lg font-semibold">Widget Preview</h2>
                            <p className="text-sm text-muted-foreground">Error loading data</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <p className="text-sm font-medium text-destructive mb-2">Unable to load data</p>
                        <p className="text-sm text-muted-foreground text-center mb-4">{error.message}</p>
                        <button onClick={() => refetch()} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded hover:bg-primary/90">
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-lg border shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
                    <div className="flex items-center gap-4">
                        {step === "preview" && (
                            <button
                                onClick={() => setStep("select")}
                                className="p-1 hover:bg-muted rounded"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold">
                                {step === "select" ? `Add Widgets for ${companyName}` : "Widget Preview"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {step === "select" 
                                    ? "Select the widgets you want to add to your dashboard"
                                    : `Previewing: ${currentPreview ? widgetOptions.find(w => w.id === currentPreview)?.title : 'Widget'}`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {step === "select" ? (
                        <div className="max-w-4xl mx-auto">
                            <IndianAPIWidgetSelector
                                onSelect={handleWidgetSelect}
                                selectedWidgets={Object.keys(selectedWidgets)}
                                companyName={companyName}
                            />
                            
                            {/* Selected Widgets Preview */}
                            {Object.keys(selectedWidgets).length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-sm font-semibold mb-4">Selected Widgets Preview</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(selectedWidgets).map(([widgetId, config]) => {
                                            const widget = widgetOptions.find(w => w.id === widgetId);
                                            return (
                                                <div 
                                                    key={widgetId}
                                                    className="border rounded-lg p-4 hover:border-primary/50 cursor-pointer transition-colors group"
                                                    onClick={() => handlePreview(widgetId)}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-primary/10 rounded">
                                                                {widget?.title.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {widget?.title}
                                                            </span>
                                                        </div>
                                                        <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="h-32 bg-muted/20 rounded border border-dashed flex items-center justify-center">
                                                        <div className="text-center">
                                                            <div className="text-xs font-medium mb-1">
                                                                {config.widgetType.replace(/([A-Z])/g, ' $1').trim()}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground">
                                                                Click to preview
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            {currentPreview && apiData && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {widgetOptions.find(w => w.id === currentPreview)?.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Preview how this widget will look on your dashboard
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => refetch()} 
                                                className={cn(
                                                    "text-muted-foreground hover:text-primary transition-all", 
                                                    isRefetching ? "animate-spin" : ""
                                                )}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                            <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-600 rounded">
                                                IndianAPI
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Widget Preview */}
                                    <div className="h-96 border rounded-lg overflow-hidden">
                                        <IndianAPIWidget
                                            widget={{
                                                id: "preview",
                                                title: widgetOptions.find(w => w.id === currentPreview)?.title,
                                                type: "card",
                                                apiEndpoint,
                                                refreshInterval: 300,
                                                dataMapping: {},
                                                config: selectedWidgets[currentPreview] || {}
                                            }}
                                            widgetType={selectedWidgets[currentPreview]?.widgetType}
                                            data={apiData} // Pass the pre-fetched data
                                            className="h-full"
                                        />
                                    </div>
                                    
                                    {/* Widget Description */}
                                    <div className="p-4 bg-muted/20 rounded-lg">
                                        <h4 className="text-sm font-semibold mb-2">About This Widget</h4>
                                        <p className="text-sm text-muted-foreground">
                                            This widget displays {selectedWidgets[currentPreview]?.widgetType.replace(/([A-Z])/g, ' $1').toLowerCase()} 
                                            data for {companyName}. It will automatically refresh every 5 minutes with the latest data from IndianAPI.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 bg-muted/40">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {step === "select" 
                                ? `${Object.keys(selectedWidgets).length} widget${Object.keys(selectedWidgets).length !== 1 ? 's' : ''} selected`
                                : "Preview mode"
                            }
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            {step === "select" ? (
                                <button
                                    onClick={handleAddWidgets}
                                    disabled={Object.keys(selectedWidgets).length === 0}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium text-white rounded transition-colors",
                                        Object.keys(selectedWidgets).length === 0
                                            ? "bg-muted cursor-not-allowed"
                                            : "bg-primary hover:bg-primary/90"
                                    )}
                                >
                                    Add {Object.keys(selectedWidgets).length} Widget{Object.keys(selectedWidgets).length !== 1 ? 's' : ''}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setStep("select")}
                                    className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4 inline mr-1" />
                                    Back to Selection
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
