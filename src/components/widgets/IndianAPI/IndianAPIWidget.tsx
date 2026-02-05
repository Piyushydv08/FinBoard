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
import { useState } from "react";
import { format } from "date-fns";

interface IndianAPIWidgetProps {
  widget: any;
  className?: string;
  widgetType?: string;
  data?: any; // Add this line to accept pre-fetched data
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

interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  date: string;
  source?: string;
  url?: string;
}

interface AnalystRating {
  name: string;
  value: number;
  color: string;
  ratingValue: number;
}

export default function IndianAPIWidget({ widget, className, widgetType, data: propData }: IndianAPIWidgetProps) {
  const { user } = useAuth();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Get the widget type to render
  const widgetTypeToRender = widgetType 
    || widget.dataMapping?.indianAPIWidgetType 
    || widget.config?.widgetType 
    || "priceCard";
  
  // Parse company name from API endpoint
  const getCompanyNameFromUrl = (url: string) => {
    const nameMatch = url.match(/name=([^&]+)/);
    return nameMatch ? decodeURIComponent(nameMatch[1]) : "Unknown";
  };

  // Fetch API keys (only if we don't have pre-fetched data)
  const { data: keys } = useQuery({
    queryKey: ["apiKeys", user?.uid],
    queryFn: async () => user ? getApiKeys(user.uid) : [],
    enabled: !!user && !propData, // Only fetch keys if we don't have pre-fetched data
    staleTime: 1000 * 60 * 5,
  });

  // Process technical data for chart
  const processTechnicalData = (data: any): TechnicalDataPoint[] => {
    if (!data || !Array.isArray(data.stockTechnicalData)) return [];
    
    return data.stockTechnicalData.map((item: any) => ({
      days: item.days,
      bsePrice: parseFloat(item.bsePrice) || 0,
      nsePrice: parseFloat(item.nsePrice) || 0
    })).sort((a: TechnicalDataPoint, b: TechnicalDataPoint) => a.days - b.days);
  };

  // Process peer comparison data
  const processPeerData = (data: any): PeerData[] => {
    if (!data || !Array.isArray(data.peerCompanyList)) return [];
    
    return data.peerCompanyList.map((peer: any) => ({
      name: peer.companyName,
      ticker: peer.tickerId,
      price: parseFloat(peer.price) || 0,
      change: parseFloat(peer.percentChange) || 0,
      marketCap: parseFloat(peer.marketCap) || 0,
      peRatio: parseFloat(peer.priceToEarningsValueRatio) || 0,
      pbRatio: parseFloat(peer.priceToBookValueRatio) || 0,
      rating: peer.overallRating || "Neutral"
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
      return item ? parseFloat(item.value) || 0 : 0;
    };

    return {
      revenue: getValue(incomeStatement, "TotalRevenue") || getValue(incomeStatement, "Revenue"),
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
    if (!data || !Array.isArray(data.shareholding)) return [];
    
    // Map display names to more user-friendly names
    const displayNameMap: Record<string, string> = {
      'Promoter': 'Promoters',
      'FII': 'Foreign Institutional Investors (FIIs)',
      'MF': 'Domestic Institutional Investors (DIIs)',
      'Other': 'Public & Others'
    };
    
    return data.shareholding.map((item: any) => {
      // Get the latest value (first item in categories array)
      const latestValue = item.categories && item.categories[0] 
        ? parseFloat(item.categories[0].percentage) 
        : 0;
      
      return {
        name: displayNameMap[item.displayName] || item.displayName,
        value: latestValue
      };
    });
  };

  // Process news data
  const processNewsData = (data: any): NewsItem[] => {
    if (!data || !Array.isArray(data.recentNews)) return [];
    
    return data.recentNews.map((news: any) => ({
      id: news.id,
      headline: news.headline,
      summary: news.summary || "No summary available",
      date: news.date,
      source: "Livemint",
      url: news.url
    }));
  };

  // Process risk meter data
  const processRiskMeterData = (data: any) => {
    if (!data) return null;
    
    // Calculate risk score from analyst ratings
    const analystView = data.analystView || [];
    const recosBar = data.recosBar || {};
    const riskMeter = data.riskMeter || {};
    
    let riskScore = riskMeter.stdDev || 25.49;
    const categoryName = riskMeter.categoryName || "Balanced risk";
    
    // Adjust based on analyst ratings
    if (recosBar.meanValue) {
      const meanValue = parseFloat(recosBar.meanValue);
      if (meanValue < 2) riskScore -= 10;
      else if (meanValue < 3) riskScore -= 5;
      else if (meanValue > 4) riskScore += 10;
    }
    
    return {
      riskScore: Math.max(0, Math.min(100, riskScore)),
      categoryName,
      stdDev: riskMeter.stdDev,
      analystRatings: analystView,
      meanRating: recosBar.meanValue,
      totalAnalysts: recosBar.noOfRecommendations
    };
  };

  // Process analyst ratings
  const processAnalystRatings = (data: any): AnalystRating[] => {
    if (!data || !Array.isArray(data.analystView)) return [];
    
    return data.analystView.map((rating: any) => ({
      name: rating.ratingName,
      value: parseInt(rating.numberOfAnalystsLatest) || 0,
      color: rating.colorCode,
      ratingValue: rating.ratingValue
    })).filter((rating: AnalystRating) => rating.name !== "Total");
  };

  // Fetch widget data
  const { data: fetchData, isLoading, error, refetch, isRefetching } = useQuery({
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
        const parsedData = JSON.parse(responseText);
        setLastRefreshed(new Date());
        return parsedData;
      } catch (e) {
        throw new Error('Invalid JSON response from IndianAPI');
      }
    },
    enabled: !propData && (!!keys || !widget.selectedApiKeyId), // Only fetch if we don't have pre-fetched data
    refetchInterval: (widget.refreshInterval || 300) * 1000,
  });

  // Use pre-fetched data if available, otherwise use fetched data
  const data = propData || fetchData;

  // Extract data from API response
  const companyName = data?.companyName || getCompanyNameFromUrl(widget.apiEndpoint);
  const tickerId = data?.companyProfile?.exchangeCodeBse || "N/A";
  const industry = data?.industry || "N/A";
  const currentPrice = data?.currentPrice || {};
  const bsePrice = parseFloat(currentPrice.BSE) || 0;
  const nsePrice = parseFloat(currentPrice.NSE) || 0;
  const percentChange = parseFloat(data?.percentChange) || 0;
  const yearHigh = parseFloat(data?.yearHigh) || 0;
  const yearLow = parseFloat(data?.yearLow) || 0;
  
  // Process all widget data
  const technicalData = processTechnicalData(data);
  const peerData = processPeerData(data);
  const financialMetrics = processFinancialMetrics(data);
  const shareholdingData = processShareholdingData(data);
  const newsData = processNewsData(data);
  const riskMeterData = processRiskMeterData(data);
  const analystRatings = processAnalystRatings(data);

  // Update loading condition to check if we have pre-fetched data
  if ((isLoading && !data) && !propData) {
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
    switch (widgetTypeToRender) {
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
                ₹{(financialMetrics.revenue / 100000).toFixed(1)}L Cr
              </div>
            </div>
            <div className="bg-green-500/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium text-muted-foreground">Net Income</span>
              </div>
              <div className="text-lg font-semibold">
                ₹{(financialMetrics.netIncome / 100000).toFixed(1)}L Cr
              </div>
            </div>
          </div>

          {/* Profit Margins */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="text-xs text-muted-foreground">Gross Margin</div>
              <div className="text-sm font-semibold">
                {financialMetrics.revenue > 0 ? ((financialMetrics.grossProfit / financialMetrics.revenue) * 100).toFixed(1) : '0'}%
              </div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="text-xs text-muted-foreground">Op Margin</div>
              <div className="text-sm font-semibold">
                {financialMetrics.revenue > 0 ? ((financialMetrics.operatingIncome / financialMetrics.revenue) * 100).toFixed(1) : '0'}%
              </div>
            </div>
            <div className="text-center p-2 bg-muted/20 rounded">
              <div className="text-xs text-muted-foreground">Net Margin</div>
              <div className="text-sm font-semibold">
                {financialMetrics.revenue > 0 ? ((financialMetrics.netIncome / financialMetrics.revenue) * 100).toFixed(1) : '0'}%
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
                    formatter={(value: number | undefined) => [`₹${Number(value || 0).toFixed(2)}`, 'Price']}
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
            </div>
          </div>
          
          {/* Technical Summary */}
          <div className="mt-4 pt-3 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Technical Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">5D Avg</span>
                <span className="font-semibold">
                  ₹{technicalData.find((d: TechnicalDataPoint) => d.days === 5)?.bsePrice.toFixed(2) || '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">10D Avg</span>
                <span className="font-semibold">
                  ₹{technicalData.find((d: TechnicalDataPoint) => d.days === 10)?.bsePrice.toFixed(2) || '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">20D Avg</span>
                <span className="font-semibold">
                  ₹{technicalData.find((d: TechnicalDataPoint) => d.days === 20)?.bsePrice.toFixed(2) || '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">50D Avg</span>
                <span className="font-semibold">
                  ₹{technicalData.find((d: TechnicalDataPoint) => d.days === 50)?.bsePrice.toFixed(2) || '--'}
                </span>
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
                    peer.rating === "Bullish" || peer.rating === "Strong Buy" ? "bg-green-500/10 text-green-600" :
                    peer.rating === "Moderately Bullish" ? "bg-yellow-500/10 text-yellow-600" :
                    peer.rating === "Moderately Bearish" ? "bg-red-500/10 text-red-600" :
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

      {newsData.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {newsData.slice(0, 5).map((news: NewsItem) => (
            <div key={news.id} className="p-3 border rounded-lg hover:bg-muted/10 transition-colors">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 mb-1">
                    {news.headline.replace(/&amp;/g, '&')}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {news.summary}
                  </p>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{news.source || 'Livemint'}</span>
                    <span>{format(new Date(news.date), 'MMM dd, yyyy')}</span>
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

  const renderRiskMeter = () => {
    const riskScore = riskMeterData?.riskScore ?? 65;
    const categoryName = riskMeterData?.categoryName || 'Moderate Risk';

    return (
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
              <span className="text-xl font-bold">{riskScore}</span>
            </div>
            <div className="text-xs text-muted-foreground">Overall Risk Score</div>
            <div className={cn(
              "text-xs font-medium",
              riskScore < 30 ? "text-green-600" :
              riskScore < 60 ? "text-yellow-600" : "text-red-600"
            )}>
              {categoryName}
            </div>
          </div>

          {/* Analyst Ratings */}
          {analystRatings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Analyst Ratings</h4>
              <div className="space-y-1">
                {analystRatings.map((rating: AnalystRating, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{rating.name}</span>
                      <span>{rating.value} analysts</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${(rating.value / analystRatings.reduce((sum: number, r: AnalystRating) => sum + r.value, 0)) * 100}%`,
                          backgroundColor: rating.color || '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Factors */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">Risk Factors</h4>
            <div className="space-y-1">
              {([
                { label: 'Market Risk', value: riskMeterData?.stdDev || 70, color: 'bg-red-500' },
                { label: 'Credit Risk', value: 40, color: 'bg-yellow-500' },
                { label: 'Liquidity Risk', value: 30, color: 'bg-green-500' },
                { label: 'Operational Risk', value: 60, color: 'bg-orange-500' }
              ]).map((risk, index) => (
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
              {riskScore < 30 
                ? "Low risk profile. Suitable for conservative investors."
                : riskScore < 60
                ? "Moderate risk. Monitor debt levels and commodity price fluctuations closely."
                : "High risk. Consider diversification and consult financial advisor."
              }
            </p>
          </div>
        </div>
      </>
    );
  };

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
                  <Tooltip 
                    formatter={(value: number | undefined) => [`${value || 0}%`, 'Holding']}
                    contentStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
                  <span className="font-semibold">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
            <div className="text-center p-1 bg-blue-500/5 rounded">
              <div className="text-blue-600 font-semibold">
                {shareholdingData.find((s: ShareholdingData) => s.name.includes('Promoters'))?.value.toFixed(1) || 0}%
              </div>
              <div className="text-muted-foreground">Promoter</div>
            </div>
            <div className="text-center p-1 bg-green-500/5 rounded">
              <div className="text-green-600 font-semibold">
                {shareholdingData.find((s: ShareholdingData) => s.name.includes('FII'))?.value.toFixed(1) || 0}%
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
            {lastRefreshed ? `Updated: ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
          </span>
        </div>
      </div>
    </div>
  );
}