import React, { useState, useRef } from 'react';
import { useOS } from '../../../context/OSContext';
import { AVATAR_PRESETS } from '../../../config/avatarPresets';
import { UserAvatar } from '../../common/UserAvatar';
import {
  Lock,
  Key,
  Shield,
  Clock,
  User,
  Upload,
  Check,
  AlertCircle,
  LogOut,
  Trash2,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';

export const SecurityLockTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    updateUser,
    logout,
    deleteAccount,
    users,
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

  // Account Deletion Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDeleteUser, setTargetDeleteUser] = useState<typeof currentUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

  const openDeleteModalFor = (userToDelete: typeof currentUser) => {
    setTargetDeleteUser(userToDelete);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
    sounds.playClick();
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteUser) return;
    setIsDeleting(true);
    try {
      await deleteAccount(targetDeleteUser.id);
      setShowDeleteModal(false);
    } catch {
      sounds.playError();
      addNotification('Fehler beim Löschen', 'Konnte das Benutzerkonto nicht vollständig entfernen.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isCurrentAccountTarget = targetDeleteUser?.id === currentUser?.id;
  const isOnlyAccount = users.length <= 1;

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Sicherheit & Benutzerprofil</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          PIN-Schutz, Inaktivitäts-Sperre, Sitzungsverwaltung und Account-Optionen.
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

      {/* 4. Active Session & Logout */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Sitzung & Abmeldung</span>
              <span className="text-[11px] text-zinc-400">
                Angemeldet als <strong className="text-white">{currentUser?.displayName || 'Benutzer'}</strong> (@{currentUser?.username})
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              logout();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.08] hover:bg-red-500/20 text-zinc-200 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all shadow-sm active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Abmelden
          </button>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Das Abmelden beendet deine aktuelle Arbeitssitzung, schließt offene Anwendungsfenster und führt zum Sperrbildschirm. Deine Dateien, Notizen und Einstellungen bleiben dauerhaft gespeichert.
        </p>
      </div>

      {/* 5. Danger Zone: Delete Account */}
      <div className="p-4 rounded-xl bg-red-500/[0.03] border border-red-500/20 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Trash2 className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-red-300 block">Account löschen</span>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                Entfernt dieses Benutzerkonto unwiderruflich von diesem Gerät sowie aus der Cloud-Synchronisation.
                {isOnlyAccount
                  ? ' Da dies das einzige Konto ist, wird ObsidianOS vollständig zurückgesetzt und der Setup-Assistent neu gestartet.'
                  : ` Es verbleiben noch ${users.length - 1} andere(s) Benutzerkonto(en).`}
              </p>
            </div>
          </div>
          <button
            onClick={() => openDeleteModalFor(currentUser)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/40 transition-all shadow-sm active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Account löschen
          </button>
        </div>

        {/* Other Users list if Administrator */}
        {currentUser?.role === 'Administrator' && users.length > 1 && (
          <div className="pt-3 border-t border-red-500/10 space-y-2">
            <span className="text-[11px] text-zinc-400 font-medium block">
              Andere Benutzerkonten verwalten (Administrator):
            </span>
            <div className="space-y-1.5">
              {users
                .filter((u) => u.id !== currentUser.id)
                .map((otherUser) => (
                  <div
                    key={otherUser.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/[0.05]"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={otherUser} size="sm" />
                      <div>
                        <span className="text-xs text-zinc-200 font-medium block">{otherUser.displayName}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">@{otherUser.username} • {otherUser.role}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openDeleteModalFor(otherUser)}
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-300 transition-colors"
                      title={`Account "${otherUser.displayName}" löschen`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && targetDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#161622] border border-red-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-white">Account wirklich löschen?</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/[0.08]">
              <UserAvatar user={targetDeleteUser} size="md" />
              <div>
                <span className="text-xs font-semibold text-white block">{targetDeleteUser.displayName}</span>
                <span className="text-[11px] text-zinc-400 font-mono">@{targetDeleteUser.username}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Diese Aktion ist <strong className="text-red-300">endgültig und unwiderruflich</strong>. Alle zugehörigen persönlichen Dokumente, Ordner, Notizen und Passwörter werden dauerhaft gelöscht.
            </p>

            {isOnlyAccount && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                ⚠️ Hinweis: Dies ist der letzte Account auf dem System. Nach dem Löschen kehrt ObsidianOS zum Setup-Assistenten zurück.
              </div>
            )}

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1.5">
                Gib zur Bestätigung den Account-Namen <strong className="text-white font-mono">{targetDeleteUser.username}</strong> ein:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={targetDeleteUser.username}
                className="w-full bg-black/50 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmText.trim().toLowerCase() !== targetDeleteUser.username.toLowerCase() || isDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white shadow-lg transition-all active:scale-95"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Wird gelöscht...' : 'Unwiderruflich löschen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
