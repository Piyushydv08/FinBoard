"use client";

import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getApiKeys } from "@/lib/firestore/apiKeys";
import { buildRequest } from "@/lib/api-utils";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface AlphaVantageWidgetProps {
    widget: any;
    className?: string;
    symbol: string;
    lastRefreshed: string;
    seriesData: any;
}

interface StockDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export default function AlphaVantageWidget({ widget, className }: AlphaVantageWidgetProps) {
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

    // Process Alpha Vantage data
    const processStockData = (data: any): StockDataPoint[] => {
        if (!data || !data["Time Series (Daily)"]) return [];
        
        const timeSeries = data["Time Series (Daily)"];
        const metaData = data["Meta Data"] || {};
        
        // Convert to array and sort by date (newest first)
        const dataPoints = Object.entries(timeSeries)
            .slice(0, 10) // Last 10 days
            .map(([date, values]: [string, any]) => ({
                date: format(new Date(date), 'MMM dd'),
                fullDate: date,
                open: parseFloat(values["1. open"]),
                high: parseFloat(values["2. high"]),
                low: parseFloat(values["3. low"]),
                close: parseFloat(values["4. close"]),
                volume: parseFloat(values["5. volume"]),
            }))
            .reverse(); // Reverse to show oldest to newest
        
        return dataPoints;
    };

    // Calculate current price and change
    const calculateCurrentPrice = (data: any) => {
        if (!data || !data["Time Series (Daily)"]) return null;
        
        const timeSeries = data["Time Series (Daily)"];
        const dates = Object.keys(timeSeries).sort().reverse();
        if (dates.length === 0) return null;
        
        const latestDate = dates[0];
        const latestData = timeSeries[latestDate];
        const previousDate = dates[1];
        const previousData = timeSeries[previousDate];
        
        if (!latestData || !previousData) return null;
        
        const currentPrice = parseFloat(latestData["4. close"]);
        const previousPrice = parseFloat(previousData["4. close"]);
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;
        
        return {
            price: currentPrice,
            change,
            changePercent,
            date: latestDate
        };
    };

    // Fetch widget data
    const { data, isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ["widget", widget.id],
        queryFn: async () => {
            if (!widget.apiEndpoint) return null;

            // Find the key if one is assigned
            const apiKey = keys?.find(k => k.id === widget.selectedApiKeyId);
            
            // Build the request using the shared helper
            const { url, headers } = buildRequest(widget.apiEndpoint, apiKey);

            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error("Failed to fetch stock data");
            
            const result = await res.json();
            // Check for Alpha Vantage error messages
            if (result["Error Message"]) {
                throw new Error(result["Error Message"]);
            }
            if (result["Note"]) {
                throw new Error("API rate limit exceeded. Please try again later.");
            }
            
            setLastRefreshed(new Date());
            return result;
        },
        enabled: !!keys || !widget.selectedApiKeyId,
        refetchInterval: (widget.refreshInterval || 60) * 1000,
    });

    // Process data
    const stockData = data ? processStockData(data) : [];
    const priceInfo = data ? calculateCurrentPrice(data) : null;
    const symbol = getSymbolFromUrl(widget.apiEndpoint);

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
                <p className="text-xs text-center font-medium">Unable to load stock data</p>
                <p className="text-xs text-center text-muted-foreground mt-1">{error.message}</p>
                <button onClick={() => refetch()} className="mt-2 text-xs underline hover:text-destructive/80">
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className={cn("flex h-full w-full flex-col bg-card p-4 rounded-lg border shadow-sm relative group hover:shadow-md transition-shadow", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${symbol} Stock`}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold">{symbol}</span>
                        {priceInfo && (
                            <div className={cn(
                                "flex items-center gap-1 text-xs px-2 py-1 rounded",
                                priceInfo.change >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                            )}>
                                {priceInfo.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {priceInfo.change >= 0 ? '+' : ''}{priceInfo.change.toFixed(2)} ({priceInfo.changePercent.toFixed(2)}%)
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

            {/* Current Price */}
            {priceInfo && (
                <div className="mb-4">
                    <div className="text-3xl font-bold tracking-tight">
                        ${priceInfo.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Last: {format(new Date(priceInfo.date), 'MMM dd, yyyy')}
                    </div>
                </div>
            )}

            {/* Chart Area */}
            <div className="flex-1 min-h-0">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">Last 10 Days OHLC</h4>
                    <div className="flex gap-2 text-[10px]">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Open</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>High</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Close</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 min-h-0 relative">
                    <div className="absolute inset-0">
                        {stockData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stockData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                                    <XAxis 
                                        dataKey="date" 
                                        fontSize={10}
                                        tick={{ fill: 'rgb(100, 116, 139)' }}
                                    />
                                    <YAxis 
                                        fontSize={10}
                                        tickFormatter={(value) => `$${value}`}
                                        tick={{ fill: 'rgb(100, 116, 139)' }}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        contentStyle={{ fontSize: '11px' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="open" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        dot={{ r: 1 }}
                                        activeDot={{ r: 3 }}
                                        name="Open"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="high" 
                                        stroke="#10b981" 
                                        strokeWidth={2}
                                        dot={{ r: 1 }}
                                        activeDot={{ r: 3 }}
                                        name="High"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="low" 
                                        stroke="#ef4444" 
                                        strokeWidth={2}
                                        dot={{ r: 1 }}
                                        activeDot={{ r: 3 }}
                                        name="Low"
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="close" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={2}
                                        dot={{ r: 1 }}
                                        activeDot={{ r: 3 }}
                                        name="Close"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center bg-muted/10 rounded border border-dashed text-xs text-muted-foreground">
                                No stock data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Volume Chart */}
                <div className="mt-2">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1">Volume</h4>
                    <div className="flex-1 min-h-0 relative">
                        <div className="absolute inset-0">
                            {stockData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stockData}>
                                        <Bar 
                                            dataKey="volume" 
                                            fill="rgb(100, 116, 139)" 
                                            radius={[2, 2, 0, 0]}
                                        />
                                        <Tooltip 
                                            formatter={(value) => [`${Number(value).toLocaleString()}`, 'Volume']}
                                            contentStyle={{ fontSize: '10px' }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-muted/10 rounded border border-dashed text-xs text-muted-foreground">
                                    No stock data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer - Last Refreshed */}
            <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                    <span>Alpha Vantage</span>
                    <span>
                        {lastRefreshed ? `Last: ${format(lastRefreshed, 'HH:mm:ss')}` : 'Never refreshed'}
                    </span>
                </div>
            </div>
        </div>
    );
}
