'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, ExternalLink, Check, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3DepositProps {
  depositAddress: string;
  coinSymbol: string;
  network?: string;
  onTxSubmitted?: (txHash: string, amount: string) => void;
}

const SUPPORTED_WALLETS = [
  { name: 'MetaMask', icon: '🦊', check: () => typeof window !== 'undefined' && window.ethereum?.isMetaMask },
  { name: 'Trust Wallet', icon: '🛡️', check: () => typeof window !== 'undefined' && window.ethereum?.isTrust },
  { name: 'Coinbase Wallet', icon: '🔵', check: () => typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet },
  { name: 'Phantom', icon: '👻', check: () => typeof window !== 'undefined' && (window as any).phantom?.ethereum },
  { name: 'OKX Wallet', icon: '⭕', check: () => typeof window !== 'undefined' && (window as any).okxwallet },
  { name: 'Rabby', icon: '🐰', check: () => typeof window !== 'undefined' && window.ethereum?.isRabby },
];

const EVM_CHAINS: Record<string, { chainId: string; name: string; rpc: string }> = {
  'ERC-20': { chainId: '0x1', name: 'Ethereum Mainnet', rpc: 'https://eth.llamarpc.com' },
  'Ethereum': { chainId: '0x1', name: 'Ethereum Mainnet', rpc: 'https://eth.llamarpc.com' },
  'BEP-20': { chainId: '0x38', name: 'BNB Smart Chain', rpc: 'https://bsc-dataseed.binance.org' },
  'BSC': { chainId: '0x38', name: 'BNB Smart Chain', rpc: 'https://bsc-dataseed.binance.org' },
  'Polygon': { chainId: '0x89', name: 'Polygon', rpc: 'https://polygon-rpc.com' },
  'Arbitrum': { chainId: '0xa4b1', name: 'Arbitrum One', rpc: 'https://arb1.arbitrum.io/rpc' },
  'Optimism': { chainId: '0xa', name: 'Optimism', rpc: 'https://mainnet.optimism.io' },
  'Avalanche': { chainId: '0xa86a', name: 'Avalanche C-Chain', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  'Base': { chainId: '0x2105', name: 'Base', rpc: 'https://mainnet.base.org' },
};

// Check if coin/network is EVM compatible
function isEvmCompatible(network?: string, symbol?: string): boolean {
  if (!network && !symbol) return false;
  const evmNetworks = ['ERC-20', 'Ethereum', 'BEP-20', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'Base'];
  const evmCoins = ['ETH', 'BNB', 'MATIC', 'AVAX', 'USDT', 'USDC', 'DAI', 'LINK', 'UNI', 'AAVE', 'WBTC'];
  if (network && evmNetworks.some(n => network.toLowerCase().includes(n.toLowerCase()))) return true;
  if (symbol && evmCoins.includes(symbol.toUpperCase())) return true;
  return false;
}

export default function Web3Deposit({ depositAddress, coinSymbol, network, onTxSubmitted }: Web3DepositProps) {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [detectedWallet, setDetectedWallet] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  const evmCompatible = isEvmCompatible(network, coinSymbol);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    for (const w of SUPPORTED_WALLETS) {
      if (w.check()) {
        setDetectedWallet(w.name);
        break;
      }
    }
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          fetchBalance(accounts[0]);
        }
      }).catch(() => {});
    }
  }, []);

  const fetchBalance = useCallback(async (addr: string) => {
    if (!window.ethereum) return;
    try {
      const bal = await window.ethereum.request({ method: 'eth_getBalance', params: [addr, 'latest'] });
      const eth = parseInt(bal, 16) / 1e18;
      setBalance(eth.toFixed(6));
    } catch {}
  }, []);

  async function connectWallet() {
    setError('');
    if (!window.ethereum) {
      setError('No Web3 wallet detected. Please install MetaMask, Trust Wallet, or another Web3 wallet.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setConnected(true);
        await fetchBalance(accounts[0]);

        // Try to switch to the correct chain
        const chainConfig = network ? EVM_CHAINS[network] : EVM_CHAINS['ERC-20'];
        if (chainConfig) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chainConfig.chainId }],
            });
          } catch (switchError: any) {
            // Chain not added, try to add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{ chainId: chainConfig.chainId, chainName: chainConfig.name, rpcUrls: [chainConfig.rpc] }],
                });
              } catch {}
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  }

  async function sendTransaction() {
    if (!window.ethereum || !account || !sendAmount) return;
    setError('');
    setSending(true);

    try {
      const amountWei = '0x' + (parseFloat(sendAmount) * 1e18).toString(16).split('.')[0];

      const tx = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: depositAddress,
          value: amountWei,
          gas: '0x5208', // 21000 gas for simple transfer
        }],
      });

      setTxHash(tx);
      if (onTxSubmitted) onTxSubmitted(tx, sendAmount);
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Transaction rejected by user');
      } else {
        setError(err.message || 'Transaction failed');
      }
    }
    setSending(false);
  }

  if (!evmCompatible) return null;

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center justify-between gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg hover:border-purple-500/50 transition-all"
      >
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-400" />
          <span className="text-purple-300 text-sm font-semibold">
            {connected ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Web3 Wallet'}
          </span>
          {detectedWallet && !connected && (
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">{detectedWallet} detected</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform ${showPanel ? 'rotate-180' : ''}`} />
      </button>

      {showPanel && (
        <div className="mt-2 p-4 bg-dark-800/50 border border-purple-500/20 rounded-lg space-y-4">
          {!connected ? (
            <>
              <p className="text-dark-300 text-xs">Connect your wallet to send {coinSymbol} directly from MetaMask, Trust Wallet, Coinbase Wallet, Phantom, OKX, or any Web3 wallet.</p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {SUPPORTED_WALLETS.map(w => (
                  <div key={w.name} className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center ${w.check() ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-dark-800/50 border border-dark-700/50 opacity-50'}`}>
                    <span className="text-lg">{w.icon}</span>
                    <span className="text-[9px] text-dark-400">{w.name}</span>
                    {w.check() && <span className="text-[8px] text-green-400">✓</span>}
                  </div>
                ))}
              </div>

              <button onClick={connectWallet} className="btn-primary w-full flex items-center justify-center gap-2 !bg-gradient-to-r !from-purple-600 !to-blue-600 !py-3">
                <Wallet className="w-4 h-4" />
                Connect {detectedWallet || 'Wallet'}
              </button>

              {!detectedWallet && (
                <div className="flex flex-col gap-2">
                  <p className="text-dark-400 text-xs text-center">No wallet detected? Install one:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { name: 'MetaMask', url: 'https://metamask.io/download/' },
                      { name: 'Trust Wallet', url: 'https://trustwallet.com/download' },
                      { name: 'Coinbase Wallet', url: 'https://www.coinbase.com/wallet' },
                      { name: 'Phantom', url: 'https://phantom.app/download' },
                    ].map(w => (
                      <a key={w.name} href={w.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1">
                        {w.name} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : txHash ? (
            <div className="text-center py-4">
              <Check className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-semibold text-sm">Transaction Sent!</p>
              <p className="text-dark-400 text-xs mt-1 break-all font-mono">{txHash}</p>
              <p className="text-dark-500 text-xs mt-2">Your deposit will be reviewed and credited shortly.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-xs">Connected Wallet</p>
                  <p className="text-white text-sm font-mono">{account.slice(0, 8)}...{account.slice(-6)}</p>
                </div>
                <div className="text-right">
                  <p className="text-dark-400 text-xs">Balance</p>
                  <p className="text-white text-sm font-mono">{balance} {coinSymbol === 'BNB' ? 'BNB' : coinSymbol === 'MATIC' ? 'MATIC' : 'ETH'}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-dark-300 mb-1.5 font-medium">Amount to Send</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="input-field flex-1"
                    placeholder="0.00"
                    step="any"
                    min="0"
                  />
                  <button
                    onClick={() => setSendAmount(balance)}
                    className="btn-secondary !py-2 text-xs"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="bg-dark-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-dark-400">Sending to</span>
                  <span className="text-white font-mono text-[10px]">{depositAddress.slice(0, 10)}...{depositAddress.slice(-8)}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-dark-400">Network</span>
                  <span className="text-white">{network || 'Ethereum'}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-dark-400">Est. Gas</span>
                  <span className="text-white">~21,000 (standard transfer)</span>
                </div>
              </div>

              <button
                onClick={sendTransaction}
                disabled={sending || !sendAmount || parseFloat(sendAmount) <= 0}
                className="btn-primary w-full flex items-center justify-center gap-2 !bg-gradient-to-r !from-purple-600 !to-blue-600 !py-3 disabled:opacity-50"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Confirming in Wallet...</>
                ) : (
                  <><Wallet className="w-4 h-4" /> Send {sendAmount || '0'} {coinSymbol}</>
                )}
              </button>

              <button
                onClick={() => { setConnected(false); setAccount(''); setBalance(''); }}
                className="text-dark-500 text-xs text-center w-full hover:text-dark-300"
              >
                Disconnect Wallet
              </button>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
