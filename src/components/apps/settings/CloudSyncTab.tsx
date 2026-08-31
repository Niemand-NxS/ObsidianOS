import React, { useState } from 'react';
import { useOS } from '../../../context/OSContext';
import { Cloud, RefreshCw, CheckCircle2, AlertCircle, Shield, Copy, Check, Server, Database, Key } from 'lucide-react';

export const CloudSyncTab: React.FC = () => {
  const { cloudSync, triggerSync, accentConfig, sounds, addNotification } = useOS();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Erlaube Lese- und Schreibzugriff für ObsidianOS Daten
    match /obsidian_system/{document=**} {
      allow read, write: if true;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    sounds.playSuccess();
    addNotification('Kopiert', 'Firestore Security Rules in die Zwischenablage kopiert.', 'success');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Firebase Cloud & Server-Zulassung</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Echtzeit-Synchronisation, Firestore-Regeln und Status deines Cloud-Backends.
        </p>
      </div>

      {/* 1. Cloud Sync Status Card */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                cloudSync.isSyncing
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : cloudSync.lastError
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Firebase Firestore Status</span>
              <span className="text-[11px] text-zinc-400">
                {cloudSync.isSyncing
                  ? 'Synchronisiere Daten...'
                  : cloudSync.lastError
                  ? `Verbindungswarnung: ${cloudSync.lastError}`
                  : 'Verbunden & Synchronisiert'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              triggerSync();
              sounds.playClick();
            }}
            disabled={cloudSync.isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cloudSync.isSyncing ? 'animate-spin' : ''}`} />
            <span>Jetzt syncen</span>
          </button>
        </div>

        {cloudSync.lastSyncedAt && (
          <div className="text-[10px] text-zinc-500 pt-2 border-t border-white/[0.04]">
            Letzte Synchronisation: {new Date(cloudSync.lastSyncedAt).toLocaleString('de-DE')}
          </div>
        )}
      </div>

      {/* 2. Step-by-Step Guide for Firebase Server Authorization */}
      <div className="p-4 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-3">
        <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>Anleitung: App im Firebase Server zulassen</span>
        </div>

        <p className="text-[11px] text-zinc-300 leading-relaxed">
          Damit diese Web-App auf deine Firebase Firestore Datenbank zugreifen und Einstellungen, Notizen sowie Dateien speichern darf, führe diese 3 Schritte in der Firebase Console aus:
        </p>

        <ol className="space-y-2.5 text-xs text-zinc-300 list-decimal list-inside">
          <li className="p-2.5 rounded-lg bg-black/40 border border-white/[0.05]">
            <span className="font-semibold text-white">Firebase Console öffnen:</span>
            <p className="text-[11px] text-zinc-400 ml-4 mt-0.5">
              Gehe auf <code className="text-purple-300 font-mono">console.firebase.google.com</code> und wähle dein Projekt.
            </p>
          </li>

          <li className="p-2.5 rounded-lg bg-black/40 border border-white/[0.05]">
            <span className="font-semibold text-white">Firestore Security Rules anpassen:</span>
            <p className="text-[11px] text-zinc-400 ml-4 mt-0.5">
              Klicke links auf <b>Firestore Database</b> &gt; Reiter <b>Regeln (Rules)</b> und füge folgende Regeln ein:
            </p>
          </li>
        </ol>

        {/* Code Snippet Box */}
        <div className="relative rounded-lg bg-black/70 border border-purple-500/30 p-3 font-mono text-[11px] text-purple-200">
          <button
            onClick={() => handleCopy(firestoreRulesSnippet, 'rules')}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-sans transition-colors"
          >
            {copiedSection === 'rules' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSection === 'rules' ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
          <pre className="overflow-x-auto pr-20">{firestoreRulesSnippet}</pre>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.05] text-xs">
          <span className="font-semibold text-white">3. Veröffentlichen (Publish):</span>
          <p className="text-[11px] text-zinc-400 ml-4 mt-0.5">
            Klicke auf den blauen Button <b>"Veröffentlichen" (Publish)</b>. Ab diesem Moment synchronisiert die App sofort reibungslos mit deinem Cloud-Server.
          </p>
        </div>
      </div>
    </div>
  );
};
