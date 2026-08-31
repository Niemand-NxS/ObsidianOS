import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Search,
  Check,
  Tag,
  Clock,
  Eye,
  Edit3,
  Sparkles,
  Pin,
  Download,
  Bold,
  Italic,
  List,
  CheckSquare,
  Code,
  Heading,
  Quote,
  Share2,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: number;
  isPinned?: boolean;
}

const DEFAULT_CATEGORIES = ['Ideen', 'Arbeit', 'Persönlich', 'Sicherheit', 'System'];

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-welcome',
    title: 'Willkommen in ObsidianOS Notizen',
    content: `# Willkommen bei Notizen

Hier kannst du all deine Gedanken, Dokumentationen und Aufgaben festhalten.

### Wichtige Funktionen
- 📝 **Echtzeit-Notizen**: Schreibe und formatiere Markdown direkt im Editor.
- 👁️ **Live Vorschau**: Schalte nahtlos zwischen Schreib- und Leseansicht um.
- 🏷️ **Kategorien & Tags**: Organisiere Notizen nach Themen.
- 📌 **Notizen anheften**: Wichtige Notizen bleiben oben angeheftet.
- 💾 **Automatische Speicherung**: Alle Änderungen werden sofort gesichert.

*Tipp:* Nutze die Formatierungsleiste oben im Editor für schnelle Markdown-Syntax!`,
    category: 'System',
    updatedAt: Date.now() - 3600000 * 2,
    isPinned: true,
  },
  {
    id: 'note-ideas',
    title: 'Krypto & Sicherheitsarchitektur',
    content: `## ObsidianOS Sicherheitskonzept

- **Verschlüsselung**: Lokale Notizen werden im Browser-Speicher und im verschlüsselten Vault abgelegt.
- **Offline First**: Funktioniert auch ohne bestehende Internetverbindung.
- **Design**: Hoher Kontrast im dunklen Cyber-Look mit flüssigen Animationen.`,
    category: 'Sicherheit',
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'note-todo',
    title: 'Projekt-Meilensteine & Roadmap',
    content: `### To-Do Liste
- [x] Notizen Editor mit Live-Speicherung
- [x] Schachspiel mit intelligenter KI & 2-Spieler-Modus
- [x] Live Wetterdaten über weltweite Open-Meteo API
- [x] Sudoku mit 100% mathematischer Eindeutigkeitsgarantie
- [ ] Neue Widget-Designs für das Dashboard`,
    category: 'Ideen',
    updatedAt: Date.now() - 3600000 * 24,
  },
];

