import React, { useState, useRef } from 'react';
import { useOS } from '../../../context/OSContext';
import { AVATAR_PRESETS } from '../../../config/avatarPresets';
import { UserAvatar } from '../../common/UserAvatar';
import { Lock, Key, Shield, Clock, User, Upload, Check, AlertCircle } from 'lucide-react';

export const SecurityLockTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    updateUser,
    accentConfig,
    sounds,
    addNotification,
  } = useOS();

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || '');
  const [bioInput, setBioInput] = useState(currentUser?.bio || '');
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const timeoutOptions = [
    { value: 0, label: 'Nie' },
    { value: 1, label: '1 Minute' },
    { value: 3, label: '3 Minuten' },
    { value: 5, label: '5 Minuten' },
    { value: 10, label: '10 Minuten' },
    { value: 15, label: '15 Minuten' },
    { value: 30, label: '30 Minuten' },
  ];

  const handleUpdatePin = () => {
    if (!currentUser) return;
    if (currentUser.pin && currentUser.pin !== currentPinInput) {
      addNotification('Falsche aktuelle PIN', 'Die eingegebene aktuelle PIN stimmt nicht überein.', 'error');
      sounds.playError();
      return;
    }
    if (newPinInput.length < 4) {
      addNotification('PIN zu kurz', 'Die PIN muss mindestens 4 Zeichen lang sein.', 'error');
      sounds.playError();
      return;
    }
    if (newPinInput !== confirmPinInput) {
      addNotification('PINs stimmen nicht überein', 'Bitte überprüfe die PIN-Wiederholung.', 'error');
      sounds.playError();
      return;
    }

    updateUser(currentUser.id, { pin: newPinInput });
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    sounds.playSuccess();
    addNotification('Sicherheit aktualisiert', 'Neue PIN wurde erfolgreich gespeichert.', 'success');
  };

  const handleRemovePin = () => {
    if (!currentUser) return;
    if (currentUser.pin && currentUser.pin !== currentPinInput) {
      addNotification('PIN erforderlich', 'Bitte gib die aktuelle PIN ein, um sie zu entfernen.', 'error');
      sounds.playError();
      return;
    }
    updateUser(currentUser.id, { pin: undefined });
    setCurrentPinInput('');
    sounds.playSuccess();
    addNotification('PIN entfernt', 'Sperrbildschirm erfordert kein Passwort mehr.', 'info');
  };

  const handleSaveProfile = () => {
    if (!currentUser) return;
    updateUser(currentUser.id, {
      displayName: displayNameInput.trim() || currentUser.username,
      bio: bioInput.trim(),
    });
    sounds.playSuccess();
    addNotification('Profil aktualisiert', 'Benutzerinformationen wurden gespeichert.', 'success');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Bitte wähle eine Bilddatei.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        updateUser(currentUser.id, { avatar: base64 });
        sounds.playSuccess();
        addNotification('Avatar geändert', 'Eigenes Profilbild erfolgreich hochgeladen.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Sicherheit & Benutzerprofil</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          PIN-Schutz, Inaktivitäts-Sperre und Personalisierung deines Benutzerkontos.
        </p>
      </div>

      {/* 1. User Profile Management */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Benutzerprofil ({currentUser?.username})
        </label>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative group">
            <UserAvatar user={currentUser} size="xl" className="border-2 border-purple-500/40" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs"
              title="Eigenes Bild hochladen"
            >
              <Upload className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-2 w-full">
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Anzeigename</span>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Dein Name..."
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Status / Bio</span>
              <input
                type="text"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Kurze Statusmeldung..."
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Preset Avatars */}
        <div className="pt-2 border-t border-white/[0.05]">
          <span className="text-[11px] text-zinc-400 block mb-2">Preset Avatare auswählen:</span>
          <div className="flex flex-wrap gap-2">
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  if (currentUser) {
                    updateUser(currentUser.id, { avatar: preset.url });
                    sounds.playClick();
                  }
                }}
                className={`p-0.5 rounded-full border transition-transform hover:scale-105 ${
                  currentUser?.avatar === preset.url ? 'border-purple-400 ring-2 ring-purple-500/40' : 'border-white/10'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveProfile}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: accentConfig.primary }}
          >
            Profil speichern
          </button>
        </div>
      </div>

      {/* 2. PIN / Password Protection */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Sperrbildschirm-PIN</span>
              <span className="text-[11px] text-zinc-400">
                {currentUser?.pin ? 'PIN-Schutz ist aktiv' : 'Keine PIN eingerichtet (Ungeschützt)'}
              </span>
            </div>
          </div>
          {currentUser?.pin && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Aktiv
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {currentUser?.pin && (
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Aktuelle PIN</span>
              <input
                type="password"
                maxLength={8}
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="••••"
                className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono tracking-widest text-center"
              />
            </div>
          )}

          <div>
            <span className="text-[11px] text-zinc-400 block mb-1">Neue PIN</span>
            <input
              type="password"
              maxLength={8}
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="••••"
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono tracking-widest text-center"
            />
          </div>

          <div>
            <span className="text-[11px] text-zinc-400 block mb-1">PIN wiederholen</span>
            <input
              type="password"
              maxLength={8}
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              placeholder="••••"
              className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono tracking-widest text-center"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          {currentUser?.pin ? (
            <button
              onClick={handleRemovePin}
              className="text-xs text-red-400 hover:text-red-300 font-medium"
            >
              PIN entfernen
            </button>
          ) : (
            <span />
          )}

          <button
            onClick={handleUpdatePin}
            disabled={!newPinInput || !confirmPinInput}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shadow-sm"
            style={{ backgroundColor: accentConfig.primary }}
          >
            PIN festlegen / ändern
          </button>
        </div>
      </div>

      {/* 3. Inactivity Auto-Lock Timeout */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Inaktivitäts-Sperre (Auto-Lock)
        </label>
        <p className="text-[11px] text-zinc-400">
          Sperrt den Desktop nach einer Zeit ohne Maus- oder Tastaturinteraktion.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeoutOptions.map((opt) => {
            const isSelected = (settings.autoLockMinutes ?? 15) === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  updateSettings({ autoLockMinutes: opt.value });
                  sounds.playToggle();
                }}
                className={`p-2 rounded-lg border text-center text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-white/[0.12] border-white/30 text-white ring-1'
                    : 'bg-black/20 border-white/[0.05] text-zinc-400 hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
