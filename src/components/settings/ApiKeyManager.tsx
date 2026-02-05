"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addApiKey, deleteApiKey, getApiKeys, type ApiKey } from "@/lib/firestore/apiKeys";
import { Plus, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ApiKeyManager() {
    const { user } = useAuth();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [label, setLabel] = useState("");
    const [provider, setProvider] = useState("Custom");
    const [keyValue, setKeyValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (user) {
            fetchKeys();
        }
    }, [user]);

    const fetchKeys = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await getApiKeys(user.uid);
            setKeys(data);
        } catch (error) {
            console.error("Failed to load keys", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !label || !keyValue) return;

        try {
            setIsSubmitting(true);
            await addApiKey(user.uid, { label, provider, key: keyValue });

            // Reset form
            setLabel("");
            setKeyValue("");
            setProvider("Custom");

            // Refresh list
            await fetchKeys();
        } catch (error) {
            console.error("Failed to add key", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user || !confirm("Are you sure you want to delete this key?")) return;
        try {
            await deleteApiKey(user.uid, id);
            setKeys(keys.filter(k => k.id !== id));
        } catch (error) {
            console.error("Failed to delete key", error);
        }
    };

    const toggleShowKey = (id: string) => {
        setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-6">
            {/* Add New Key Form */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-medium">Add New Key</h3>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">Provider</label>
                        <select
                            className="flex h-12 md:h-10 w-full rounded-lg md:rounded-md border border-input bg-background px-4 py-3 md:px-3 md:py-2 text-base md:text-sm"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                        >
                            <option value="Custom">Custom / Other</option>
                            <option value="IndianAPI">IndianAPI</option>
                            <option value="Alpha Vantage">Alpha Vantage</option>
                            <option value="Finnhub">Finnhub</option>
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">Label</label>
                        <input
                            className="flex h-12 md:h-10 w-full rounded-lg md:rounded-md border border-input bg-background px-4 py-3 md:px-3 md:py-2 text-base md:text-sm"
                            placeholder="My Primary Key"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">API Key</label>
                        <input
                            type="password"
                            className="flex h-12 md:h-10 w-full rounded-lg md:rounded-md border border-input bg-background px-4 py-3 md:px-3 md:py-2 text-base md:text-sm"
                            placeholder="sk_..."
                            value={keyValue}
                            onChange={(e) => setKeyValue(e.target.value)}
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex h-12 md:h-10 w-full items-center justify-center rounded-lg md:rounded-md bg-primary px-4 py-3 md:py-2 text-base md:text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-11"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 md:h-4 md:w-4" /> : <><Plus className="mr-2 h-5 w-5 md:h-4 md:w-4" /> Save Key</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Keys List */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Saved Keys</h3>
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                    </div>
                ) : keys.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                        No API keys saved yet.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {keys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{key.label}</span>
                                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                            {key.provider}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="font-mono">
                                            {showKey[key.id] ? key.key : "•".repeat(20)}
                                        </span>
                                        <button onClick={() => toggleShowKey(key.id)} className="hover:text-foreground">
                                            {showKey[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(key.id)}
                                    className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
