"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle, DollarSign, Percent, ArrowUpRight, ArrowDownRight, BarChart3, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getApiKeys } from "@/lib/firestore/apiKeys";
import { buildRequest } from "@/lib/api-utils";
import { useState } from "react";

interface FinnhubWidgetProps {
    widget: any;
    className?: string;
}

interface StockData {
    c: number;      // Current price
    d: number;      // Change
    dp: number;     // Percent change
    h: number;      // High price of the day
    l: number;      // Low price of the day
    o: number;      // Open price of the day
    pc: number;     // Previous close price
}

export default function FinnhubWidget({ widget, className }: FinnhubWidgetProps) {
    const { user } = useAuth();
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    
    // Parse symbol from API endpoint
    const getSymbolFromUrl = (url: string) => {
        const symbolMatch = url.match(/symbol=([^&]+)/);
        return symbolMatch ? symbolMatch[1] : "Unknown";
    };

    // Fetch API keys
    const { data: keys } = useQuery({
        queryKey: ["apiKeys", user?.uid],
        queryFn: async () => user ? getApiKeys(user.uid) : [],
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch widget data
    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["widget", widget.id, "finnhub"],
        queryFn: async () => {
            if (!widget.apiEndpoint) return null;

            // Find the key if one is assigned
            const apiKey = keys?.find(k => k.id === widget.selectedApiKeyId);
            
            // Build the request using the shared helper
            const { url, headers } = buildRequest(widget.apiEndpoint, apiKey);

            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error("Failed to fetch stock data");
            
            const result = await res.json();
            
            // Check for Finnhub error messages
            if (result.error) {
                throw new Error(result.error);
            }
            
            setLastRefreshed(new Date());
            return result as StockData;
        },
        enabled: !!keys || !widget.selectedApiKeyId,
        refetchInterval: (widget.refreshInterval || 60) * 1000,
    });

    const symbol = getSymbolFromUrl(widget.apiEndpoint);
    const stockData = data;
    const isPositive = stockData?.dp && stockData.dp >= 0;

    if (isLoading && !stockData) {
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
                <p className="text-xs text-center font-medium">Unable to load stock data</p>
                <p className="text-xs text-center text-muted-foreground mt-1">{error.message}</p>
                <button onClick={() => refetch()} className="mt-2 text-xs underline hover:text-destructive/80">
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!stockData) {
        return (
            <div className={cn("flex h-full w-full items-center justify-center bg-card p-4 rounded-lg border", className)}>
                <p className="text-sm text-muted-foreground">No data available</p>
            </div>
        );
    }

    return (
        <div className={cn("flex h-full w-full flex-col bg-card p-4 rounded-lg border shadow-sm relative group hover:shadow-md transition-shadow", className)}>
            {/* Header with Symbol and Refresh */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${symbol} Stock`}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold">{symbol}</span>
                        {stockData.dp && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs px-2 py-1 rounded",
                                isPositive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                            )}>
                                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {stockData.dp >= 0 ? '+' : ''}{stockData.dp.toFixed(2)}%
                            </div>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => refetch()} 
                    className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
                >
                    <RefreshCw className="h-3 w-3" />
                </button>
            </div>

            {/* Current Price Section */}
            <div className="mb-6 text-center">
                <div className="text-3xl font-bold tracking-tight">
                    ${stockData.c.toFixed(2)}
                </div>
                <div className={cn("text-sm font-medium mt-1 flex items-center justify-center gap-1", 
                    isPositive ? "text-green-500" : "text-red-500"
                )}>
                    {stockData.d >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {stockData.d >= 0 ? '+' : ''}${Math.abs(stockData.d).toFixed(2)}
                </div>
            </div>

            {/* Stock Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Open Price */}
                <div className="bg-muted/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-blue-500/10 rounded">
                            <LineChart className="h-3 w-3 text-blue-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Open</span>
                    </div>
                    <div className="text-lg font-semibold">${stockData.o.toFixed(2)}</div>
                </div>

                {/* High Price */}
                <div className="bg-muted/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-green-500/10 rounded">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">High</span>
                    </div>
                    <div className="text-lg font-semibold">${stockData.h.toFixed(2)}</div>
                </div>

                {/* Low Price */}
                <div className="bg-muted/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-red-500/10 rounded">
                            <TrendingDown className="h-3 w-3 text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Low</span>
                    </div>
                    <div className="text-lg font-semibold">${stockData.l.toFixed(2)}</div>
                </div>

                {/* Previous Close */}
                <div className="bg-muted/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1 bg-purple-500/10 rounded">
                            <BarChart3 className="h-3 w-3 text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Prev Close</span>
                    </div>
                    <div className="text-lg font-semibold">${stockData.pc.toFixed(2)}</div>
                </div>
            </div>

            {/* Price Range Visualization */}
            <div className="mt-auto">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Daily Range</span>
                    <span>${stockData.l.toFixed(2)} - ${stockData.h.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                        className={cn("h-full rounded-full", isPositive ? "bg-green-500" : "bg-red-500")}
                        style={{
                            width: `${((stockData.c - stockData.l) / (stockData.h - stockData.l)) * 100}%`
                        }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Low</span>
                    <span>Current</span>
                    <span>High</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="text-blue-500">●</span>
                        <span>Finnhub</span>
                    </span>
                    <span>
                        {lastRefreshed ? `Updated: ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Never refreshed'}
                    </span>
                </div>
            </div>
        </div>
    );
}