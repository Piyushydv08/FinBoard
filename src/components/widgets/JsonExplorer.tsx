"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonExplorerProps {
    data: any;
    onSelectPath: (path: string) => void;
    selectedPath?: string;
}

export default function JsonExplorer({ data, onSelectPath, selectedPath }: JsonExplorerProps) {
    return (
        <div className="rounded-md border bg-muted/30 p-2 font-mono text-xs overflow-auto max-h-75">
            <JsonNode
                data={data}
                path=""
                onSelectPath={onSelectPath}
                selectedPath={selectedPath}
            />
        </div>
    );
}

function JsonNode({
    data,
    path,
    onSelectPath,
    selectedPath
}: {
    data: any;
    path: string;
    onSelectPath: (p: string) => void;
    selectedPath?: string;
}) {
    const [expanded, setExpanded] = useState(true);

    const isObject = typeof data === "object" && data !== null;
    const isArray = Array.isArray(data);
    const isEmpty = isObject && Object.keys(data).length === 0;

    if (!isObject || isEmpty) {
        const isSelected = path === selectedPath;
        return (
            <div
                className={cn(
                    "flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted-foreground/10",
                    isSelected && "bg-primary/20 ring-1 ring-primary/30"
                )}
                onClick={() => {
                    // Only allow selecting primitives for now, or allow objects if needed?
                    // Usually we map primitives or arrays for charts.
                    onSelectPath(path);
                }}
            >
                <span className="text-muted-foreground">{JSON.stringify(data)}</span>
                {isSelected && <Check className="h-3 w-3 text-primary" />}
            </div>
        );
    }

    return (
        <div className="ml-2">
            <div
                className="flex cursor-pointer items-center gap-1 py-0.5 hover:text-primary"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span className="font-semibold text-primary/80">
                    {isArray ? `Array[${data.length}]` : "Object"}
                </span>
            </div>

            {expanded && (
                <div className="border-l pl-2">
                    {Object.entries(data).map(([key, value]) => {
                        const currentPath = path ? (isArray ? `${path}[${key}]` : `${path}.${key}`) : key;
                        return (
                            <div key={key} className="flex flex-col">
                                <div className="flex items-start gap-1">
                                    <span className="py-0.5 text-muted-foreground">{key}:</span>
                                    <JsonNode
                                        data={value}
                                        path={currentPath}
                                        onSelectPath={onSelectPath}
                                        selectedPath={selectedPath}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
