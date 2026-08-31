import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, ArrowUpRight } from 'lucide-react';

interface CryptoItem {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume: string;
  sparkline: number[];
}

const INITIAL_CRYPTOS: CryptoItem[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 64280.5,
    change24h: 3.45,
    volume: '28.4 Mrd. $',
    sparkline: [62000, 62400, 63100, 62900, 63800, 64280],
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3490.2,
    change24h: -1.2,
    volume: '14.2 Mrd. $',
    sparkline: [3550, 3530, 3500, 3480, 3510, 3490],
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    price: 154.8,
    change24h: 6.8,
    volume: '5.1 Mrd. $',
    sparkline: [142, 145, 148, 147, 151, 154],
  },
  {
    id: 'dot',
    name: 'Polkadot',
    symbol: 'DOT',
    price: 7.42,
    change24h: 0.85,
    volume: '820 Mio. $',
    sparkline: [7.2, 7.3, 7.35, 7.38, 7.4, 7.42],
  },
  {
    id: 'avax',
    name: 'Avalanche',
    symbol: 'AVAX',
    price: 28.65,
    change24h: -2.4,
    volume: '450 Mio. $',
    sparkline: [29.5, 29.2, 28.9, 29.0, 28.5, 28.65],
  },
];

export const CryptoRadarApp: React.FC = () => {
  const { sounds, accentConfig } = useOS();
  const [cryptos, setCryptos] = useState<CryptoItem[]>(INITIAL_CRYPTOS);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoItem>(INITIAL_CRYPTOS[0]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCryptos((prev) =>
        prev.map((c) => {
          const deltaPercent = (Math.random() - 0.49) * 0.4;
          const newPrice = Number((c.price * (1 + deltaPercent / 100)).toFixed(2));
          const newChange = Number((c.change24h + deltaPercent).toFixed(2));
          const newSparkline = [...c.sparkline.slice(1), newPrice];
          return {
            ...c,
            price: newPrice,
            change24h: newChange,
            sparkline: newSparkline,
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-[#0a0a0f] text-[#f4f4f5] select-none font-sans overflow-hidden">
      {/* Left List */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-[#27272a]/60 p-4 space-y-3 bg-[#0e0e14]">
        <div className="flex items-center justify-between border-b border-[#27272a]/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Krypto Radar</h2>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live
          </span>
        </div>

        <div className="space-y-2">
          {cryptos.map((coin) => {
            const isSelected = selectedCrypto.id === coin.id;
            const isPositive = coin.change24h >= 0;
            return (
              <div
                key={coin.id}
                onClick={() => {
                  setSelectedCrypto(coin);
                  sounds.playClick();
                }}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1a1a26] border-purple-500/50 shadow-md'
                    : 'bg-[#12121a] border-[#27272a] hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{coin.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{coin.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white block">
                      ${coin.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold flex items-center justify-end ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {coin.change24h}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Detail / Chart View */}
      <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Header of selected coin */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{selectedCrypto.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 font-mono">
                  {selectedCrypto.symbol}
                </span>
              </div>
              <p className="text-xs text-zinc-400">24h Handelsvolumen: {selectedCrypto.volume}</p>
            </div>

            <div className="text-right">
              <span className="text-3xl font-black font-mono text-white block">
                ${selectedCrypto.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full inline-block ${
                  selectedCrypto.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {selectedCrypto.change24h >= 0 ? '+' : ''}
                {selectedCrypto.change24h}% (24h)
              </span>
            </div>
          </div>

          {/* Simulated Chart Line */}
          <div className="p-4 rounded-3xl bg-[#12121a] border border-[#27272a] space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Echtzeit-Trendverlauf</span>
            <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2">
              {selectedCrypto.sparkline.map((val, idx) => {
                const min = Math.min(...selectedCrypto.sparkline) * 0.99;
                const max = Math.max(...selectedCrypto.sparkline) * 1.01;
                const heightPercent = Math.max(15, Math.min(100, ((val - min) / (max - min)) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: selectedCrypto.change24h >= 0 ? '#10b981' : '#ef4444',
                        opacity: 0.3 + (idx / selectedCrypto.sparkline.length) * 0.7,
                      }}
                    />
                    <span className="text-[9px] font-mono text-zinc-500">${Math.round(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
