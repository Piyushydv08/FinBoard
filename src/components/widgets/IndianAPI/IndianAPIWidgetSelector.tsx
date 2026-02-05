"use client";

import { useState } from "react";
import { 
    Building, 
    DollarSign, 
    LineChart, 
    Users, 
    Newspaper, 
    Shield, 
    PieChart, 
    TrendingUp,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetOption {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    widgetType: "priceCard" | "financialMetrics" | "technicalChart" | "peerComparison" | "companyProfile" | "newsFeed" | "riskMeter" | "shareholding";
    recommended: boolean;
}

interface IndianAPIWidgetSelectorProps {
    onSelect: (widgetType: string, config: any) => void;
    selectedWidgets?: string[];
    companyName?: string;
}

export default function IndianAPIWidgetSelector({ 
    onSelect, 
    selectedWidgets = [], 
    companyName = "Company" 
}: IndianAPIWidgetSelectorProps) {
    const [selected, setSelected] = useState<string[]>(selectedWidgets);

    const widgetOptions: WidgetOption[] = [
        {
            id: "price-card",
            title: "Live Price Card",
            description: "Real-time BSE/NSE prices with change percentage and 52-week range",
            icon: <DollarSign className="h-5 w-5" />,
            widgetType: "priceCard",
            recommended: true
        },
        {
            id: "financial-metrics",
            title: "Financial Metrics",
            description: "Revenue, profit margins, EPS, and balance sheet highlights",
            icon: <TrendingUp className="h-5 w-5" />,
            widgetType: "financialMetrics",
            recommended: true
        },
        {
            id: "technical-chart",
            title: "Technical Analysis",
            description: "Price trends across different time periods (5D, 20D, 50D, 200D)",
            icon: <LineChart className="h-5 w-5" />,
            widgetType: "technicalChart",
            recommended: true
        },
        {
            id: "peer-comparison",
            title: "Peer Comparison",
            description: "Compare with industry peers on price, P/E, market cap, and ratings",
            icon: <Users className="h-5 w-5" />,
            widgetType: "peerComparison",
            recommended: false
        },
        {
            id: "company-profile",
            title: "Company Profile",
            description: "Company details, management team, and key information",
            icon: <Building className="h-5 w-5" />,
            widgetType: "companyProfile",
            recommended: false
        },
        {
            id: "news-feed",
            title: "News Feed",
            description: "Latest news and updates about the company",
            icon: <Newspaper className="h-5 w-5" />,
            widgetType: "newsFeed",
            recommended: false
        },
        {
            id: "risk-meter",
            title: "Risk Assessment",
            description: "Risk score and factor analysis for investment decisions",
            icon: <Shield className="h-5 w-5" />,
            widgetType: "riskMeter",
            recommended: false
        },
        {
            id: "shareholding",
            title: "Shareholding Pattern",
            description: "Promoter, FII, DII, and public shareholding distribution",
            icon: <PieChart className="h-5 w-5" />,
            widgetType: "shareholding",
            recommended: false
        }
    ];

    const handleSelect = (widgetId: string, widgetType: string) => {
        const newSelected = selected.includes(widgetId)
            ? selected.filter(id => id !== widgetId)
            : [...selected, widgetId];
        
        setSelected(newSelected);
        
        const widgetConfig = {
            widgetType,
            title: widgetOptions.find(w => w.id === widgetId)?.title || widgetType
        };
        
        onSelect(widgetId, widgetConfig);
    };

    const handleSelectAll = () => {
        if (selected.length === widgetOptions.length) {
            setSelected([]);
            onSelect("none", {});
        } else {
            const allIds = widgetOptions.map(w => w.id);
            setSelected(allIds);
            allIds.forEach((id, index) => {
                const widget = widgetOptions.find(w => w.id === id);
                if (widget) {
                    onSelect(id, {
                        widgetType: widget.widgetType,
                        title: widget.title
                    });
                }
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Widgets for {companyName}</h3>
                <p className="text-sm text-muted-foreground">
                    Choose the widgets you want to add to your dashboard. Each widget displays different aspects of the company data.
                </p>
            </div>

            {/* Select All Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSelectAll}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    {selected.length === widgetOptions.length ? "Deselect All" : "Select All"}
                </button>
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {widgetOptions.map((widget) => (
                    <div
                        key={widget.id}
                        className={cn(
                            "relative rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50",
                            selected.includes(widget.id) 
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                                : "hover:bg-muted/10"
                        )}
                        onClick={() => handleSelect(widget.id, widget.widgetType)}
                    >
                        {/* Selection Checkbox */}
                        <div className="absolute top-3 right-3">
                            <div className={cn(
                                "flex items-center justify-center h-5 w-5 rounded border",
                                selected.includes(widget.id)
                                    ? "bg-primary border-primary"
                                    : "border-input"
                            )}>
                                {selected.includes(widget.id) && (
                                    <Check className="h-3 w-3 text-white" />
                                )}
                            </div>
                        </div>

                        {/* Widget Content */}
                        <div className="pr-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    selected.includes(widget.id)
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {widget.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-sm">{widget.title}</h4>
                                        {widget.recommended && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {widget.description}
                                    </p>
                                </div>
                            </div>

                            {/* Preview Badge */}
                            <div className="mt-2">
                                <span className="text-[10px] px-2 py-1 bg-muted rounded">
                                    {widget.widgetType.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="text-sm font-semibold">Selection Summary</h4>
                        <p className="text-xs text-muted-foreground">
                            {selected.length} of {widgetOptions.length} widgets selected
                        </p>
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-primary">
                            {selected.length} widget{selected.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-muted-foreground"> will be added</span>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Recommended Widgets
                </h4>
                <p className="text-xs text-muted-foreground">
                    For most users, we recommend starting with the Price Card, Financial Metrics, and Technical Analysis widgets 
                    to get a comprehensive overview of the stock performance.
                </p>
            </div>
        </div>
    );
}