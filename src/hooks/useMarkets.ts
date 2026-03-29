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
  const [history, setHistory] = useState<{rawTime: number, time: string, price: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let ws: WebSocket | null = null;
    if (!symbol) return;
    
    setLoading(true);
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        
        const formattedData = data.map((k: any) => {
          const date = new Date(k[0]);
          const timeStr = ['1d', '1w', '1M'].includes(interval) 
            ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
            : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
          return {
            rawTime: k[0],
            time: timeStr,
            price: parseFloat(k[4])
          };
        });
        
        setHistory(formattedData);
        setLoading(false);

        // Start WebSocket for live chart updates
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          const kline = message.k;

          setHistory(prev => {
            if (prev.length === 0) return prev;
            const next = [...prev];
            const lastIdx = next.length - 1;
            const lastCandle = next[lastIdx];

            const date = new Date(kline.t);
            const timeStr = ['1d', '1w', '1M'].includes(interval)
              ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
              : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const newPrice = parseFloat(kline.c);

            if (kline.t === lastCandle.rawTime) {
              // Update current candle with live price
              next[lastIdx] = { ...lastCandle, price: newPrice };
            } else if (kline.t > lastCandle.rawTime) {
              // Append new candle
              next.push({ rawTime: kline.t, time: timeStr, price: newPrice });
              if (next.length > 100) next.shift(); // Keep array size manageable
            }

            return next;
          });
        };
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setLoading(false);
      });
      
    return () => { 
      isMounted = false; 
      if (ws) ws.close();
    };
  }, [symbol, interval]);

  return { history, loading };
}

export function useOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<{bids: [number, number][], asks: [number, number][]}>({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let ws: WebSocket | null = null;
    if (!symbol) return;

    setLoading(true);
    
    // Fetch initial snapshot
    fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=10`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setOrderBook({
          bids: data.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
          asks: data.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
        });
        setLoading(false);

        // Connect to live depth stream (1000ms updates for UI performance)
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth10@1000ms`);
        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          setOrderBook({
            bids: message.bids.map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
            asks: message.asks.map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])])
          });
        };
      })
      .catch(e => {
        console.error(e);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [symbol]);

  return { orderBook, loading };
}
