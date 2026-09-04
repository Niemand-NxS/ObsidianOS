import React from 'react';
import { Shield, Check, X, FileText, Lock, Globe, Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../../services/soundService';

interface LicenseAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  accentColor: string;
}

export const LicenseAgreementModal: React.FC<LicenseAgreementModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  accentColor,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-[#12131f] border border-white/15 shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  ObsidianOS Lizenzvereinbarung (EULA)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Endbenutzer-Lizenzvertrag & Datenschutzbestimmungen
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClose();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Document Text */}
          <div className="flex-1 px-6 py-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-zinc-300 font-sans border-b border-white/10 custom-scrollbar">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-white">Zero-Knowledge & Lokale Datenhoheit</span>
                ObsidianOS ist darauf ausgelegt, deine Privatsphäre standardmäßig zu schützen. Sämtliche persönlichen Daten, Biometrie (Optic ID) und Dokumente verbleiben auf deinem Gerät und werden nur auf deinen ausdrücklichen Wunsch verschlüsselt synchronisiert.
              </div>
            </div>

            <section className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300">
                § 1. Lizenzgewährung und Nutzungsrechte
              </h4>
              <p>
                Mit der Installation oder Nutzung von ObsidianOS gewährt dir das ObsidianOS-Team eine persönliche, weltweite, nicht übertragbare und nicht ausschließliche Lizenz zur Nutzung der Software auf kompatiblen Endgeräten. Alle geistigen Eigentumsrechte verbleiben bei den jeweiligen Autoren und Urhebern.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300">
                § 2. Biometrie & Optic ID Datenverarbeitung
              </h4>
              <p>
                Die Erfassung von biometrischen Merkmalen (Retina-, Iris- und Gesichtsgeometrie) durch Optic ID erfolgt ausschließlich lokal innerhalb der virtuellen Secure Enclave deines Browsers. Biometrische Rohdaten oder Kamerabilder werden zu keinem Zeitpunkt an externe Server übertragen oder dauerhaft unverschlüsselt gespeichert.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300">
                § 3. Time Machine Backups & Datensicherung
              </h4>
              <p>
                Backups, die über die Time Machine Funktion erstellt oder wiederhergestellt werden, enthalten Systemzustände, App-Daten und Benutzereinstellungen. Der Benutzer ist selbst dafür verantwortlich, exportierte Backup-Dateien sicher aufzubewahren und vor unbefugtem Zugriff Dritter zu schützen.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300">
                § 4. Cloud-Synchronisation & Firebase
              </h4>
              <p>
                Optional aktivierte Cloud-Synchronisationsdienste nutzen Ende-zu-Ende-Verschlüsselungsstandards (AES-256-GCM). Der kryptografische Schlüssel wird direkt aus deinem Benutzer-Passwort abgeleitet. Ohne dieses Master-Passwort können synchronisierte Cloud-Daten nicht entschlüsselt werden.
              </p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-purple-300">
                § 5. Haftungsausschluss & Gewährleistung
              </h4>
              <p>
                ObsidianOS wird im gegenwärtigen Zustand („as is“) und ohne Mängelgewähr zur Verfügung gestellt. Die Entwickler haften nicht für Datenverluste, Hardware-Schäden oder Betriebsunterbrechungen, soweit dies gesetzlich zulässig ist.
              </p>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-black/40 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-zinc-400">
              Version 3.4 • Zuletzt aktualisiert: 2026
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sounds.playClose();
                  onClose();
                }}
                className="px-5 py-2 rounded-full text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Schließen
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2 rounded-full text-xs font-semibold text-white shadow-lg transition-all hover:scale-[1.02] flex items-center gap-1.5"
                style={{ backgroundColor: accentColor }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Akzeptieren & Schließen</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
