"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from "recharts";
import { Loader2, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Building, Users, DollarSign, Percent, ArrowUpRight, ArrowDownRight, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Target, Shield, Newspaper, Calendar, Award, TrendingUp as TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getApiKeys } from "@/lib/firestore/apiKeys";
import { buildRequest } from "@/lib/api-utils";
import { useState } from "react";
import { format } from "date-fns";

interface IndianAPIWidgetProps {
  widget: any;
  className?: string;
  widgetType?: string;
}

interface IndianAPIWidgetConfig {
  widgetType: "priceCard" | "financialMetrics" | "technicalChart" | "peerComparison" | "companyProfile" | "newsFeed" | "riskMeter" | "shareholding";
  title?: string;
  config?: any;
}

interface TechnicalDataPoint {
  days: number;
  bsePrice: number;
  nsePrice: number;
}

interface PeerData {
  name: string;
  ticker: string;
  price: number;
  change: number;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  rating: string;
}

interface ShareholdingData {
  name: string;
  value: number;
}

interface FinancialItem {
  key: string;
  value: string;
  displayName: string;
  qoQComp: any;
  yqoQComp: any;
}

interface FinancialMetrics {
  revenue: number;
  netIncome: number;
  eps: number;
  grossProfit: number;
  operatingIncome: number;
  totalAssets: number;
  totalDebt: number;
  totalEquity: number;
  cashFlowOperating: number;
  cashFlowInvesting: number;
  cashFlowFinancing: number;
}

