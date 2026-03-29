import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Key, Bell, CreditCard, Smartphone } from 'lucide-react';

export function Settings() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-50 mb-8">Settings</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-50 mb-2">Profile Information</h2>
          <p className="text-zinc-400 text-sm">Update your account details and profile picture.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl font-bold">
              {currentUser?.displayName?.[0] || 'U'}
            </div>
            <div>
              <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-sm font-medium transition-colors">
                Change Avatar
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
              <input 
                type="text" 
                defaultValue={currentUser?.displayName || ''}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email Address</label>
              <input 
                type="email" 
                defaultValue={currentUser?.email || ''}
                disabled
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-50 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Security
          </h2>
          <p className="text-zinc-400 text-sm">Manage your security preferences and two-factor authentication.</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-100">Two-Factor Authentication (2FA)</h4>
                <p className="text-sm text-zinc-500">Add an extra layer of security to your account.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 rounded-lg text-sm font-bold transition-colors">
              Enable
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-zinc-100">Password</h4>
                <p className="text-sm text-zinc-500">Last changed 3 months ago.</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-sm font-medium transition-colors">
              Update
            </button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-50 mb-2 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Linked Accounts
          </h2>
          <p className="text-zinc-400 text-sm">Manage your connected bank accounts and wallets.</p>
        </div>
        <div className="p-6">
          <button className="w-full py-4 border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-xl text-zinc-400 hover:text-emerald-400 font-medium transition-colors flex items-center justify-center gap-2">
            + Link Bank Account or Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
