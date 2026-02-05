"use client";

import { useQuery } from "@tanstack/react-query";
import { type WidgetConfig } from "@/lib/firestore/dashboard";
import { Loader2, RefreshCw, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getApiKeys } from "@/lib/firestore/apiKeys";
import { buildRequest } from "@/lib/api-utils";
import _ from "lodash";
import AlphaVantageWidget from "./AlphaVantage/AlphaVantageWidget";
import FinnhubWidget from "./Finnhub/FinnhubWidget";
import IndianAPIWidget from "./IndianAPI/IndianAPIWidget";

export default function WidgetRenderer({ widget, className, onDelete }: { widget: WidgetConfig, className?: string, onDelete?: (id: string) => void }) {
    const { user } = useAuth();

    // Fetch API keys
    const { data: keys, isLoading: keysLoading } = useQuery({
        queryKey: ["apiKeys", user?.uid],
        queryFn: async () => user ? getApiKeys(user.uid) : [],
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    });

    // Check widget type based on API endpoint or selected key
    const getWidgetType = () => {
    // Check if it's an IndianAPI widget by type or dataMapping
    if (widget.dataMapping?.indianAPIWidgetType) {
        return "indianapi";
    }
    
    // Check by API endpoint
    if (widget.apiEndpoint?.includes("alphavantage.co")) {
        return "alphavantage";
    }
    if (widget.apiEndpoint?.includes("finnhub.io")) {
        return "finnhub";
    }
    if (widget.apiEndpoint?.includes("indianapi.in")) {
        return "indianapi";
    }
    
    // Check by selected API key provider
    const selectedKey = keys?.find(k => k.id === widget.selectedApiKeyId);
    if (selectedKey) {
        if (selectedKey.provider === "Alpha Vantage") {
            return "alphavantage";
        }
        if (selectedKey.provider === "Finnhub") {
            return "finnhub";
        }
        if (selectedKey.provider === "IndianAPI") {
            return "indianapi";
        }
    }
    
    return "generic";
};

    const widgetType = getWidgetType();

    // For specialized widgets, use their components
    if (widgetType === "alphavantage") {
        // Wait for keys to load if needed
        if (keysLoading && !keys) {
            return (
                <div className={cn("flex h-full w-full items-center justify-center bg-card p-4 rounded-lg border", className)}>
                    <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
            );
        }
        
        // Extract symbol from API endpoint
        const symbolMatch = widget.apiEndpoint?.match(/symbol=([^&]+)/);
        const symbol = symbolMatch ? symbolMatch[1] : "Unknown";
        
        return (
            <AlphaVantageWidget 
                widget={widget} 
                className={className}
                symbol={symbol}
                lastRefreshed=""
                seriesData={null}
            />
        );
    }

    if (widgetType === "finnhub") {
        // Wait for keys to load if needed
        if (keysLoading && !keys) {
            return (
                <div className={cn("flex h-full w-full items-center justify-center bg-card p-4 rounded-lg border", className)}>
                    <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
            );
        }
        
        return <FinnhubWidget widget={widget} className={className} />;
    }

    if (widgetType === "indianapi") {
        // Wait for keys to load if needed
        if (keysLoading && !keys) {
            return (
                <div className={cn("flex h-full w-full items-center justify-center bg-card p-4 rounded-lg border", className)}>
                    <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                </div>
            );
        }
        
        // Check if we have an API key for IndianAPI
        const indianApiKey = keys?.find(k => k.id === widget.selectedApiKeyId && k.provider === "IndianAPI");
        
        if (!indianApiKey) {
            return (
                <div className={cn("flex h-full w-full flex-col items-center justify-center bg-card p-4 rounded-lg border text-destructive", className)}>
                    <AlertCircle className="h-6 w-6 mb-2" />
                    <p className="text-xs text-center font-medium">IndianAPI key not found</p>
                    <p className="text-xs text-center text-muted-foreground mt-1">
                        Please configure an IndianAPI key in settings
                    </p>
                </div>
            );
        }
        
        return (
            <IndianAPIWidget 
                widget={widget} 
                className={className}
                widgetType={widget.dataMapping?.indianAPIWidgetType} // Pass the specific widget type
            />
        );
    }

    // Original logic for other widgets
    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["widget", widget.id],
        queryFn: async () => {
            if (!widget.apiEndpoint) return null;

            const apiKey = keys?.find(k => k.id === widget.selectedApiKeyId);
            const { url, headers } = buildRequest(widget.apiEndpoint, apiKey);

            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error("Fetch failed");
            return res.json();
        },
        enabled: !keysLoading && (!!keys || !widget.selectedApiKeyId),
        refetchInterval: (widget.refreshInterval || 60) * 1000,
    });

    const primaryValue = data && widget.dataMapping.primary ? _.get(data, widget.dataMapping.primary) : "--";
    const secondaryValue = data && widget.dataMapping.secondary ? _.get(data, widget.dataMapping.secondary) : null;

    if (isLoading && !data) {
        return (
            <div className={cn("flex h-full w-full items-center justify-center bg-card p-4 rounded-lg border", className)}>
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("flex h-full w-full flex-col items-center justify-center bg-card p-4 rounded-lg border text-destructive", className)}>
                <AlertCircle className="h-6 w-6 mb-2" />
                <p className="text-xs text-center font-medium">Unable to load data</p>
                <button onClick={() => refetch()} className="mt-2 text-xs underline hover:text-destructive/80">Retry Connection</button>
            </div>
        );
    }

    // Updated container styling
    return (
        <div className={cn("flex h-full w-full flex-col bg-card p-4 rounded-lg border shadow-sm relative group hover:shadow-md transition-shadow", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground truncate pr-2">{widget.title}</h3>
                <button 
                    onClick={() => refetch()} 
                    className={cn("text-muted-foreground hover:text-primary transition-all p-2", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
                >
                    <RefreshCw className="h-4 w-4 md:h-3 md:w-3" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                {widget.type === "card" && (
                    <div className="text-center w-full">
                        <div className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                            {!isNaN(Number(primaryValue)) && primaryValue !== "--"
                                ? Number(primaryValue).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                : primaryValue}
                        </div>
                        {secondaryValue && (
                            <div className={cn("text-sm font-medium mt-2 md:mt-1 flex items-center justify-center gap-1",
                                !isNaN(Number(secondaryValue)) ? (Number(secondaryValue) >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground"
                            )}>
                                {!isNaN(Number(secondaryValue)) ? (Number(secondaryValue) >= 0 ? '▲' : '▼') : ''}
                                {secondaryValue}%
                            </div>
                        )}
                    </div>
                )}
                {widget.type === "chart" && (
                    <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded border border-dashed text-xs text-muted-foreground p-4">
                        Chart: {widget.dataMapping.primary || "No data mapping"}
                    </div>
                )}
                {widget.type === "table" && (
                    <div className="h-full w-full flex items-center justify-center bg-muted/10 rounded border border-dashed text-xs text-muted-foreground p-4">
                        Table: {widget.dataMapping.primary || "No data mapping"}
                    </div>
                )}
            </div>
        </div>
    );
}