export default function IndianAPIWidget({ widget, className, widgetType }: IndianAPIWidgetProps) {
  const { user } = useAuth();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const config: IndianAPIWidgetConfig = widgetType || widget.config?.widgetType || "priceCard";
  
  // Parse company name from API endpoint
  const getCompanyNameFromUrl = (url: string) => {
    const nameMatch = url.match(/name=([^&]+)/);
    return nameMatch ? decodeURIComponent(nameMatch[1]) : "Unknown";
  };

  // Fetch API keys
  const { data: keys } = useQuery({
    queryKey: ["apiKeys", user?.uid],
    queryFn: async () => user ? getApiKeys(user.uid) : [],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Process technical data for chart
  const processTechnicalData = (data: any): TechnicalDataPoint[] => {
    if (!data || !Array.isArray(data.stockTechnicalData)) return [];
    
    return data.stockTechnicalData.map((item: any) => ({
      days: item.days,
      bsePrice: parseFloat(item.bsePrice),
      nsePrice: parseFloat(item.nsePrice)
    })).sort((a: TechnicalDataPoint, b: TechnicalDataPoint) => a.days - b.days);
  };

  // Process peer comparison data
  const processPeerData = (data: any): PeerData[] => {
    if (!data || !Array.isArray(data.peerCompanyList)) return [];
    
    return data.peerCompanyList.map((peer: any) => ({
      name: peer.companyName,
      ticker: peer.tickerId,
      price: parseFloat(peer.price),
      change: parseFloat(peer.percentChange),
      marketCap: parseFloat(peer.marketCap),
      peRatio: parseFloat(peer.priceToEarningsValueRatio),
      pbRatio: parseFloat(peer.priceToBookValueRatio),
      rating: peer.overallRating
    }));
  };

  // Process financial metrics
  const processFinancialMetrics = (data: any): FinancialMetrics | null => {
    if (!data || !Array.isArray(data.financials) || data.financials.length === 0) return null;
    
    const latestFinancials = data.financials[0];
    const incomeStatement: FinancialItem[] = latestFinancials.stockFinancialMap?.INC || [];
    const balanceSheet: FinancialItem[] = latestFinancials.stockFinancialMap?.BAL || [];
    const cashFlow: FinancialItem[] = latestFinancials.stockFinancialMap?.CAS || [];
    
    const getValue = (array: FinancialItem[], key: string): number => {
      const item = array.find((item: FinancialItem) => item.key === key);
      return item ? parseFloat(item.value) : 0;
    };

    return {
      revenue: getValue(incomeStatement, "TotalRevenue"),
      netIncome: getValue(incomeStatement, "NetIncome"),
      eps: getValue(incomeStatement, "DilutedEPSExcludingExtraOrdItems"),
      grossProfit: getValue(incomeStatement, "GrossProfit"),
      operatingIncome: getValue(incomeStatement, "OperatingIncome"),
      totalAssets: getValue(balanceSheet, "TotalAssets"),
      totalDebt: getValue(balanceSheet, "TotalDebt"),
      totalEquity: getValue(balanceSheet, "TotalEquity"),
      cashFlowOperating: getValue(cashFlow, "CashfromOperatingActivities"),
      cashFlowInvesting: getValue(cashFlow, "CashfromInvestingActivities"),
      cashFlowFinancing: getValue(cashFlow, "CashfromFinancingActivities")
    };
  };

  // Process shareholding data
  const processShareholdingData = (data: any): ShareholdingData[] => {
    if (!data || !data.shareholding) return [];
    
    // This is a simplified version - adjust based on actual API response structure
    return [
      { name: 'Promoters', value: 45 },
      { name: 'FIIs', value: 25 },
      { name: 'DIIs', value: 15 },
      { name: 'Public', value: 15 }
    ];
  };

    // Fetch widget data
    const { data, isLoading, error, refetch, isRefetching } = useQuery({
      queryKey: ["widget", widget.id, "indianapi", widget.selectedApiKeyId],
      queryFn: async () => {
        if (!widget.apiEndpoint) return null;

        // Determine API Key
        let apiKeyValue = "";
        
        // 1. Try to get from secure storage (keys list)
        if (keys && widget.selectedApiKeyId) {
             const foundKey = keys.find(k => k.id === widget.selectedApiKeyId);
             if (foundKey) apiKeyValue = foundKey.key;
        }

        // 2. If not found in storage, try to extract from URL (legacy/baked-in config)
        let fetchUrl = widget.apiEndpoint;
        if (!apiKeyValue) {
            try {
                const urlObj = new URL(fetchUrl);
                const urlKey = urlObj.searchParams.get('apikey') || urlObj.searchParams.get('api_key') || urlObj.searchParams.get('key');
                if (urlKey) apiKeyValue = urlKey;
            } catch (e) {
                // Fallback regex extraction
                const match = fetchUrl.match(/[?&](?:apikey|api_key|key)=([^&]+)/);
                if (match) apiKeyValue = match[1];
            }
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        // Add correct header
        if (apiKeyValue) {
          headers['X-Api-Key'] = apiKeyValue;
        }

        // Always clean the URL to prevent double sending or security exposure
        try {
            const urlObj = new URL(fetchUrl);
            urlObj.searchParams.delete('apikey');
            urlObj.searchParams.delete('api_key');
            urlObj.searchParams.delete('key');
            fetchUrl = urlObj.toString();
        } catch (e) {
            console.error('Error cleaning URL:', e);
            fetchUrl = fetchUrl.replace(/[?&](apikey|api_key|key)=[^&]+/, '');
        }

        console.log('Fetching IndianAPI:', { url: fetchUrl, hasHeaderKey: !!headers['X-Api-Key'] });

        const res = await fetch(fetchUrl, { 
          headers,
          method: 'GET'
        });
        
        const responseText = await res.text();
        
        if (!res.ok) {
            console.error('IndianAPI Error:', responseText);
            throw new Error(`HTTP ${res.status}: ${responseText || 'Unknown error'}`);
        }
        
        try {
          return JSON.parse(responseText);
        } catch (e) {
          throw new Error('Invalid JSON response from IndianAPI');
        }
      },
      enabled: !!keys || !widget.selectedApiKeyId,
      refetchInterval: (widget.refreshInterval || 300) * 1000,
    });

  const companyName = data ? data.companyName : getCompanyNameFromUrl(widget.apiEndpoint);
  const tickerId = data?.tickerId || "N/A";
  const industry = data?.industry || "N/A";
  const currentPrice = data?.currentPrice || {};
  const bsePrice = parseFloat(currentPrice.BSE) || 0;
  const nsePrice = parseFloat(currentPrice.NSE) || 0;
  const percentChange = parseFloat(data?.percentChange) || 0;
  const yearHigh = parseFloat(data?.yearHigh) || 0;
  const yearLow = parseFloat(data?.yearLow) || 0;
  
  const technicalData = data ? processTechnicalData(data) : [];
  const peerData = data ? processPeerData(data) : [];
  const financialMetrics = data ? processFinancialMetrics(data) : null;
  const shareholdingData = data ? processShareholdingData(data) : [];

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
        <p className="text-xs text-center font-medium">Unable to load Indian stock data</p>
        <p className="text-xs text-center text-muted-foreground mt-1">{error.message}</p>
        <button onClick={() => refetch()} className="mt-2 text-xs underline hover:text-destructive/80">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("flex h-full w-full items-center justify-center bg-card p-4 rounded-lg border", className)}>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Render different widget types
  const renderWidget = () => {
    switch (config.widgetType) {
      case "priceCard":
        return renderPriceCard();
      case "financialMetrics":
        return renderFinancialMetrics();
      case "technicalChart":
        return renderTechnicalChart();
      case "peerComparison":
        return renderPeerComparison();
      case "companyProfile":
        return renderCompanyProfile();
      case "newsFeed":
        return renderNewsFeed();
      case "riskMeter":
        return renderRiskMeter();
      case "shareholding":
        return renderShareholding();
      default:
        return renderPriceCard();
    }
  };

  const renderPriceCard = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName}`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold">{tickerId}</span>
            <span className="text-xs text-muted-foreground">• {industry}</span>
            {percentChange && (
              <div className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded",
                percentChange >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
              )}>
                {percentChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
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
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">BSE</div>
            <div className="text-2xl font-bold">₹{bsePrice.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">NSE</div>
            <div className="text-2xl font-bold">₹{nsePrice.toFixed(2)}</div>
          </div>
        </div>
        
        {/* Price Range */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>52W Low: ₹{yearLow.toFixed(2)}</span>
            <span>52W High: ₹{yearHigh.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full", percentChange >= 0 ? "bg-green-500" : "bg-red-500")}
              style={{
                width: `${((bsePrice - yearLow) / (yearHigh - yearLow)) * 100}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Low</span>
            <span>Current</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
          <span className="text-muted-foreground">Change</span>
          <span className={cn("font-semibold", percentChange >= 0 ? "text-green-500" : "text-red-500")}>
            {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
          <span className="text-muted-foreground">BSE vs NSE</span>
          <span className={cn("font-semibold", (bsePrice - nsePrice) >= 0 ? "text-green-500" : "text-red-500")}>
            {bsePrice > nsePrice ? '+' : ''}{(bsePrice - nsePrice).toFixed(2)}
          </span>
        </div>
      </div>
    </>
  );

  const renderFinancialMetrics = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName} - Financials`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Building className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">Financial Metrics</span>
          </div>
        </div>
        <button 
          onClick={() => refetch()} 
          className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {financialMetrics ? (
        <div className="space-y-4">
          {/* Revenue & Profit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Revenue</span>
              </div>
              <div className="text-lg font-semibold">
                ₹{(financialMetrics.revenue / 1000).toFixed(1)}K Cr
              </div>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Net Income</span>
              </div>
              <div className="text-lg font-semibold">
                ₹{(financialMetrics.netIncome / 1000).toFixed(1)}K Cr
              </div>
            </div>
          </div>

          {/* Profit Margins */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="text-xs text-muted-foreground">Gross Margin</div>
              <div className="text-sm font-semibold">
                {((financialMetrics.grossProfit / financialMetrics.revenue) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="text-xs text-muted-foreground">Op Margin</div>
              <div className="text-sm font-semibold">
                {((financialMetrics.operatingIncome / financialMetrics.revenue) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="text-xs text-muted-foreground">Net Margin</div>
              <div className="text-sm font-semibold">
                {((financialMetrics.netIncome / financialMetrics.revenue) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Balance Sheet</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-muted/10 rounded">
                <div className="text-muted-foreground">Assets</div>
                <div className="font-semibold">₹{(financialMetrics.totalAssets / 100000).toFixed(1)}L Cr</div>
              </div>
              <div className="text-center p-2 bg-muted/10 rounded">
                <div className="text-muted-foreground">Debt</div>
                <div className="font-semibold">₹{(financialMetrics.totalDebt / 100000).toFixed(1)}L Cr</div>
              </div>
              <div className="text-center p-2 bg-muted/10 rounded">
                <div className="text-muted-foreground">Equity</div>
                <div className="font-semibold">₹{(financialMetrics.totalEquity / 100000).toFixed(1)}L Cr</div>
              </div>
            </div>
          </div>

          {/* EPS */}
          <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Earnings Per Share (EPS)</div>
            <div className="text-xl font-bold">₹{financialMetrics.eps.toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Financial data not available
        </div>
      )}
    </>
  );

  const renderTechnicalChart = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName} - Technical Analysis`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <LineChartIcon className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">Price Trends</span>
          </div>
        </div>
        <button 
          onClick={() => refetch()} 
          className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {technicalData.length > 0 ? (
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              {technicalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={technicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                    <XAxis 
                      dataKey="days" 
                      fontSize={10}
                      tickFormatter={(value: number) => `${value}D`}
                      tick={{ fill: 'rgb(100, 116, 139)' }}
                    />
                    <YAxis 
                      fontSize={10}
                      tickFormatter={(value: number) => `₹${value}`}
                      tick={{ fill: 'rgb(100, 116, 139)' }}
                    />
                    <Tooltip 
                      formatter={(value: number | undefined, name: string | undefined) => [`₹${Number(value || 0).toFixed(2)}`, 'Price']}
                      labelFormatter={(label: any) => `Period: ${label} days`}
                      contentStyle={{ fontSize: '11px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bsePrice" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      name="BSE Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nsePrice" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      name="NSE Price"
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
          
          {/* Technical Summary */}
          <div className="mt-4 pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Technical Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">5D Avg</span>
                <span className="font-semibold">₹{technicalData.find((d: TechnicalDataPoint) => d.days === 5)?.bsePrice.toFixed(2) || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">20D Avg</span>
                <span className="font-semibold">₹{technicalData.find((d: TechnicalDataPoint) => d.days === 20)?.bsePrice.toFixed(2) || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">50D Avg</span>
                <span className="font-semibold">₹{technicalData.find((d: TechnicalDataPoint) => d.days === 50)?.bsePrice.toFixed(2) || '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">200D Avg</span>
                <span className="font-semibold">₹{technicalData.find((d: TechnicalDataPoint) => d.days === 300)?.bsePrice.toFixed(2) || '--'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Technical data not available
        </div>
      )}
    </>
  );

  const renderPeerComparison = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName} - Peer Comparison`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Users className="h-3 w-3 text-orange-500" />
            <span className="text-xs text-muted-foreground">Industry Peers</span>
          </div>
        </div>
        <button 
          onClick={() => refetch()} 
          className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {peerData.length > 0 ? (
        <div className="space-y-3">
          {/* Current Company */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{companyName}</div>
                <div className="text-xs text-muted-foreground">Current</div>
              </div>
              <div className="text-right">
                <div className="font-bold">₹{bsePrice.toFixed(2)}</div>
                <div className={cn("text-xs", percentChange >= 0 ? "text-green-500" : "text-red-500")}>
                  {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          {/* Peer List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {peerData.map((peer: PeerData, index: number) => (
              <div key={index} className="p-2 border rounded-lg hover:bg-muted/10 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="max-w-[60%]">
                    <div className="text-sm font-medium truncate">{peer.name}</div>
                    <div className="text-xs text-muted-foreground">{peer.ticker}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">₹{peer.price.toFixed(2)}</div>
                    <div className={cn("text-xs", peer.change >= 0 ? "text-green-500" : "text-red-500")}>
                      {peer.change >= 0 ? '+' : ''}{peer.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>MCap: ₹{(peer.marketCap / 1000).toFixed(1)}K Cr</span>
                  <span>P/E: {peer.peRatio.toFixed(1)}</span>
                  <span className={cn(
                    "px-1 rounded",
                    peer.rating === "Bullish" ? "bg-green-500/10 text-green-600" :
                    peer.rating === "Moderately Bullish" ? "bg-yellow-500/10 text-yellow-600" :
                    "bg-gray-500/10 text-gray-600"
                  )}>
                    {peer.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
            <div className="text-center p-1 bg-muted/10 rounded">
              <div className="text-muted-foreground">Avg P/E</div>
              <div className="font-semibold">
                {(peerData.reduce((sum: number, peer: PeerData) => sum + peer.peRatio, 0) / peerData.length).toFixed(1)}
              </div>
            </div>
            <div className="text-center p-1 bg-muted/10 rounded">
              <div className="text-muted-foreground">Avg P/B</div>
              <div className="font-semibold">
                {(peerData.reduce((sum: number, peer: PeerData) => sum + peer.pbRatio, 0) / peerData.length).toFixed(1)}
              </div>
            </div>
            <div className="text-center p-1 bg-muted/10 rounded">
              <div className="text-muted-foreground">Pos/Neg</div>
              <div className="font-semibold">
                {peerData.filter((p: PeerData) => p.change >= 0).length}/{peerData.filter((p: PeerData) => p.change < 0).length}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Peer comparison data not available
        </div>
      )}
    </>
  );

  const renderCompanyProfile = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName} - Company Profile`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Building className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">Company Details</span>
          </div>
        </div>
        <button 
          onClick={() => refetch()} 
          className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Company Info */}
        <div className="p-3 bg-muted/10 rounded-lg">
          <div className="text-sm font-semibold mb-2">About {companyName}</div>
          <p className="text-xs text-muted-foreground line-clamp-4">
            {data.companyProfile?.companyDescription || 'Company description not available.'}
          </p>
        </div>

        {/* Key Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Key Details</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Industry</span>
              <span className="font-medium">{industry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ticker ID</span>
              <span className="font-medium">{tickerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BSE Code</span>
              <span className="font-medium">{data.companyProfile?.exchangeCodeBse || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NSE Code</span>
              <span className="font-medium">{data.companyProfile?.exchangeCodeNse || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Key Management */}
        {data.companyProfile?.officers?.officer && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Key Management</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {data.companyProfile.officers.officer.slice(0, 3).map((officer: any, index: number) => (
                <div key={index} className="p-2 border rounded text-xs">
                  <div className="font-medium">
                    {officer.firstName} {officer.mI ? officer.mI + ' ' : ''}{officer.lastName}
                  </div>
                  <div className="text-muted-foreground">{officer.Value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderNewsFeed = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName} - News`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Newspaper className="h-3 w-3 text-red-500" />
            <span className="text-xs text-muted-foreground">Recent Updates</span>
          </div>
        </div>
        <button 
          onClick={() => refetch()} 
          className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {data.recentNews && Array.isArray(data.recentNews) && data.recentNews.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {data.recentNews.slice(0, 5).map((news: any, index: number) => (
            <div key={index} className="p-3 border rounded-lg hover:bg-muted/10 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 mb-1">
                    {news.title || 'News Update'}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {news.description || 'No description available.'}
                  </p>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{news.source || 'Source'}</span>
                    <span>{news.date ? format(new Date(news.date), 'MMM dd') : 'Recent'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground text-center p-4">
          <Newspaper className="h-8 w-8 mb-2 opacity-50" />
          <p>No recent news available</p>
          <p className="text-xs mt-1">Check back later for updates</p>
        </div>
      )}
    </>
  );

  const renderRiskMeter = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName} - Risk Assessment`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Shield className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Risk Analysis</span>
          </div>
        </div>
        <button 
          onClick={() => refetch()} 
          className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Risk Score */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-yellow-500/20 to-red-500/20 border-4 border-yellow-500/30 mb-2">
            <span className="text-xl font-bold">65</span>
          </div>
          <div className="text-xs text-muted-foreground">Overall Risk Score</div>
          <div className="text-xs font-medium text-yellow-600">Moderate Risk</div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground">Risk Factors</h4>
          <div className="space-y-1">
            {[
              { label: 'Market Risk', value: 70, color: 'bg-red-500' },
              { label: 'Credit Risk', value: 40, color: 'bg-yellow-500' },
              { label: 'Liquidity Risk', value: 30, color: 'bg-green-500' },
              { label: 'Operational Risk', value: 60, color: 'bg-orange-500' }
            ].map((risk, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{risk.label}</span>
                  <span>{risk.value}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${risk.color}`}
                    style={{ width: `${risk.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Recommendations */}
        <div className="p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
          <div className="text-xs font-semibold text-yellow-600 mb-1">Recommendation</div>
          <p className="text-xs text-muted-foreground">
            Monitor debt levels and commodity price fluctuations closely. Consider diversification.
          </p>
        </div>
      </div>
    </>
  );

  const renderShareholding = () => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{widget.title || `${companyName} - Shareholding`}</h3>
          <div className="flex items-center gap-2 mt-1">
            <PieChartIcon className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-muted-foreground">Ownership Pattern</span>
          </div>
        </div>
        <button 
          onClick={() => refetch()} 
          className={cn("text-muted-foreground hover:text-primary transition-all", isRefetching ? "animate-spin opacity-100" : "opacity-0 group-hover:opacity-100")}
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {shareholdingData.length > 0 ? (
        <div className="space-y-4">
          {/* Pie Chart Visualization */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              {shareholdingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shareholdingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {shareholdingData.map((entry: ShareholdingData, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
                            '#3b82f6', // Promoters - Blue
                            '#10b981', // FIIs - Green
                            '#f59e0b', // DIIs - Yellow
                            '#8b5cf6'  // Public - Purple
                          ][index % 4]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => [`${value || 0}%`, 'Holding']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-muted/10 rounded border border-dashed text-xs text-muted-foreground">
                  No stock data available
                </div>
              )}
            </div>
          </div>

          {/* Shareholding Details */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Holding Pattern</h4>
            <div className="space-y-1">
              {shareholdingData.map((item: ShareholdingData, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: [
                          '#3b82f6', // Blue
                          '#10b981', // Green
                          '#f59e0b', // Yellow
                          '#8b5cf6'  // Purple
                        ][index % 4]
                      }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
            <div className="text-center p-1 bg-blue-500/5 rounded">
              <div className="text-blue-600 font-semibold">
                {shareholdingData.find((s: ShareholdingData) => s.name === 'Promoters')?.value || 0}%
              </div>
              <div className="text-muted-foreground">Promoter</div>
            </div>
            <div className="text-center p-1 bg-green-500/5 rounded">
              <div className="text-green-600 font-semibold">
                {shareholdingData.find((s: ShareholdingData) => s.name === 'FIIs')?.value || 0}%
              </div>
              <div className="text-muted-foreground">FIIs</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Shareholding data not available
        </div>
      )}
    </>
  );

  return (
    <div className={cn("flex h-full w-full flex-col bg-card p-4 rounded-lg border shadow-sm relative group hover:shadow-md transition-shadow", className)}>
      {renderWidget()}
      
      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <span className="text-orange-500">●</span>
            <span>IndianAPI</span>
          </span>
          <span>
            {lastRefreshed ? `Updated: ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Never refreshed'}
          </span>
        </div>
      </div>
    </div>
  );
}
