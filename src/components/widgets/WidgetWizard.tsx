"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiKeys, type ApiKey } from "@/lib/firestore/apiKeys";
import { type WidgetConfig } from "@/lib/firestore/dashboard";

import { buildRequest } from "@/lib/api-utils"; // Import the helper
import JsonExplorer from "./JsonExplorer";
import { Loader2, ArrowRight, ArrowLeft, Save, Play, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import AlphaVantageWidget from "./AlphaVantage/AlphaVantageWidget";
import FinnhubWidget from "./Finnhub/FinnhubWidget";
import IndianAPIWidget from "./IndianAPI/IndianAPIWidget";
import IndianAPIWidgetPreview from "./IndianAPI/IndianAPIWidgetPreview";

interface WidgetWizardProps {
    onSave: (widget: WidgetConfig) => void;
    onCancel: () => void;
}

const defaultEndpoints: Record<string, string> = {
    "Alpha Vantage": "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=YOUR_API_KEY",
    Finnhub: "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_API_KEY",
    IndianAPI: "https://stock.indianapi.in/stock?name=Tata Steel",
    CoinGecko: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
    // Add more providers as needed
};

export default function WidgetWizard({ onSave, onCancel }: WidgetWizardProps) {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [keys, setKeys] = useState<ApiKey[]>([]);

    // Step 1: Source
    const [title, setTitle] = useState("New Widget");
    const [selectedKeyId, setSelectedKeyId] = useState("");
    const [apiEndpoint, setApiEndpoint] = useState("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");

    // Parameters for dynamic endpoints
    const [alphaFunction, setAlphaFunction] = useState("TIME_SERIES_DAILY");
    const [alphaSymbol, setAlphaSymbol] = useState("IBM");
    const [finnhubSymbol, setFinnhubSymbol] = useState("AAPL");
    const [indianName, setIndianName] = useState("Tata Steel");

    // Step 2: Data
    const [fetchedData, setFetchedData] = useState<any>(null);
    const [fetchError, setFetchError] = useState("");
    
    // Helper state to know which field we are currently mapping
    const [activeMappingField, setActiveMappingField] = useState<"primary" | "secondary" | "series" | null>(null);

    // Step 3: Config
    const [type, setType] = useState<"card" | "chart" | "table">("card");
    const [refreshInterval, setRefreshInterval] = useState(60);
    const [mapping, setMapping] = useState<Record<string, string>>({});

    // New state for Alpha Vantage preview
    const [isAlphaVantagePreview, setIsAlphaVantagePreview] = useState(false);

    // New state for Finnhub preview
    const [isFinnhubPreview, setIsFinnhubPreview] = useState(false);

    // New state for IndianAPI preview
    const [isIndianAPIPreview, setIsIndianAPIPreview] = useState(false);
    const [indianAPIWidgets, setIndianAPIWidgets] = useState<Array<{ type: string; config: any }>>([]);

    useEffect(() => {
        if (user) {
            getApiKeys(user.uid).then(setKeys);
        }
    }, [user]);

    useEffect(() => {
        if (selectedKeyId) {
            const selectedKey = keys.find(k => k.id === selectedKeyId);
            if (selectedKey) {
                const apiKey = selectedKey.key || process.env[`${selectedKey.provider.toUpperCase()}_API_KEY`] || 'YOUR_API_KEY';
                if (selectedKey.provider === "Alpha Vantage") {
                    setAlphaFunction("TIME_SERIES_DAILY");
                    setAlphaSymbol("IBM");
                    setApiEndpoint(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=${apiKey}`);
                } else if (selectedKey.provider === "Finnhub") {
                    setFinnhubSymbol("AAPL");
                    setApiEndpoint(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`);
                } else if (selectedKey.provider === "IndianAPI") {
                    setIndianName("Tata Steel");
                    const endpoint = `https://stock.indianapi.in/stock?name=Tata Steel`;
                    if (apiKey && apiKey !== 'YOUR_API_KEY') {
                        setApiEndpoint(`${endpoint}&apikey=${apiKey}`);
                    } else {
                        setApiEndpoint(endpoint);
                    }
                } else {
                    const providerKey = Object.keys(defaultEndpoints).find(key => key.toLowerCase() === selectedKey.provider.toLowerCase());
                    if (providerKey) {
                        let endpoint = defaultEndpoints[providerKey];
                        if (apiKey && apiKey !== 'YOUR_API_KEY') {
                            endpoint = endpoint.replace('YOUR_API_KEY', apiKey);
                        }
                        setApiEndpoint(endpoint);
                    }
                }
            }
        } else {
            setApiEndpoint("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true");
        }
    }, [selectedKeyId, keys]);

    useEffect(() => {
        if (selectedKeyId) {
            const selectedKey = keys.find(k => k.id === selectedKeyId);
            if (selectedKey) {
                const apiKey = selectedKey.key || process.env[`${selectedKey.provider.toUpperCase()}_API_KEY`] || 'YOUR_API_KEY';
                if (selectedKey.provider === "Alpha Vantage") {
                    setApiEndpoint(`https://www.alphavantage.co/query?function=${alphaFunction}&symbol=${alphaSymbol}&apikey=${apiKey}`);
                } else if (selectedKey.provider === "Finnhub") {
                    setApiEndpoint(`https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${apiKey}`);
                } else if (selectedKey.provider === "IndianAPI") {
                    const endpoint = `https://stock.indianapi.in/stock?name=${indianName}`;
                    if (apiKey && apiKey !== 'YOUR_API_KEY') {
                        setApiEndpoint(`${endpoint}&apikey=${apiKey}`);
                    } else {
                        setApiEndpoint(endpoint);
                    }
                }
            }
        }
    }, [selectedKeyId, keys, alphaFunction, alphaSymbol, finnhubSymbol, indianName]);

    const handleFetch = async () => {
        setLoading(true);
        setFetchError("");
        try {
            const keyObj = keys.find(k => k.id === selectedKeyId);
            
            // Use the shared helper to construct the URL and Headers
            const { url, headers } = buildRequest(apiEndpoint, keyObj);

            let fetchHeaders = headers;
            if (selectedKey && selectedKey.provider === "Finnhub") {
                fetchHeaders = { ...headers };
                delete fetchHeaders['Content-Type'];
            }
            if (selectedKey && selectedKey.provider === "IndianAPI") {
                const apiKey = selectedKey.key || process.env.INDIANAPI_API_KEY || '';
                fetchHeaders = { ...headers, 'X-Api-Key': apiKey };
            }

            const res = await fetch(url, { headers: fetchHeaders });
            
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Status: ${res.status} - ${text.slice(0, 100)}`);
            }
            
            const json = await res.json();
            setFetchedData(json);
            
            if (selectedKey?.provider === "Alpha Vantage") {
                // For Alpha Vantage, set default mappings and go to preview
                setMapping({
                    primary: "Time Series (Daily)[Object.keys(data['Time Series (Daily)'])[0]].4. close",
                    secondary: "Time Series (Daily)[Object.keys(data['Time Series (Daily)'])[0]].9. change",
                    series: "Time Series (Daily)"
                });
                setType("chart");
                setIsAlphaVantagePreview(true);
                setStep(2); // Use step 2 for preview
            } else if (selectedKey?.provider === "Finnhub") {
                // For Finnhub, set default mappings and go to preview
                setMapping({
                    primary: "c", // Current price
                    secondary: "dp", // Percent change
                });
                setType("card");
                setIsFinnhubPreview(true);
                setStep(2); // Use step 2 for preview
            } else if (selectedKey?.provider === "IndianAPI") {
                // For IndianAPI, show widget selector
                setIndianAPIWidgets([]);
                setIsIndianAPIPreview(true);
                setStep(2);
            } else {
                setStep(2);
            }
        } catch (err: any) {
            setFetchError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        const newWidget: WidgetConfig = {
            id: uuidv4(),
            title,
            type,
            apiEndpoint,
            selectedApiKeyId: selectedKeyId,
            refreshInterval,
            dataMapping: mapping,
        };
        onSave(newWidget);
    };

    const handleIndianAPIWidgetsSelect = async (widgets: Array<{ type: string; config: any }>) => {
    setIndianAPIWidgets(widgets);
    setIsIndianAPIPreview(false);
    
    try {
        // Create and save all widgets
        const savePromises = widgets.map((widgetConfig) => {
            const widgetId = uuidv4();
            const widgetTitle = `${indianName} - ${widgetConfig.config.title}`;
            
            // Create proper IndianAPI widget with specific configuration
            const newWidget: WidgetConfig = {
                id: widgetId,
                title: widgetTitle,
                type: "card", // Set as a special type
                apiEndpoint: apiEndpoint,
                selectedApiKeyId: selectedKeyId,
                refreshInterval: refreshInterval,
                dataMapping: {
                    // Store IndianAPI specific configuration
                    indianAPIWidgetType: widgetConfig.type, // priceCard, financialMetrics, etc.
                    indianAPIConfig: widgetConfig.config,
                    companyName: indianName,
                },
            };
            
            return onSave(newWidget);
        });
        
        await Promise.all(savePromises);
        onCancel();
    } catch (error) {
        console.error("Failed to save widgets:", error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        setFetchError(`Failed to save widgets: ${message}`);
    }
};


    const handlePathSelect = (path: string) => {
        if (activeMappingField) {
            setMapping(prev => ({ ...prev, [activeMappingField]: path }));
            setActiveMappingField(null); // Deselect after assignment
        }
    };

    const selectedKey = keys.find(k => k.id === selectedKeyId);

    return (
        <div className="flex flex-col h-full bg-card rounded-lg border shadow-lg overflow-hidden max-w-4xl w-full mx-auto my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/40">
                <h2 className="text-lg font-semibold">Create New Widget</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Step {step} of {(isAlphaVantagePreview || isFinnhubPreview || isIndianAPIPreview) ? 2 : 3}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {step === 1 && (
                    <div className="space-y-4 max-w-lg mx-auto">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Widget Title</label>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Bitcoin Price"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Endpoint</label>
                            <div className="flex gap-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                                    value={apiEndpoint}
                                    onChange={e => setApiEndpoint(e.target.value)}
                                    disabled={!!selectedKeyId}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Supported: AlphaVantage, Finnhub, IndianAPI, etc.
                            </p>
                        </div>
                        {selectedKey && selectedKey.provider === "Alpha Vantage" && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-sm font-medium">Function</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={alphaFunction}
                                            onChange={e => setAlphaFunction(e.target.value)}
                                            placeholder="e.g. TIME_SERIES_DAILY"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Symbol</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={alphaSymbol}
                                            onChange={e => setAlphaSymbol(e.target.value)}
                                            placeholder="e.g. IBM"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {selectedKey && selectedKey.provider === "Finnhub" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Symbol</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={finnhubSymbol}
                                    onChange={e => setFinnhubSymbol(e.target.value)}
                                    placeholder="e.g. AAPL"
                                />
                            </div>
                        )}
                        {selectedKey && selectedKey.provider === "IndianAPI" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={indianName}
                                    onChange={e => setIndianName(e.target.value)}
                                    placeholder="e.g. Tata Steel"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Use Saved Key</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedKeyId}
                                onChange={e => setSelectedKeyId(e.target.value)}
                            >
                                <option value="">No API Key (Public API)</option>
                                {keys.map(k => (
                                    <option key={k.id} value={k.id}>{k.label} ({k.provider})</option>
                                ))}
                            </select>
                        </div>

                        {fetchError && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/20">
                                <strong>Connection Failed:</strong> {fetchError}
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && isAlphaVantagePreview && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-4">Preview: {title}</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                This widget will display a chart for {alphaSymbol} using Alpha Vantage data.
                            </p>
                        </div>
                        <div className="rounded-lg border p-4 bg-card shadow-sm">
                            <h4 className="text-xs font-semibold mb-3 uppercase text-muted-foreground tracking-wider">Chart Preview</h4>
                            <div className="p-6 bg-muted/10 rounded border border-dashed flex items-center justify-center min-h-64">
                                {/* Render the AlphaVantageWidget with fetched data */}
                                <AlphaVantageWidget 
                                    widget={{
                                        id: 'preview',
                                        title,
                                        type: 'chart',
                                        apiEndpoint,
                                        selectedApiKeyId: selectedKeyId,
                                        refreshInterval,
                                        dataMapping: mapping
                                    }}
                                    symbol={alphaSymbol}
                                    lastRefreshed={fetchedData?.['Meta Data']?.['Last Refreshed']}
                                    seriesData={fetchedData?.['Time Series (Daily)']}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && isFinnhubPreview && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-4">Preview: {title}</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                This widget will display stock data for {finnhubSymbol} using Finnhub data.
                            </p>
                        </div>
                        <div className="rounded-lg border p-4 bg-card shadow-sm">
                            <h4 className="text-xs font-semibold mb-3 uppercase text-muted-foreground tracking-wider">Stock Data Preview</h4>
                            <div className="p-6 bg-muted/10 rounded border border-dashed flex items-center justify-center min-h-64">
                                {/* Render the FinnhubWidget with fetched data */}
                                <FinnhubWidget 
                                    widget={{
                                        id: 'preview',
                                        title,
                                        type: 'card',
                                        apiEndpoint,
                                        selectedApiKeyId: selectedKeyId,
                                        refreshInterval,
                                        dataMapping: mapping
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && isIndianAPIPreview && (
                    <IndianAPIWidgetPreview
                        apiEndpoint={apiEndpoint}
                        companyName={indianName}
                        onClose={() => {
                            setIsIndianAPIPreview(false);
                            setStep(1);
                        }}
                        onAddWidgets={handleIndianAPIWidgetsSelect}
                    />
                )}

                {step === 2 && !isAlphaVantagePreview && !isFinnhubPreview && !isIndianAPIPreview && (
                    <div className="flex flex-col h-full gap-4">
                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-700 dark:text-blue-300">
                             <span>Select a mapping field on the right, then click a value in the JSON explorer on the left.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-100">
                            {/* JSON Explorer Column */}
                            <div className="border rounded-lg overflow-hidden flex flex-col shadow-sm">
                                <div className="bg-muted/50 px-3 py-2 text-xs font-semibold border-b flex justify-between">
                                    <span>API Response</span>
                                    {activeMappingField && (
                                        <span className="text-primary animate-pulse">
                                            Select value for {activeMappingField}...
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950/50">
                                    <JsonExplorer
                                        data={fetchedData}
                                        onSelectPath={handlePathSelect}
                                        selectedPath={activeMappingField ? undefined : mapping[activeMappingField!]} 
                                    />
                                </div>
                            </div>

                            {/* Mapping Controls Column */}
                            <div className="space-y-6 p-1">
                                <div 
                                    className={cn(
                                        "p-4 rounded-lg border transition-all cursor-pointer",
                                        activeMappingField === "primary" ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50"
                                    )}
                                    onClick={() => setActiveMappingField("primary")}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold">Primary Data</label>
                                        {mapping.primary && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        The main number or text to display (e.g. Stock Price).
                                    </p>
                                    <div className="h-8 bg-background border rounded px-2 flex items-center text-xs font-mono text-muted-foreground">
                                        {mapping.primary || "Click here to select..."}
                                    </div>
                                </div>

                                <div 
                                    className={cn(
                                        "p-4 rounded-lg border transition-all cursor-pointer",
                                        activeMappingField === "secondary" ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50"
                                    )}
                                    onClick={() => setActiveMappingField("secondary")}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold">Secondary Data (Optional)</label>
                                        {mapping.secondary && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        A change percentage or subtitle (e.g. +2.4%).
                                    </p>
                                    <div className="h-8 bg-background border rounded px-2 flex items-center text-xs font-mono text-muted-foreground">
                                        {mapping.secondary || "Click here to select..."}
                                    </div>
                                </div>

                                <div 
                                    className={cn(
                                        "p-4 rounded-lg border transition-all cursor-pointer",
                                        activeMappingField === "series" ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/50"
                                    )}
                                    onClick={() => setActiveMappingField("series")}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold">Series Data (for Chart/Table)</label>
                                        {mapping.series && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        The path to the time series object for chart or table visualization (e.g. Time Series (Daily)).
                                    </p>
                                    <div className="h-8 bg-background border rounded px-2 flex items-center text-xs font-mono text-muted-foreground">
                                        {mapping.series || "Click here to select..."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 max-w-lg mx-auto">
                        <div className="grid grid-cols-3 gap-4">
                            {(["card", "chart", "table"] as const).map(t => (
                                <div
                                    key={t}
                                    className={cn(
                                        "cursor-pointer rounded-lg border-2 p-4 text-center hover:border-primary/50 capitalize transition-all",
                                        type === t ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-muted/50"
                                    )}
                                    onClick={() => setType(t)}
                                >
                                    {t}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Refresh Interval (seconds)</label>
                            <input
                                type="number"
                                min="10"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={refreshInterval}
                                onChange={e => setRefreshInterval(Number(e.target.value))}
                            />
                        </div>

                        <div className="rounded-lg border p-4 bg-card shadow-sm">
                            <h4 className="text-xs font-semibold mb-3 uppercase text-muted-foreground tracking-wider">Preview</h4>
                            <div className="p-6 bg-muted/10 rounded border border-dashed flex items-center justify-center min-h-30">
                                {type === "card" && (
                                    <div className="text-center">
                                         {/* Mock display based on mapping existence */}
                                        <div className="text-3xl font-bold tracking-tight">
                                            {mapping.primary ? "1,234.56" : "--"}
                                        </div>
                                        {mapping.secondary && (
                                            <div className="text-sm font-medium text-green-500 mt-1">
                                                +5.23%
                                            </div>
                                        )}
                                    </div>
                                )}
                                {type === "chart" && (
                                    <div className="text-center">
                                        {mapping.series ? "Line Chart Visualization" : "Select series data for chart"}
                                    </div>
                                )}
                                {type === "table" && (
                                    <div className="text-center">
                                        {mapping.series ? "Table Visualization" : "Select series data for table"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-6 py-4 bg-muted/40">
                <button onClick={onCancel} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Cancel
                </button>

                <div className="flex gap-2">
                    {step > 1 && !(isAlphaVantagePreview || isFinnhubPreview || isIndianAPIPreview) && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </button>
                    )}

                    {step < 3 && !(isAlphaVantagePreview || isFinnhubPreview || isIndianAPIPreview) ? (
                        <button
                            onClick={() => step === 1 ? handleFetch() : setStep(step + 1)}
                            disabled={loading || (step === 2 && !mapping.primary)}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <>Next <ArrowRight className="ml-2 h-4 w-4" /></>}
                        </button>
                    ) : (isAlphaVantagePreview || isFinnhubPreview || isIndianAPIPreview) && step === 2 ? (
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                            <Save className="mr-2 h-4 w-4" /> Finish Widget
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                            <Save className="mr-2 h-4 w-4" /> Finish Widget
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
