import React, { useState, useMemo } from 'react';
import { useMarkets, useChartData, useOrderBook } from '../hooks/useMarkets';
import { ArrowUpRight, ArrowDownRight, Search, Globe, Activity, BarChart3, Layers, Pencil, Minus, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

type DrawingType = 'trendline' | 'horizontal';
interface Drawing {
  id: string;
  type: DrawingType;
  points: { time: string; price: number }[];
}

const TIMEFRAMES = [
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

export function Markets() {
  const { markets, loading: marketsLoading } = useMarkets();
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  
  // Drawing state
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingType | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  
  const { history, loading: chartLoading } = useChartData(selectedPair, timeframe);
  const { orderBook, loading: orderBookLoading } = useOrderBook(selectedPair);

  const filteredMarkets = useMemo(() => {
    return (Object.values(markets) as import('../hooks/useMarkets').MarketAsset[])
      .filter(m => m.symbol.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.quoteVolume - a.quoteVolume);
  }, [markets, search]);

  if (marketsLoading) {
    return <div className="flex items-center justify-center h-full text-zinc-500">Loading global markets...</div>;
  }

  const asset = markets[selectedPair];

  const handleChartClick = (e: any) => {
    if (!activeTool || !e || !e.activeLabel || !e.activePayload) return;
    
    const time = e.activeLabel;
    const price = e.activePayload[0].value;

    if (activeTool === 'horizontal') {
      setDrawings(prev => [...prev, { id: Date.now().toString(), type: 'horizontal', points: [{ time, price }] }]);
      setActiveTool(null);
    } else if (activeTool === 'trendline') {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentDrawing({ id: Date.now().toString(), type: 'trendline', points: [{ time, price }, { time, price }] });
      } else {
        setIsDrawing(false);
        setDrawings(prev => [...prev, { ...currentDrawing!, points: [currentDrawing!.points[0], { time, price }] }]);
        setCurrentDrawing(null);
        setActiveTool(null);
      }
    }
  };

  const handleChartMouseMove = (e: any) => {
    if (isDrawing && currentDrawing && e && e.activeLabel && e.activePayload) {
      const time = e.activeLabel;
      const price = e.activePayload[0].value;
      setCurrentDrawing({ ...currentDrawing, points: [currentDrawing.points[0], { time, price }] });
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Markets List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-[400px] lg:h-full">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-zinc-50">Global Markets</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search pairs (e.g. BTC)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredMarkets.map((a) => (
            <button
              key={a.symbol}
              onClick={() => setSelectedPair(a.symbol)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                selectedPair === a.symbol ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
              }`}
            >
              <div className="text-left">
                <div className="font-bold text-zinc-100 text-sm">{a.symbol.replace('USDT', '')}/USDT</div>
                <div className="text-xs text-zinc-500">Vol: ${(a.quoteVolume / 1000000).toFixed(1)}M</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-zinc-100">${a.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                <div className={`text-xs font-medium ${a.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center & Right - Market Overview */}
      <div className="lg:col-span-3 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2">
        
        {/* Header Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xl text-zinc-300">
                {asset?.symbol.substring(0, 1)}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-zinc-50">{asset?.symbol.replace('USDT', '')}/USDT</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-mono text-zinc-100">${asset?.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                  <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${asset?.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {asset?.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(asset?.change24h || 0).toFixed(2)}% (${Math.abs(asset?.change24hAbs || 0).toFixed(4)})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-zinc-500 mb-1">24h High</div>
                <div className="font-mono text-sm text-zinc-100">${asset?.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">24h Low</div>
                <div className="font-mono text-sm text-zinc-100">${asset?.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">24h Vol ({asset?.symbol.replace('USDT', '')})</div>
                <div className="font-mono text-sm text-zinc-100">{asset?.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">24h Vol (USDT)</div>
                <div className="font-mono text-sm text-zinc-100">${(asset?.quoteVolume / 1000000).toFixed(2)}M</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-[500px]">
          <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-100 font-medium">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Price Chart
              </div>
              
              {/* Drawing Tools */}
              <div className="flex items-center gap-1 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                <button
                  onClick={() => {
                    setActiveTool(activeTool === 'trendline' ? null : 'trendline');
                    setIsDrawing(false);
                    setCurrentDrawing(null);
                  }}
                  className={`p-1.5 rounded-md transition-colors ${activeTool === 'trendline' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                  title="Draw Trendline"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setActiveTool(activeTool === 'horizontal' ? null : 'horizontal');
                    setIsDrawing(false);
                    setCurrentDrawing(null);
                  }}
                  className={`p-1.5 rounded-md transition-colors ${activeTool === 'horizontal' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                  title="Draw Support/Resistance"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setDrawings([]);
                    setIsDrawing(false);
                    setCurrentDrawing(null);
                    setActiveTool(null);
                  }}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 transition-colors"
                  title="Clear All Drawings"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    timeframe === tf.value ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 p-6 relative">
            {chartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={history}
                  onClick={handleChartClick}
                  onMouseMove={handleChartMouseMove}
                  style={{ cursor: activeTool ? 'crosshair' : 'default' }}
                >
                  <defs>
                    <linearGradient id="colorPriceTrade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={asset?.change24h >= 0 ? '#34d399' : '#f87171'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={asset?.change24h >= 0 ? '#34d399' : '#f87171'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#52525b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['dataMin', 'dataMax']} 
                    stroke="#52525b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    orientation="right"
                    width={80}
                  />
                  <Tooltip 
                    isAnimationActive={false}
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    itemStyle={{ color: asset?.change24h >= 0 ? '#34d399' : '#f87171' }}
                  />
                  
                  {/* Render Drawings */}
                  {drawings.map(d => (
                    d.type === 'horizontal' ? (
                      <ReferenceLine key={d.id} y={d.points[0].price} stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" />
                    ) : (
                      <ReferenceLine key={d.id} segment={[{ x: d.points[0].time, y: d.points[0].price }, { x: d.points[1].time, y: d.points[1].price }]} stroke="#eab308" strokeWidth={2} />
                    )
                  ))}
                  {currentDrawing && currentDrawing.type === 'trendline' && (
                    <ReferenceLine segment={[{ x: currentDrawing.points[0].time, y: currentDrawing.points[0].price }, { x: currentDrawing.points[1].time, y: currentDrawing.points[1].price }]} stroke="#eab308" strokeWidth={2} strokeDasharray="3 3" />
                  )}

                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={asset?.change24h >= 0 ? '#34d399' : '#f87171'} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPriceTrade)" 
                    activeDot={{ r: 6, fill: asset?.change24h >= 0 ? '#34d399' : '#f87171', stroke: '#18181b', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Order Book Snapshot */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2 text-zinc-100 font-medium">
              <Layers className="w-5 h-5 text-emerald-400" />
              Order Book Snapshot
            </div>
            <div className="p-4">
              {orderBookLoading ? (
                <div className="text-center text-zinc-500 py-8">Loading order book...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {/* Bids (Buy) */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-2 px-2">
                      <span>Bid Price</span>
                      <span>Amount</span>
                    </div>
                    <div className="space-y-1">
                      {orderBook.bids.map((bid, i) => (
                        <div key={i} className="flex justify-between text-sm px-2 py-1 rounded hover:bg-zinc-800/50 relative overflow-hidden group">
                          <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 -z-10" style={{ width: `${Math.min(100, (bid[1] / orderBook.bids[0][1]) * 100)}%` }}></div>
                          <span className="text-emerald-400 font-mono">{bid[0].toFixed(2)}</span>
                          <span className="text-zinc-300 font-mono">{bid[1].toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Asks (Sell) */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-2 px-2">
                      <span>Ask Price</span>
                      <span>Amount</span>
                    </div>
                    <div className="space-y-1">
                      {orderBook.asks.map((ask, i) => (
                        <div key={i} className="flex justify-between text-sm px-2 py-1 rounded hover:bg-zinc-800/50 relative overflow-hidden group">
                          <div className="absolute left-0 top-0 bottom-0 bg-red-500/10 -z-10" style={{ width: `${Math.min(100, (ask[1] / orderBook.asks[0][1]) * 100)}%` }}></div>
                          <span className="text-red-400 font-mono">{ask[0].toFixed(2)}</span>
                          <span className="text-zinc-300 font-mono">{ask[1].toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Market Statistics */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2 text-zinc-100 font-medium">
              <Activity className="w-5 h-5 text-emerald-400" />
              Market Statistics
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                <span className="text-zinc-400 text-sm">Open Price (24h)</span>
                <span className="text-zinc-100 font-mono font-medium">${asset?.openPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                <span className="text-zinc-400 text-sm">Price Change (24h)</span>
                <span className={`font-mono font-medium ${asset?.change24hAbs >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {asset?.change24hAbs >= 0 ? '+' : ''}{asset?.change24hAbs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                <span className="text-zinc-400 text-sm">Quote Volume (USDT)</span>
                <span className="text-zinc-100 font-mono font-medium">${asset?.quoteVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800/50">
                <span className="text-zinc-400 text-sm">Base Volume ({asset?.symbol.replace('USDT', '')})</span>
                <span className="text-zinc-100 font-mono font-medium">{asset?.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
