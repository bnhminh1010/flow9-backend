const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
  image?: string;
}

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image?: string;
}

export async function searchCoins(query: string): Promise<CoinInfo[]> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json() as { coins?: Array<{ id: string; symbol: string; name: string; thumb?: string }> };
    return (data.coins || []).slice(0, 20).map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.thumb
    }));
  } catch (error) {
    console.error('CoinGecko search error:', error);
    return [];
  }
}

export async function getCoinPrices(coinIds: string[]): Promise<Record<string, CoinPrice>> {
  if (coinIds.length === 0) return {};
  
  try {
    const ids = coinIds.join(',');
    const response = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=vnd&include_24hr_change=true&include_last_updated_at=true`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json() as Record<string, { vnd: number; vnd_24h_change?: number }>;
    const result: Record<string, CoinPrice> = {};
    
    for (const [id, priceData] of Object.entries(data)) {
      result[id] = {
        id,
        symbol: id,
        name: id,
        current_price: priceData.vnd,
        price_change_percentage_24h: priceData.vnd_24h_change || 0
      };
    }
    
    return result;
  } catch (error) {
    console.error('CoinGecko price error:', error);
    return {};
  }
}

export async function getTopCoins(limit: number = 50): Promise<CoinInfo[]> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=vnd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json() as Array<{ id: string; symbol: string; name: string; image?: string }>;
    return data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image
    }));
  } catch (error) {
    console.error('CoinGecko top coins error:', error);
    return [];
  }
}

export async function getCoinDetails(coinId: string): Promise<CoinPrice | null> {
  try {
    const response = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=vnd&include_24hr_change=true&include_last_updated_at=true`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json() as Record<string, { vnd: number; vnd_24h_change?: number }>;
    const coinData = data[coinId];
    
    if (!coinData) return null;
    
    return {
      id: coinId,
      symbol: coinId,
      name: coinId,
      current_price: coinData.vnd,
      price_change_percentage_24h: coinData.vnd_24h_change || 0
    };
  } catch (error) {
    console.error('CoinGecko coin details error:', error);
    return null;
  }
}
