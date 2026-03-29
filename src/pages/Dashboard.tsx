import React, { useMemo } from 'react';
import { useMarkets, useChartData } from '../hooks/useMarkets';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, Globe } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { markets, loading } = useMarkets();
  const { history } = useChartData('BTCUSDT');

  const { topGainers, topLosers, topVolume, btcData } = useMemo(() => {
    const assetsArray = Object.values(markets) as import('../hooks/useMarkets').MarketAsset[];
    return {
      btcData: markets['BTCUSDT'],
      topGainers: [...assetsArray].sort((a, b) => b.change24h - a.change24h).slice(0, 5),
      topLosers: [...assetsArray].sort((a, b) => a.change24h - b.change24h).slice(0, 5),
      topVolume: [...assetsArray].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 5),
    };
  }, [markets]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-zinc-500">Loading market data...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 font-medium">Total Markets</h3>
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-zinc-50">
              {Object.keys(markets).length}
            </span>
            <div className="flex items-center gap-1 mt-2 text-zinc-500 text-sm font-medium">
              <span>USDT Pairs Tracked</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 font-medium">BTC 24h Volume</h3>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-zinc-50">
              ${(btcData?.quoteVolume / 1000000000).toFixed(2)}B
            </span>
            <div className="flex items-center gap-1 mt-2 text-zinc-500 text-sm font-medium">
              <span>Global Market</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 font-medium">BTC Dominance</h3>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-zinc-50">~52%</span>
            <div className="flex items-center gap-1 mt-2 text-zinc-500 text-sm font-medium">
              <span>Estimated</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Chart & Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-50">Bitcoin Overview</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-mono text-zinc-100">${btcData?.price.toLocaleString()}</span>
                <span className={`text-sm font-medium flex items-center ${btcData?.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {btcData?.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(btcData?.change24h || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history || []}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Tooltip 
                  isAnimationActive={false}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#34d399" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#18181b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-zinc-50">Top Gainers</h2>
          </div>
          <div className="space-y-4">
            {topGainers.map((asset, i) => (
              <motion.div 
                key={asset.symbol}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="font-bold text-zinc-100">{asset.symbol.replace('USDT', '')}</h4>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-medium text-zinc-100">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                  <p className="text-xs font-medium flex items-center justify-end text-emerald-400">
                    +{asset.change24h.toFixed(2)}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* More Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-bold text-zinc-50">Top Losers</h2>
          </div>
          <div className="space-y-4">
            {topLosers.map((asset, i) => (
              <div key={asset.symbol} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition-colors">
                <h4 className="font-bold text-zinc-100">{asset.symbol.replace('USDT', '')}</h4>
                <div className="text-right">
                  <p className="font-mono font-medium text-zinc-100">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                  <p className="text-xs font-medium text-red-400">{asset.change24h.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-zinc-50">Top Volume (24h)</h2>
          </div>
          <div className="space-y-4">
            {topVolume.map((asset, i) => (
              <div key={asset.symbol} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition-colors">
                <h4 className="font-bold text-zinc-100">{asset.symbol.replace('USDT', '')}</h4>
                <div className="text-right">
                  <p className="font-mono font-medium text-zinc-100">${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</p>
                  <p className="text-xs font-medium text-zinc-500">${(asset.quoteVolume / 1000000).toFixed(2)}M</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
