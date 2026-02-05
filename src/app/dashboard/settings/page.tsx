import ApiKeyManager from "@/components/settings/ApiKeyManager";
import { Key } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto px-4 md:px-0">
            <div className="flex items-center gap-4 border-b pb-4 pt-2 md:pt-0">
                <div className="rounded-lg bg-primary/10 p-3">
                    <Key className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">API Key Vault</h1>
                    <p className="text-muted-foreground text-sm">Manage your external API keys for fetching financial data.</p>
                </div>
            </div>

            <ApiKeyManager />
        </div>
    );
}