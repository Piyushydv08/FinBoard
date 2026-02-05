"use client";

import { useState } from "react";
import { LineChart, BarChart, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlphaVantageStepProps {
    symbol: string;
    stockData: any[];
    priceInfo: any;
    onConfigure: (config: any) => void;
    currentConfig: any;
}

export default function AlphaVantageStep({
    symbol,
    stockData,
    priceInfo,
    onConfigure,
    currentConfig
}: AlphaVantageStepProps) {
    const [chartType, setChartType] = useState<"line" | "candle" | "area">("line");
    const [showVolume, setShowVolume] = useState(true);
    const [timeRange, setTimeRange] = useState<"5d" | "10d" | "1m">("10d");

    const handleConfigUpdate = () => {
        onConfigure({
            chartType,
            showVolume,
            timeRange,
            widgetType: "alphavantage"
        });
    };

    return (
        <div className="space-y-6">
            {/* Current Price Summary */}
            {priceInfo && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold">{symbol}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl font-bold">${priceInfo.price.toFixed(2)}</span>
                                <div className={cn(
                                    "flex items-center gap-1 text-sm px-2 py-1 rounded",
                                    priceInfo.change >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                )}>
                                    {priceInfo.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {priceInfo.change >= 0 ? '+' : ''}{priceInfo.change.toFixed(2)} ({priceInfo.changePercent.toFixed(2)}%)
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Last: {new Date(priceInfo.date).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chart Type */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Chart Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => { setChartType("line"); handleConfigUpdate(); }}
                            className={cn(
                                "p-3 rounded-lg border text-center hover:border-primary/50 transition-all",
                                chartType === "line" ? "border-primary bg-primary/5" : "border-input"
                            )}
                        >
                            <LineChart className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">Line</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setChartType("area"); handleConfigUpdate(); }}
                            className={cn(
                                "p-3 rounded-lg border text-center hover:border-primary/50 transition-all",
                                chartType === "area" ? "border-primary bg-primary/5" : "border-input"
                            )}
                        >
                            <TrendingUp className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">Area</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setChartType("candle"); handleConfigUpdate(); }}
                            className={cn(
                                "p-3 rounded-lg border text-center hover:border-primary/50 transition-all",
                                chartType === "candle" ? "border-primary bg-primary/5" : "border-input"
                            )}
                        >
                            <BarChart className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">Candle</span>
                        </button>
                    </div>
                </div>

                {/* Time Range */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Time Range</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => { setTimeRange("5d"); handleConfigUpdate(); }}
                            className={cn(
                                "p-3 rounded-lg border text-center hover:border-primary/50 transition-all",
                                timeRange === "5d" ? "border-primary bg-primary/5" : "border-input"
                            )}
                        >
                            <Calendar className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">5 Days</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTimeRange("10d"); handleConfigUpdate(); }}
                            className={cn(
                                "p-3 rounded-lg border text-center hover:border-primary/50 transition-all",
                                timeRange === "10d" ? "border-primary bg-primary/5" : "border-input"
                            )}
                        >
                            <Calendar className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">10 Days</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setTimeRange("1m"); handleConfigUpdate(); }}
                            className={cn(
                                "p-3 rounded-lg border text-center hover:border-primary/50 transition-all",
                                timeRange === "1m" ? "border-primary bg-primary/5" : "border-input"
                            )}
                        >
                            <Calendar className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">1 Month</span>
                        </button>
                    </div>
                </div>

                {/* Toggle Options */}
                <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showVolume"
                                checked={showVolume}
                                onChange={(e) => { setShowVolume(e.target.checked); handleConfigUpdate(); }}
                                className="h-4 w-4 rounded border-input"
                            />
                            <label htmlFor="showVolume" className="text-sm font-medium">
                                Show Volume Chart
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showPercent"
                                checked={true}
                                readOnly
                                className="h-4 w-4 rounded border-input"
                            />
                            <label htmlFor="showPercent" className="text-sm font-medium">
                                Show Percentage Change
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border p-4">
                <h4 className="text-sm font-semibold mb-3">Preview</h4>
                <div className="h-48 bg-linear-to-b from-muted/10 to-muted/5 rounded border border-dashed flex flex-col items-center justify-center">
                    <div className="text-center">
                        <div className="text-lg font-bold mb-2">{symbol} Stock Widget</div>
                        <div className="text-sm text-muted-foreground">
                            {chartType === "line" && "Line Chart with OHLC data"}
                            {chartType === "area" && "Area Chart with price trends"}
                            {chartType === "candle" && "Candlestick Chart"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            {showVolume && "✓ Volume chart included"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}