export const NotesApp: React.FC = () => {
  const { accentConfig, addNotification, sounds, currentUser } = useOS();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('obsidian_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Keep notes persisted to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('obsidian_notes', JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes to storage:', e);
    }
  }, [notes]);

  // Ensure an active note is always selected
  useEffect(() => {
    if (!notes.find((n) => n.id === activeNoteId)) {
      if (notes.length > 0) {
        setActiveNoteId(notes[0].id);
      }
    }
  }, [notes, activeNoteId]);

  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  }, [notes, activeNoteId]);

  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    notes.forEach((n) => {
      if (n.category && n.category.trim()) {
        set.add(n.category.trim());
      }
    });
    return ['Alle', ...Array.from(set)];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.category && n.category.toLowerCase().includes(q));
        const matchesCategory =
          selectedCategory === 'Alle' || n.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, searchQuery, selectedCategory]);

  const handleTitleChange = (newTitle: string) => {
    if (!activeNote) return;
    setIsSaved(false);
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNote.id) {
          return {
            ...n,
            title: newTitle,
            updatedAt: Date.now(),
          };
        }
        return n;
      })
    );
    setTimeout(() => setIsSaved(true), 400);
  };

  const handleContentChange = (newContent: string) => {
    if (!activeNote) return;
    setIsSaved(false);
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNote.id) {
          return {
            ...n,
            content: newContent,
            updatedAt: Date.now(),
          };
        }
        return n;
      })
    );
    setTimeout(() => setIsSaved(true), 400);
  };

  const handleCategoryChange = (category: string) => {
    if (!activeNote) return;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === activeNote.id) {
          return { ...n, category, updatedAt: Date.now() };
        }
        return n;
      })
    );
    sounds.playToggle();
  };

  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextPinned = !n.isPinned;
          addNotification(
            nextPinned ? 'Angeheftet' : 'Losgelöst',
            `"${n.title}"`,
            'info',
            'Notizen'
          );
          return { ...n, isPinned: nextPinned };
        }
        return n;
      })
    );
    sounds.playClick();
  };

  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: 'note-' + Date.now(),
      title: 'Neue Notiz',
      content: '# Neue Notiz\n\nSchreibe deine Gedanken hier auf...',
      category: selectedCategory !== 'Alle' ? selectedCategory : 'Ideen',
      updatedAt: Date.now(),
      isPinned: false,
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setIsPreviewMode(false);
    sounds.playSuccess();
    addNotification('Notiz erstellt', 'Neue Notiz angelegt.', 'success', 'Notizen');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toDelete = notes.find((n) => n.id === id);
    const filtered = notes.filter((n) => n.id !== id);

    if (filtered.length === 0) {
      const fallback: NoteItem = {
        id: 'note-' + Date.now(),
        title: 'Erste Notiz',
        content: '# Meine Notizen\n\nHier beginnen...',
        category: 'Ideen',
        updatedAt: Date.now(),
      };
      setNotes([fallback]);
      setActiveNoteId(fallback.id);
    } else {
      setNotes(filtered);
      if (activeNoteId === id) {
        setActiveNoteId(filtered[0].id);
      }
    }

    sounds.playClick();
    addNotification('Gelöscht', `"${toDelete?.title || 'Notiz'}" wurde entfernt.`, 'info', 'Notizen');
  };

  // Helper for Markdown formatting buttons
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    if (!textareaRef.current || !activeNote) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = activeNote.content;
    const selectedText = currentText.substring(start, end) || defaultText;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent =
      currentText.substring(0, start) + replacement + currentText.substring(end);

    handleContentChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  };

  // Export note
  const handleExportNote = () => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/[^a-z0-9]/gi, '_') || 'notiz'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playSuccess();
    addNotification('Exportiert', `"${activeNote.title}.md" heruntergeladen.`, 'success', 'Notizen');
  };

  const wordCount = useMemo(() => {
    if (!activeNote?.content) return 0;
    return activeNote.content.trim().split(/\s+/).filter(Boolean).length;
  }, [activeNote?.content]);

  const charCount = useMemo(() => {
    return activeNote?.content?.length || 0;
  }, [activeNote?.content]);

  return (
    <div id="notes-app-root" className="h-full flex flex-row bg-[#0b0b10] text-zinc-200 select-none overflow-hidden font-sans">
      {/* Sidebar: Notes List */}
      <div className="w-72 border-r border-[#27272a]/60 flex flex-col bg-[#111118]/95 shrink-0">
        {/* Top Header Controls */}
        <div className="p-3 border-b border-[#27272a]/50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400"
              style={{ backgroundColor: `${accentConfig.primary}25`, color: accentConfig.primary }}
            >
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span>Notizen ({notes.length})</span>
          </div>

          <button
            onClick={handleCreateNote}
            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all flex items-center gap-1.5 text-xs shadow-sm"
            title="Neue Notiz erstellen"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Neu</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2.5 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Notizen & Inhalte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181824] text-xs text-zinc-100 placeholder-zinc-500 pl-8 pr-3 py-2 rounded-xl border border-white/10 focus:border-purple-500/60 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Categories Chips */}
        <div className="px-2.5 pb-2 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg shrink-0 transition-all font-medium ${
                selectedCategory === cat
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notes Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredNotes.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-30" />
              <p>Keine Notizen gefunden.</p>
              <button
                onClick={handleCreateNote}
                className="text-purple-400 hover:underline text-xs"
              >
                Neue Notiz anlegen
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isCurrent = note.id === activeNote?.id;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    sounds.playClick();
                  }}
                  className={`group relative p-3 rounded-2xl cursor-pointer transition-all flex flex-col gap-1.5 border ${
                    isCurrent
                      ? 'bg-[#1b1b28] border-white/25 shadow-lg'
                      : 'bg-[#14141d]/70 border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {note.title || 'Ohne Titel'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleTogglePin(note.id, e)}
                        className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                          note.isPinned ? 'text-amber-400 opacity-100' : 'text-zinc-500 hover:text-white'
                        }`}
                        title={note.isPinned ? 'Loslösen' : 'Anheften'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                        title="Löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {note.content.replace(/^[#\s\-*]+/gm, '').trim() || 'Leere Notiz...'}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-medium">
                      {note.category || 'Allgemein'}
                    </span>
                    <span>
                      {new Date(note.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor & Content Area */}
      {activeNote ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c12] select-text">
          {/* Editor Header Toolbar */}
          <div className="h-12 border-b border-[#27272a]/60 px-4 flex items-center justify-between bg-[#12121a] select-none gap-3">
            {/* Direct Title Input */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Titel der Notiz..."
                className="w-full bg-transparent text-sm sm:text-base font-bold text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

            {/* Category Selector & Save Indicator */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Category Picker Dropdown */}
              <div className="flex items-center gap-1 bg-white/5 rounded-xl px-2 py-1 border border-white/10 text-xs">
                <Tag className="w-3 h-3 text-zinc-400" />
                <select
                  value={activeNote.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#181824] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pin Toggle */}
              <button
                onClick={() => handleTogglePin(activeNote.id)}
                className={`p-1.5 rounded-xl border transition-all ${
                  activeNote.isPinned
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 border-transparent'
                }`}
                title={activeNote.isPinned ? 'Notiz loslösen' : 'Notiz anheften'}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportNote}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-transparent hover:border-white/10 transition-all"
                title="Als .md exportieren"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Mode Toggle (Edit vs Preview) */}
              <button
                onClick={() => {
                  setIsPreviewMode(!isPreviewMode);
                  sounds.playToggle();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPreviewMode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
              >
                {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isPreviewMode ? 'Editor' : 'Vorschau'}</span>
              </button>
            </div>
          </div>

          {/* Quick Markdown Toolbar (When in Edit Mode) */}
          {!isPreviewMode && (
            <div className="h-9 border-b border-[#27272a]/40 px-4 bg-[#14141e]/70 flex items-center gap-1 select-none overflow-x-auto text-zinc-400">
              <button
                onClick={() => insertFormatting('**', '**', 'Fetter Text')}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Fett"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('*', '*', 'Kursiver Text')}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Kursiv"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <span className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={() => insertFormatting('# ', '', 'Überschrift 1')}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Große Überschrift"
              >
                <Heading className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('### ', '', 'Unterüberschrift')}
                className="px-1.5 py-0.5 rounded text-[11px] font-bold hover:bg-white/10 hover:text-white transition-colors"
                title="Kleine Überschrift"
              >
                H3
              </button>
              <span className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={() => insertFormatting('- ', '', 'Listenpunkt')}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Aufzählung"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('- [ ] ', '', 'Neue Aufgabe')}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Aufgabe / Checkbox"
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('> ', '', 'Zitat')}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Zitat"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertFormatting('`', '`', 'code')}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Code"
              >
                <Code className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1" />

              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <Check className="w-2.5 h-2.5" />
                <span>{isSaved ? 'Gespeichert' : 'Speichere...'}</span>
              </div>
            </div>
          )}

          {/* Main Text Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col bg-[#0c0c12]">
            {isPreviewMode ? (
              <div className="max-w-3xl w-full mx-auto text-zinc-200 text-sm leading-relaxed space-y-4 select-text">
                {activeNote.content.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={idx} className="text-2xl font-bold text-white border-b border-white/15 pb-2 mt-2">
                        {line.replace('# ', '')}
                      </h1>
                    );
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={idx} className="text-xl font-bold text-white mt-4 pb-1 border-b border-white/10">
                        {line.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-base font-semibold text-purple-300 mt-3">
                        {line.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
                    return (
                      <div key={idx} className="flex items-center gap-2 text-zinc-400 line-through">
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{line.replace(/- \[[xX]\] /, '')}</span>
                      </div>
                    );
                  }
                  if (line.startsWith('- [ ] ')) {
                    return (
                      <div key={idx} className="flex items-center gap-2 text-zinc-200">
                        <div className="w-4 h-4 rounded border border-zinc-500 shrink-0" />
                        <span>{line.replace(/- \[ \] /, '')}</span>
                      </div>
                    );
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <li key={idx} className="ml-4 list-disc text-zinc-300">
                        {line.replace(/^[-*]\s+/, '')}
                      </li>
                    );
                  }
                  if (line.startsWith('> ')) {
                    return (
                      <blockquote key={idx} className="border-l-4 border-purple-500/60 pl-3 py-1 text-zinc-400 italic bg-white/[0.02] rounded-r">
                        {line.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  if (line.trim() === '') {
                    return <div key={idx} className="h-3" />;
                  }
                  return (
                    <p key={idx} className="text-zinc-300 leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={activeNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Schreibe deine Gedanken hier auf..."
                className="w-full max-w-3xl mx-auto flex-1 bg-transparent text-zinc-100 text-sm sm:text-base leading-relaxed font-sans resize-none outline-none focus:ring-0"
                spellCheck={true}
                autoFocus
              />
            )}
          </div>

          {/* Footer Stats Bar */}
          <div className="h-7 border-t border-[#27272a]/50 px-4 bg-[#0f0f16] flex items-center justify-between text-[11px] text-zinc-500 select-none">
            <div className="flex items-center gap-4">
              <span>{wordCount} Wörter</span>
              <span>•</span>
              <span>{charCount} Zeichen</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-zinc-600" />
              <span>
                Aktualisiert: {new Date(activeNote.updatedAt).toLocaleDateString()} {new Date(activeNote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          Keine Notiz ausgewählt.
        </div>
      )}
    </div>
  );
};
