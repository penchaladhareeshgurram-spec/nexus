import { useState, useEffect } from 'react';

export interface MarketAsset {
  symbol: string;
  price: number;
  change24h: number;
  change24hAbs: number;
  volume24h: number;
  quoteVolume: number;
  high24h: number;
  low24h: number;
  openPrice: number;
}

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

export function useMarkets() {
  const [markets, setMarkets] = useState<Record<string, MarketAsset>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let ws: WebSocket | null = null;

    const initData = async () => {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        const data = await res.json();
        
        const initialMarkets: Record<string, MarketAsset> = {};
        data.forEach((t: any) => {
          if (t.symbol.endsWith('USDT')) {
            initialMarkets[t.symbol] = {
              symbol: t.symbol,
              price: parseFloat(t.lastPrice),
              change24h: parseFloat(t.priceChangePercent),
              change24hAbs: parseFloat(t.priceChange),
              volume24h: parseFloat(t.volume),
              quoteVolume: parseFloat(t.quoteVolume),
              high24h: parseFloat(t.highPrice),
              low24h: parseFloat(t.lowPrice),
              openPrice: parseFloat(t.openPrice)
            };
          }
        });

        if (isMounted) {
          setMarkets(initialMarkets);
          setLoading(false);

          ws = new WebSocket(`${BINANCE_WS_URL}/!ticker@arr`);
          ws.onmessage = (event) => {
            const wsData = JSON.parse(event.data);
            setMarkets(prev => {
              const next = { ...prev };
              let updated = false;
              wsData.forEach((ticker: any) => {
                if (ticker.s.endsWith('USDT') && next[ticker.s]) {
                  const newPrice = parseFloat(ticker.c);
                  if (Math.abs(newPrice - next[ticker.s].price) > 0.00000001) {
                    next[ticker.s] = {
                      ...next[ticker.s],
                      price: newPrice,
                      change24h: parseFloat(ticker.P),
                      change24hAbs: parseFloat(ticker.p),
                      volume24h: parseFloat(ticker.v),
                      quoteVolume: parseFloat(ticker.q),
                      high24h: parseFloat(ticker.h),
                      low24h: parseFloat(ticker.l),
                      openPrice: parseFloat(ticker.o)
                    };
                    updated = true;
                  }
                }
              });
              return updated ? next : prev;
            });
          };
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setLoading(false);
      }
    };

    initData();
    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, []);

  return { markets, loading };
}

export function useChartData(symbol: string, interval: string = '1h') {
  const [history, setHistory] = useState<{time: string, price: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!symbol) return;
    
    setLoading(true);
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setHistory(data.map((k: any) => {
            const date = new Date(k[0]);
            const timeStr = ['1d', '1w', '1M'].includes(interval) 
              ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
              : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
            return {
              time: timeStr,
              price: parseFloat(k[4])
            };
          }));
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [symbol, interval]);

  return { history, loading };
}

export function useOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<{bids: [number, number][], asks: [number, number][]}>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!symbol) return;

    const fetchOrderBook = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=10`);
        const data = await res.json();
        if (isMounted) {
          setOrderBook({
            bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
          });
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
      }
    };

    setLoading(true);
    fetchOrderBook();
    
    const intervalId = setInterval(fetchOrderBook, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [symbol]);

  return { orderBook, loading };
}
