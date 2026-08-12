import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, Key, Server, Terminal, RefreshCw } from 'lucide-react';
import { DbStatusResponse, seedDatabaseApi } from '../lib/api';

interface MongoSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatusResponse;
  onRefresh: () => void;
}

export function MongoSetupModal({ isOpen, onClose, dbStatus, onRefresh }: MongoSetupModalProps) {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  if (!isOpen) return null;

  const sampleConnectionString = `MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smartvault?retryWrites=true&w=majority"`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(sampleConnectionString);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await seedDatabaseApi();
      setSeedSuccess(true);
      onRefresh();
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${dbStatus.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                MongoDB Database Configuration
              </h2>
              <p className="text-xs text-slate-400">
                MongoDB Atlas Free Tier (M0) Integration Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Current Connection Status */}
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
          dbStatus.connected
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }`}>
          <div className="flex items-center gap-3">
            {dbStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="text-xs">
              <span className="font-bold text-sm block">
                {dbStatus.connected ? 'Connected to MongoDB Atlas' : 'MongoDB Not Connected (In-Memory Active)'}
              </span>
              <span>
                {dbStatus.connected
                  ? 'All transaction logs and budget caps are actively saved to your MongoDB database.'
                  : 'Add your MONGODB_URI in the Settings / Environment Variables panel to enable live MongoDB storage.'}
              </span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 shrink-0 text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Connection
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            How to setup MongoDB Atlas Free Tier (M0 Cluster)
          </h3>

          <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
            <li className="pl-1">
              <strong className="text-white">Create a Free Account:</strong> Go to{' '}
              <a
                href="https://www.mongodb.com/cloud/atlas/register"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                mongodb.com/cloud/atlas <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and create a free account.
            </li>

            <li className="pl-1">
              <strong className="text-white">Deploy a Free M0 Cluster:</strong> Click <em>Build a Database</em>, choose the <span className="text-emerald-400 font-semibold">M0 FREE</span> tier, select your closest cloud provider/region, and click <em>Create Cluster</em>.
            </li>

            <li className="pl-1">
              <strong className="text-white">Create Database User:</strong> In <em>Database Access</em>, create a user with a password (e.g. username <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">smartvault_user</code>).
            </li>

            <li className="pl-1">
              <strong className="text-white">Allow Network Access:</strong> In <em>Network Access</em>, add IP Address <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">0.0.0.0/0</code> (Allow Access from Anywhere) so your Cloud Run container can connect.
            </li>

            <li className="pl-1">
              <strong className="text-white">Get Connection String:</strong> Click <em>Connect</em> &rarr; <em>Drivers (Node.js)</em> &rarr; Copy the connection string. Replace <code className="text-amber-300">&lt;password&gt;</code> with your DB user password.
            </li>

            <li className="pl-1">
              <strong className="text-white">Configure in AI Studio Secrets:</strong> Open the <strong>Settings</strong> menu in AI Studio UI, add environment variable:
            </li>
          </ol>

          {/* Connection String Copy Box */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Variable Name: <strong className="text-emerald-300">MONGODB_URI</strong>
              </span>
              <button
                onClick={handleCopyEnv}
                className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Sample Format
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-emerald-400 bg-slate-900/80 p-2.5 rounded-lg overflow-x-auto border border-slate-800/80">
              {sampleConnectionString}
            </pre>
          </div>
        </div>

        {/* Database Utilities */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {seedSuccess && <span className="text-emerald-400 font-semibold">Database re-seeded successfully!</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReseed}
              disabled={isReseeding}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
              Reset & Seed Initial Sample Data
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
