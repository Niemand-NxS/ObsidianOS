import { FileItem, FileType } from '../types';

export const INITIAL_FILES: FileItem[] = [
  // Root Folders
  {
    id: 'folder-docs',
    name: 'Dokumente',
    parentId: null,
    type: 'folder',
    content: '',
    size: 4096,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    isCloudSynced: true,
  },
  {
    id: 'folder-pics',
    name: 'Bilder',
    parentId: null,
    type: 'folder',
    content: '',
    size: 4096,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    isCloudSynced: true,
  },
  {
    id: 'folder-code',
    name: 'Code',
    parentId: null,
    type: 'folder',
    content: '',
    size: 4096,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    isCloudSynced: true,
  },
  {
    id: 'folder-notes',
    name: 'Notizen',
    parentId: null,
    type: 'folder',
    content: '',
    size: 4096,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    isCloudSynced: true,
  },
  {
    id: 'folder-downloads',
    name: 'Downloads',
    parentId: null,
    type: 'folder',
    content: '',
    size: 4096,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    isCloudSynced: true,
  },

  // Document files
  {
    id: 'file-welcome',
    name: 'Willkommen_ObsidianOS.md',
    parentId: 'folder-docs',
    type: 'markdown',
    content: `# Willkommen bei ObsidianOS (v2.4)

Ein minimalistisches, hochperformantes Web-Betriebssystem für flüssiges Arbeiten und kreatives Multitasking.

---

### ✨ Übersicht

1. **Modernes Desktop-Design**:
   - Abgestimmtes Farbkonzept: Mattes Tiefschwarz, Anthrazit-Flächen und frei wählbare Akzentfarben.
   - Flüssige Fenster-Steuerung mit vollwertigem Vollbildmodus und randloser Darstellung.

2. **App Store & Erweiterbarkeit**:
   - Installiere Apps wie 2048 Retro, Pomodoro Fokus, Wetter, Pixel Paint, Krypto Radar und Synthesizer.
   - Generiere eigene Apps per KI-Prompt und führe sie in Echtzeit aus.

3. **Spotlight Schnellsuche**:
   - Drücke jederzeit **Cmd + Leertaste** oder **Strg + Leertaste** für Sofortsuche und Schnellaktionen.
`,
    size: 980,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
    isCloudSynced: true,
  },

  // Notes
  {
    id: 'file-todo',
    name: 'Aufgaben.txt',
    parentId: 'folder-notes',
    type: 'text',
    content: `[ ] Neue Apps im App Store entdecken
[x] Farbthema und Hintergrund anpassen
[ ] Eigene App mit dem KI Prompt Generator erstellen
[x] Wetter-Widget für meine Stadt testen
[ ] Spotlight Schnellbefehle ausprobieren (Cmd+Space)`,
    size: 240,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    isCloudSynced: true,
  },

  // Code files
  {
    id: 'file-matrix',
    name: 'matrix_effect.sh',
    parentId: 'folder-code',
    type: 'code',
    content: `#!/bin/bash
# ObsidianOS Terminal Matrix Stream
echo "Starte Datenstrom..."
for i in {1..20}; do
  echo -e "\\x1b[35m$(openssl rand -hex 16)\\x1b[0m"
  sleep 0.1
done
echo "Abgeschlossen."`,
    size: 210,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    isCloudSynced: true,
  },
  {
    id: 'file-python',
    name: 'sample_script.py',
    parentId: 'folder-code',
    type: 'code',
    content: `import time

def greet(name="ObsidianOS"):
    print(f"Hallo aus {name}!")

if __name__ == "__main__":
    greet()`,
    size: 140,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    isCloudSynced: true,
  },

  // Pictures (SVG illustration)
  {
    id: 'file-pic-abstract',
    name: 'Obsidian_Logo.svg',
    parentId: 'folder-pics',
    type: 'image',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <radialGradient id="grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="violetLine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#7e22ce"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="#121217" stroke="#27272a" stroke-width="2"/>
  <circle cx="100" cy="100" r="70" fill="url(#grad)" opacity="0.4"/>
  <polygon points="100,35 155,75 155,135 100,165 45,135 45,75" fill="none" stroke="url(#violetLine)" stroke-width="4" stroke-linejoin="round"/>
  <polygon points="100,55 135,80 135,120 100,145 65,120 65,80" fill="#18181b" stroke="#a855f7" stroke-width="2"/>
  <circle cx="100" cy="100" r="14" fill="#a855f7"/>
</svg>`,
    size: 1100,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    isCloudSynced: true,
  },
];
