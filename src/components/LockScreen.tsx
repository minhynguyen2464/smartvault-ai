import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { verifySecretApi } from '../lib/api';

interface LockScreenProps {
  onUnlockSuccess: (passcode: string) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlockSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setErrorMsg(null);
    setIsVerifying(true);

    try {
      const res = await verifySecretApi(passcode.trim());
      if (res.verified) {
        onUnlockSuccess(passcode.trim());
      } else {
        setErrorMsg(res.error || 'Forbidden: Incorrect secret passcode');
      }
    } catch (err: any) {
      setErrorMsg('Forbidden: Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white selection:bg-teal-500 selection:text-slate-950">
      
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Shield Icon Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shadow-inner">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Access Restricted</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Please enter the secret passcode to unlock.
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Secret Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPasscode ? 'text' : 'password'}
                placeholder="Enter secret passcode..."
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isVerifying}
                autoFocus
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-600 font-mono text-sm focus:outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || !passcode.trim()}
            className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Authenticate & Unlock</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
