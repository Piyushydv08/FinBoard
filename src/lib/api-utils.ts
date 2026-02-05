import { type ApiKey } from "@/lib/firestore/apiKeys";

/**
 * Injects the API key into the request based on specific provider requirements.
 * Handles: Alpha Vantage, Finnhub, and IndianAPI.
 */
export function buildRequest(endpoint: string, apiKey?: ApiKey | null) {
  let url = endpoint;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  if (apiKey) {
    if (apiKey.provider === "IndianAPI") {
      // IndianAPI: Add to headers
      headers["X-Api-Key"] = apiKey.key;
      
      // Clean URL from any API key parameters
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.delete('apikey');
        urlObj.searchParams.delete('api_key');
        url = urlObj.toString();
      } catch (e) {
        // URL might be invalid, continue with original
      }
    } else if (apiKey.provider === "Alpha Vantage") {
      // Alpha Vantage: Add as query parameter
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('apikey')) {
        urlObj.searchParams.append('apikey', apiKey.key);
      }
      url = urlObj.toString();
    } else if (apiKey.provider === "Finnhub") {
      // Finnhub: Add as query parameter
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('token')) {
        urlObj.searchParams.append('token', apiKey.key);
      }
      url = urlObj.toString();
    }
    // Add other providers as needed
  }

  return { url, headers };
}