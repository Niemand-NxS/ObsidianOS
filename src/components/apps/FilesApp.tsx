import React, { useState, useMemo } from 'react';
import { useOS } from '../../context/OSContext';
import { FileItem, FileType } from '../../types';
import {
  Folder,
  FileText,
  FileCode,
  Image as ImageIcon,
  Lock,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  Grid,
  List,
  ChevronRight,
  Save,
  CheckCircle2,
  FilePlus,
  FolderPlus,
  ArrowLeft,
  X,
  File,
  Eye,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FilesApp: React.FC = () => {
  const {
    files,
    createFile,
    createFolder,
    updateFile,
    deleteItem,
    uploadHostFile,
    downloadFile,
    accentConfig,
  } = useOS();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Active Editor / Preview modal state
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorFileName, setEditorFileName] = useState('');

  // Quick New Item dialogs
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Current folder items
  const currentItems = useMemo(() => {
    return files.filter((f) => {
      if (searchQuery.trim()) {
        return f.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return f.parentId === currentFolderId;
    });
  }, [files, currentFolderId, searchQuery]);

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Dateien (Root)' }];
    let curr = files.find((f) => f.id === currentFolderId);
    const path: Array<{ id: string | null; name: string }> = [];

    while (curr) {
      path.unshift({ id: curr.id, name: curr.name });
      curr = files.find((f) => f.id === curr?.parentId);
    }

    return [...crumbs, ...path];
  }, [files, currentFolderId]);

  const handleOpenItem = (item: FileItem) => {
    if (item.type === 'folder') {
      setCurrentFolderId(item.id);
      setSelectedFileId(null);
    } else {
      setEditingFile(item);
      setEditorContent(item.content);
      setEditorFileName(item.name);
    }
  };

  const handleSaveEditor = () => {
    if (editingFile) {
      updateFile(editingFile.id, editorContent, editorFileName);
      setEditingFile((prev) => (prev ? { ...prev, content: editorContent, name: editorFileName } : null));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      (Array.from(e.dataTransfer.files) as File[]).forEach((file) => {
        uploadHostFile(file, currentFolderId);
      });
    }
  };

  const getFileIcon = (type: FileType, name: string) => {
    if (type === 'folder') return <Folder className="w-8 h-8 text-purple-400 fill-purple-400/20" />;
    if (type === 'image') return <ImageIcon className="w-8 h-8 text-pink-400" />;
    if (type === 'code') return <FileCode className="w-8 h-8 text-emerald-400" />;
    if (type === 'vault') return <Lock className="w-8 h-8 text-amber-400" />;
    if (type === 'json') return <FileCode className="w-8 h-8 text-cyan-400" />;
    return <FileText className="w-8 h-8 text-zinc-300" />;
  };

  return (
    <div
      id="files-app"
      className="flex h-full w-full bg-[#0c0c10] text-[#f4f4f5] select-none relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag Over Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-purple-950/80 backdrop-blur-md border-2 border-dashed border-purple-400 flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-12 h-12 text-purple-300 animate-bounce" />
          <p className="text-base font-bold text-white mt-2">Dateien hier ablegen</p>
          <p className="text-xs text-purple-200">Automatische Verschlüsselung & Speicherung</p>
        </div>
      )}

      {/* Sidebar with Quick Locations */}
      <div className="w-52 border-r border-[#27272a]/60 bg-[#111116] flex flex-col p-3 gap-1">
        <div className="px-2 py-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Speicherorte</span>
        </div>

        <button
          onClick={() => {
            setCurrentFolderId(null);
            setSearchQuery('');
          }}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
            currentFolderId === null && !searchQuery
              ? 'bg-[#22222e] text-white border border-[#3f3f46]/40 shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-[#181820]'
          }`}
        >
          <Folder className="w-4 h-4 text-purple-400" />
          Alle Dateien
        </button>

        {files
          .filter((f) => f.type === 'folder' && f.parentId === null)
          .map((folder) => {
            const isSelected = currentFolderId === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => {
                  setCurrentFolderId(folder.id);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                  isSelected
                    ? 'bg-[#22222e] text-white border border-[#3f3f46]/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-[#181820]'
                }`}
              >
                <Folder className="w-4 h-4 text-purple-400" />
                {folder.name}
              </button>
            );
          })}

        {/* Cloud sync status info at bottom of sidebar */}
        <div className="mt-auto p-2.5 rounded-xl bg-[#171720] border border-[#27272a]/60 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud-Tresor</span>
          </div>
          <p className="text-[10px] text-zinc-400">Alle Objekte sind E2E mit AES-GCM gesichert.</p>
        </div>
      </div>

      {/* Main Files Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c10]">
        {/* Top Control Bar */}
        <div className="h-12 border-b border-[#27272a]/60 px-4 flex items-center justify-between bg-[#121217]">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-zinc-400 overflow-x-auto max-w-md">
            {currentFolderId && (
              <button
                onClick={() => {
                  const curr = files.find((f) => f.id === currentFolderId);
                  setCurrentFolderId(curr ? curr.parentId : null);
                }}
                className="p-1 rounded hover:bg-[#22222e] text-zinc-300 mr-1"
                title="Ebene höher"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />}
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  className={`hover:text-white truncate max-w-[120px] ${
                    idx === breadcrumbs.length - 1 ? 'font-bold text-white' : ''
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Actions & View Controls */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Dateien filtern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 sm:w-48 pl-8 pr-2.5 py-1.5 rounded-xl bg-[#1a1a24] border border-[#27272a] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* New Folder & File Buttons */}
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#22222e] border border-[#27272a] transition-all"
              title="Neuer Ordner"
            >
              <FolderPlus className="w-4 h-4 text-purple-400" />
            </button>

            <button
              onClick={() => setIsCreatingFile(true)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#22222e] border border-[#27272a] transition-all"
              title="Neue Datei"
            >
              <FilePlus className="w-4 h-4 text-purple-400" />
            </button>

            {/* Host Upload */}
            <label
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-[#22222e] border border-[#27272a] transition-all cursor-pointer"
              title="Datei hochladen"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    (Array.from(e.target.files) as File[]).forEach((f) => uploadHostFile(f, currentFolderId));
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>

            {/* View Mode Toggle */}
            <div className="flex border border-[#27272a] rounded-lg overflow-hidden bg-[#181822]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal: New Item Dialog */}
        {(isCreatingFolder || isCreatingFile) && (
          <div className="p-3 bg-[#171722] border-b border-[#27272a] flex items-center gap-3">
            <span className="text-xs font-semibold text-white">
              {isCreatingFolder ? 'Neuer Ordnername:' : 'Neuer Dateiname (z.B. Notiz.md):'}
            </span>
            <input
              type="text"
              autoFocus
              placeholder={isCreatingFolder ? 'Projektordner' : 'Dokument.md'}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemName.trim()) {
                  if (isCreatingFolder) {
                    createFolder(newItemName.trim(), currentFolderId);
                  } else {
                    const ext = newItemName.endsWith('.md')
                      ? 'markdown'
                      : newItemName.endsWith('.json')
                      ? 'json'
                      : newItemName.endsWith('.js') || newItemName.endsWith('.py')
                      ? 'code'
                      : 'text';
                    createFile(newItemName.trim(), currentFolderId, ext, `# ${newItemName}\n\nInhalt hier...`);
                  }
                  setIsCreatingFile(false);
                  setIsCreatingFolder(false);
                  setNewItemName('');
                } else if (e.key === 'Escape') {
                  setIsCreatingFile(false);
                  setIsCreatingFolder(false);
                  setNewItemName('');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0e0e14] border border-purple-500 text-xs text-white focus:outline-none"
            />
            <button
              onClick={() => {
                if (!newItemName.trim()) return;
                if (isCreatingFolder) {
                  createFolder(newItemName.trim(), currentFolderId);
                } else {
                  createFile(newItemName.trim(), currentFolderId, 'markdown', `# ${newItemName}\n`);
                }
                setIsCreatingFile(false);
                setIsCreatingFolder(false);
                setNewItemName('');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600"
            >
              Erstellen
            </button>
            <button
              onClick={() => {
                setIsCreatingFile(false);
                setIsCreatingFolder(false);
                setNewItemName('');
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        )}

        {/* Files Content Container */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <Folder className="w-12 h-12 text-zinc-700 mb-2" />
              <p className="text-sm font-semibold text-zinc-400">Dieser Ordner ist leer</p>
              <p className="text-xs text-zinc-600 mt-1">Ziehe Dateien hierher oder erstelle neue Dokumente.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {currentItems.map((item) => {
                const isSelected = selectedFileId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFileId(item.id)}
                    onDoubleClick={() => handleOpenItem(item)}
                    className={`group relative p-3 rounded-2xl border flex flex-col items-center text-center cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1e1e2d] border-purple-500/80 ring-1 ring-purple-500/40 shadow-lg'
                        : 'bg-[#121218] border-[#22222a] hover:bg-[#181822] hover:border-[#333342]'
                    }`}
                  >
                    <div className="my-2 transition-transform group-hover:scale-110">
                      {getFileIcon(item.type, item.name)}
                    </div>

                    <p className="text-xs font-semibold text-zinc-200 truncate w-full group-hover:text-white">
                      {item.name}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 font-mono">
                      <span>{item.type === 'folder' ? 'Ordner' : `${item.size} B`}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Verschlüsselt synchronisiert" />
                    </div>

                    {/* Quick action buttons on hover */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.type !== 'folder' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(item.id);
                          }}
                          className="p-1 rounded-md bg-[#22222d] text-zinc-300 hover:text-white hover:bg-purple-600"
                          title="Herunterladen"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}
                      {!item.isProtected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                          className="p-1 rounded-md bg-[#22222d] text-zinc-300 hover:text-red-400 hover:bg-red-950"
                          title="Löschen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="border border-[#22222a] rounded-2xl overflow-hidden bg-[#111116]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#171720] border-b border-[#22222a] text-zinc-400 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Typ</th>
                    <th className="py-2.5 px-4">Größe</th>
                    <th className="py-2.5 px-4">Geändert</th>
                    <th className="py-2.5 px-4 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22222a]">
                  {currentItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedFileId(item.id)}
                      onDoubleClick={() => handleOpenItem(item)}
                      className="hover:bg-[#181822] cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-4 flex items-center gap-2.5 font-medium text-zinc-200">
                        {item.type === 'folder' ? (
                          <Folder className="w-4 h-4 text-purple-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-zinc-400" />
                        )}
                        <span className="truncate max-w-xs">{item.name}</span>
                      </td>
                      <td className="py-2 px-4 text-zinc-400 capitalize">{item.type}</td>
                      <td className="py-2 px-4 text-zinc-400 font-mono">
                        {item.type === 'folder' ? '—' : `${item.size} B`}
                      </td>
                      <td className="py-2 px-4 text-zinc-500 font-mono text-[11px]">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 text-right space-x-1">
                        {item.type !== 'folder' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile(item.id);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-white"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!item.isProtected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Editor & Preview Drawer Modal */}
      <AnimatePresence>
        {editingFile && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute inset-y-0 right-0 w-full md:w-3/5 bg-[#121218] border-l border-[#27272a] shadow-2xl flex flex-col z-30"
          >
            {/* Editor Header */}
            <div className="h-12 border-b border-[#27272a] px-4 flex items-center justify-between bg-[#15151f]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  value={editorFileName}
                  onChange={(e) => setEditorFileName(e.target.value)}
                  className="bg-transparent font-semibold text-xs text-white border-b border-transparent hover:border-zinc-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEditor}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  Speichern
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#22222e]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#0a0a0e]">
              {editingFile.type === 'image' ? (
                <div className="h-full flex items-center justify-center p-4">
                  {editingFile.content.startsWith('<svg') ? (
                    <div
                      className="max-w-xs max-h-xs p-4 bg-[#14141c] rounded-2xl border border-zinc-800"
                      dangerouslySetInnerHTML={{ __html: editingFile.content }}
                    />
                  ) : (
                    <img
                      src={editingFile.content}
                      alt={editingFile.name}
                      className="max-w-full max-h-full rounded-xl object-contain shadow-lg"
                    />
                  )}
                </div>
              ) : (
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="w-full h-full bg-transparent font-mono text-xs text-zinc-200 resize-none focus:outline-none leading-relaxed"
                  placeholder="Inhalt schreiben..."
                  spellCheck={false}
                />
              )}
            </div>

            {/* Editor Footer Status */}
            <div className="h-8 border-t border-[#27272a] px-4 flex items-center justify-between text-[10px] text-zinc-500 bg-[#121217] font-mono">
              <span>
                {editorContent.length} Zeichen • {editorContent.split(/\s+/).filter(Boolean).length} Wörter
              </span>
              <span className="text-emerald-400">AES-GCM verschlüsselter Speicher</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
