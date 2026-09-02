import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { BrowserTab } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Plus,
  X,
  Search,
  Globe,
  Bookmark,
  ExternalLink,
  BookOpen,
  MoreVertical,
  Maximize,
  Minimize,
  Copy,
  Printer,
  ZoomIn,
  ZoomOut,
  Layers,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_BOOKMARKS = [
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
  { name: 'Wikipedia', url: 'https://de.wikipedia.org/wiki/Hauptseite', icon: '📖' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '⚡' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/de/', icon: '🌐' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
];

export const BrowserApp: React.FC = () => {
  const { accentConfig, addNotification, sounds, isLight, effectiveGlassContrast } = useOS();
  const isLightMode = isLight || effectiveGlassContrast === 'dark';

  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'DuckDuckGo',
      url: 'https://duckduckgo.com',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      history: ['https://duckduckgo.com'],
      historyIndex: 0,
      zoomLevel: 100,
      isReaderMode: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [urlInput, setUrlInput] = useState('https://duckduckgo.com');
  const [useProxy, setUseProxy] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isFullscreenWeb, setIsFullscreenWeb] = useState(false);
  const [bookmarks, setBookmarks] = useState(DEFAULT_BOOKMARKS);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Navigate to a URL in the active tab (Updates individual tab history)
  const navigateTo = (targetUrl: string) => {
    let finalUrl = targetUrl.trim();
    if (!finalUrl) return;

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        // Search DuckDuckGo
        finalUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setUrlInput(finalUrl);

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;

        const currentHistory = t.history || [t.url];
        const currentIndex = t.historyIndex ?? currentHistory.length - 1;
        
        // Truncate forward history and push new URL
        const nextHistory = [...currentHistory.slice(0, currentIndex + 1), finalUrl];
        const nextIndex = nextHistory.length - 1;

        return {
          ...t,
          url: finalUrl,
          title: finalUrl.replace(/^https?:\/\//, '').split('/')[0] || 'Webseite',
          isLoading: true,
          history: nextHistory,
          historyIndex: nextIndex,
          canGoBack: nextIndex > 0,
          canGoForward: false,
        };
      })
    );

    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, isLoading: false } : t))
      );
    }, 450);
  };

  // Back Button for active tab
  const handleGoBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    sounds.playClick();

    const targetIndex = activeTab.historyIndex - 1;
    const targetUrl = activeTab.history[targetIndex];

    setUrlInput(targetUrl);
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        return {
          ...t,
          url: targetUrl,
          historyIndex: targetIndex,
          canGoBack: targetIndex > 0,
          canGoForward: targetIndex < t.history.length - 1,
          isLoading: true,
        };
      })
    );

    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, isLoading: false } : t))
      );
    }, 300);
  };

  // Forward Button for active tab
  const handleGoForward = () => {
    if (!activeTab || activeTab.historyIndex >= activeTab.history.length - 1) return;
    sounds.playClick();

    const targetIndex = activeTab.historyIndex + 1;
    const targetUrl = activeTab.history[targetIndex];

    setUrlInput(targetUrl);
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        return {
          ...t,
          url: targetUrl,
          historyIndex: targetIndex,
          canGoBack: targetIndex > 0,
          canGoForward: targetIndex < t.history.length - 1,
          isLoading: true,
        };
      })
    );

    setTimeout(() => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, isLoading: false } : t))
      );
    }, 300);
  };

  // Tab management
  const handleCreateTab = () => {
    sounds.playClick();
    const newId = 'tab-' + Date.now();
    const defaultUrl = 'https://duckduckgo.com';
    const newTab: BrowserTab = {
      id: newId,
      title: 'Neuer Tab',
      url: defaultUrl,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      history: [defaultUrl],
      historyIndex: 0,
      zoomLevel: 100,
      isReaderMode: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput(defaultUrl);
  };

  const handleDuplicateTab = () => {
    sounds.playClick();
    const newId = 'tab-' + Date.now();
    const duplicatedTab: BrowserTab = {
      ...activeTab,
      id: newId,
      title: activeTab.title + ' (Kopie)',
      history: [...activeTab.history],
      historyIndex: activeTab.historyIndex,
    };
    setTabs((prev) => [...prev, duplicatedTab]);
    setActiveTabId(newId);
    setIsMoreMenuOpen(false);
    addNotification('Tab dupliziert', `"${activeTab.title}" wurde in einem neuen Tab geöffnet.`, 'info', 'Browser');
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClose();
    if (tabs.length === 1) {
      handleCreateTab();
    }
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) {
      const remaining = tabs.filter((t) => t.id !== tabId);
      if (remaining.length > 0) {
        setActiveTabId(remaining[0].id);
        setUrlInput(remaining[0].url);
      }
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeTab.url);
    sounds.playSuccess();
    addNotification('URL kopiert', activeTab.url, 'success', 'Browser');
    setIsMoreMenuOpen(false);
  };

  const handleAddBookmark = () => {
    if (bookmarks.some((b) => b.url === activeTab.url)) {
      addNotification('Bereits gespeichert', 'Diese Seite ist bereits in deinen Lesezeichen.', 'info', 'Browser');
    } else {
      setBookmarks((prev) => [
        ...prev,
        { name: activeTab.title.slice(0, 18), url: activeTab.url, icon: '⭐' },
      ]);
      sounds.playSuccess();
      addNotification('Lesezeichen hinzugefügt', activeTab.title, 'success', 'Browser');
    }
    setIsMoreMenuOpen(false);
  };

  const handleAdjustZoom = (delta: number) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, zoomLevel: Math.max(50, Math.min(200, (t.zoomLevel || 100) + delta)) }
          : t
      )
    );
  };

  const handleResetZoom = () => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, zoomLevel: 100 } : t))
    );
  };

  const handleToggleReader = () => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, isReaderMode: !t.isReaderMode } : t
      )
    );
    setIsMoreMenuOpen(false);
  };

  const getRenderUrl = (url: string) => {
    if (useProxy) {
      return `/api/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  return (
    <div
      id="browser-app"
      className={`flex flex-col h-full w-full select-none transition-colors ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0e] text-[#f4f4f5]'
      }`}
    >
      {/* Top Tab Bar (Hidden in Fullscreen Web Mode) */}
      {!isFullscreenWeb && (
        <div
          className={`h-10 border-b flex items-center px-2 gap-1 overflow-x-auto shrink-0 transition-colors ${
            isLightMode ? 'bg-slate-200/90 border-slate-300' : 'bg-[#121218] border-[#27272a]/70'
          }`}
        >
          <motion.div layout className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <motion.div
                  layout
                  layoutId={`browser-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setUrlInput(tab.url);
                  }}
                  className={`group max-w-[180px] min-w-[110px] h-8 px-3 rounded-t-xl flex items-center justify-between text-xs cursor-pointer border-t border-x transition-all ${
                    isActive
                      ? isLightMode
                        ? 'bg-white text-slate-900 border-slate-300 shadow-sm font-semibold'
                        : 'bg-[#181822] text-white border-[#3f3f46]/60 shadow-sm font-semibold'
                      : isLightMode
                      ? 'bg-slate-200/50 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-[#0f0f14] text-zinc-400 border-transparent hover:bg-[#14141c] hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{tab.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded-full ml-1 ${
                      isLightMode ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-zinc-700/60 text-zinc-400'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>

          <button
            onClick={handleCreateTab}
            className={`p-1.5 rounded-lg transition-all ml-1 ${
              isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f2a]'
            }`}
            title="Neuer Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Toolbar & URL Bar */}
      <div
        className={`h-12 border-b px-3 flex items-center gap-2 shrink-0 relative transition-colors ${
          isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#161620] border-[#27272a]'
        }`}
      >
        <div className="flex items-center gap-1">
          {/* Back Button (Tab-specific) */}
          <button
            onClick={handleGoBack}
            disabled={!activeTab || activeTab.historyIndex <= 0}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab && activeTab.historyIndex > 0
                ? isLightMode
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  : 'text-zinc-200 hover:text-white hover:bg-[#222230]'
                : isLightMode
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Zurück in diesem Tab"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Forward Button (Tab-specific) */}
          <button
            onClick={handleGoForward}
            disabled={!activeTab || activeTab.historyIndex >= activeTab.history.length - 1}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab && activeTab.historyIndex < activeTab.history.length - 1
                ? isLightMode
                  ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  : 'text-zinc-200 hover:text-white hover:bg-[#222230]'
                : isLightMode
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Vorwärts in diesem Tab"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Reload */}
          <button
            onClick={() => navigateTo(urlInput)}
            className={`p-1.5 rounded-lg transition-colors ${
              isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                : 'text-zinc-400 hover:text-white hover:bg-[#222230]'
            }`}
            title="Neu laden"
          >
            <RotateCw className={`w-4 h-4 ${activeTab.isLoading ? 'animate-spin text-purple-500' : ''}`} />
          </button>

          {/* Home */}
          <button
            onClick={() => navigateTo('https://duckduckgo.com')}
            className={`p-1.5 rounded-lg transition-colors ${
              isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                : 'text-zinc-400 hover:text-white hover:bg-[#222230]'
            }`}
            title="Startseite (DuckDuckGo)"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Omnibox / URL Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(urlInput);
          }}
          className={`flex-1 flex items-center border rounded-xl px-3 py-1.5 gap-2 transition-all ${
            isLightMode
              ? 'bg-white border-slate-300 focus-within:border-purple-500 shadow-sm'
              : 'bg-[#0d0d12] border-[#27272a] focus-within:border-purple-500 shadow-inner'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="URL eingeben oder mit DuckDuckGo suchen..."
            className={`w-full bg-transparent text-xs focus:outline-none font-sans ${
              isLightMode ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-zinc-500'
            }`}
          />
          <button
            type="submit"
            className={isLightMode ? 'text-slate-400 hover:text-purple-600' : 'text-zinc-400 hover:text-purple-400'}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Zoom Indicator */}
        {(activeTab.zoomLevel || 100) !== 100 && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isLightMode
                ? 'text-purple-700 bg-purple-50 border-purple-200 font-semibold'
                : 'text-purple-300 bg-purple-950/40 border-purple-500/30'
            }`}
          >
            {activeTab.zoomLevel}%
          </span>
        )}

        {/* Proxy / Direct Mode Toggle */}
        <button
          onClick={() => setUseProxy(!useProxy)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
            useProxy
              ? isLightMode
                ? 'bg-purple-100 text-purple-700 border-purple-300 font-semibold'
                : 'bg-purple-900/30 text-purple-300 border-purple-500/40'
              : isLightMode
              ? 'bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-[#1e1e28] text-zinc-400 border-zinc-700'
          }`}
          title="Proxy-Modus für externe Webseiten"
        >
          {useProxy ? 'Proxy' : 'Direkt'}
        </button>

        {/* Three Dots "..." More Functions Menu Button */}
        <div className="relative">
          <button
            id="browser-btn-more-options"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`p-1.5 rounded-lg transition-all ${
              isMoreMenuOpen
                ? 'bg-purple-600 text-white'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                : 'text-zinc-400 hover:text-white hover:bg-[#222230]'
            }`}
            title="Weitere Funktionen & Einstellungen"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Three Dots Popover Menu */}
          <AnimatePresence>
            {isMoreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                className={`absolute top-10 right-0 w-64 rounded-2xl backdrop-blur-2xl border shadow-2xl p-1.5 z-50 text-xs space-y-0.5 transition-colors ${
                  isLightMode
                    ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
                    : 'bg-[#14141c]/95 border-[#27272a] text-white'
                }`}
              >
                <div className={`px-3 py-1.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#27272a]/60'}`}>
                  <p className={`font-bold text-xs ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Webseiten-Funktionen</p>
                  <p className={`text-[10px] font-mono truncate ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                    {activeTab.url}
                  </p>
                </div>

                {/* Toggle Fullscreen Web */}
                <button
                  onClick={() => {
                    setIsFullscreenWeb(!isFullscreenWeb);
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left ${
                    isLightMode ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-200 hover:bg-[#22222f] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isFullscreenWeb ? <Minimize className="w-3.5 h-3.5 text-purple-500" /> : <Maximize className="w-3.5 h-3.5 text-purple-500" />}
                    <span>{isFullscreenWeb ? 'Vollbild beenden' : 'Webseite Vollbild'}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>F11</span>
                </button>

                {/* Duplicate Tab */}
                <button
                  onClick={handleDuplicateTab}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left ${
                    isLightMode ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-200 hover:bg-[#22222f] hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Tab duplizieren</span>
                </button>

                {/* Copy URL */}
                <button
                  onClick={handleCopyUrl}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left ${
                    isLightMode ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-200 hover:bg-[#22222f] hover:text-white'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5 text-purple-500" />
                  <span>URL kopieren</span>
                </button>

                {/* Add Bookmark */}
                <button
                  onClick={handleAddBookmark}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left ${
                    isLightMode ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-200 hover:bg-[#22222f] hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  <span>Zu Lesezeichen hinzufügen</span>
                </button>

                {/* Reader Mode */}
                <button
                  onClick={handleToggleReader}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left ${
                    isLightMode ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-200 hover:bg-[#22222f] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                    <span>Leseansicht (Reader)</span>
                  </div>
                  {activeTab.isReaderMode && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>

                <div className={`border-t my-1 ${isLightMode ? 'border-slate-200' : 'border-[#27272a]/60'}`} />

                {/* Zoom Controls */}
                <div className={`px-3 py-1.5 flex items-center justify-between ${isLightMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                  <span className="text-[11px]">Zoom ({activeTab.zoomLevel || 100}%)</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustZoom(-10)}
                      className={`p-1 rounded ${isLightMode ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-zinc-300'}`}
                      title="Verkleinern"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                        isLightMode ? 'hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                      }`}
                      title="100% Zurücksetzen"
                    >
                      100%
                    </button>
                    <button
                      onClick={() => handleAdjustZoom(10)}
                      className={`p-1 rounded ${isLightMode ? 'hover:bg-slate-200 text-slate-700' : 'hover:bg-white/10 text-zinc-300'}`}
                      title="Vergrößern"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Print Page */}
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    window.print();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left ${
                    isLightMode ? 'text-slate-800 hover:bg-slate-100 hover:text-slate-900' : 'text-zinc-200 hover:bg-[#22222f] hover:text-white'
                  }`}
                >
                  <Printer className={`w-3.5 h-3.5 ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                  <span>Drucken / PDF exportieren</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bookmarks Bar (Hidden in Fullscreen Web Mode) */}
      {!isFullscreenWeb && (
        <div
          className={`h-8 border-b px-3 flex items-center gap-2 overflow-x-auto shrink-0 transition-colors ${
            isLightMode ? 'bg-slate-100/70 border-slate-200' : 'bg-[#111117] border-[#27272a]/60'
          }`}
        >
          <Bookmark className="w-3 h-3 text-purple-500 shrink-0" />
          <motion.div layout className="flex items-center gap-2">
            {bookmarks.map((bm, i) => (
              <motion.button
                layout
                layoutId={`bm-${bm.name}`}
                key={i}
                onClick={() => navigateTo(bm.url)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-all whitespace-nowrap ${
                  isLightMode
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-300 shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-[#1a1a24]'
                }`}
              >
                <span>{bm.icon}</span>
                <span>{bm.name}</span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Browser View Area with Fullscreen & Zoom Transform */}
      <div className={`flex-1 relative overflow-hidden ${isLightMode ? 'bg-slate-100' : 'bg-[#09090c]'}`}>
        <div
          className="w-full h-full relative"
          style={{
            transform: `scale(${(activeTab.zoomLevel || 100) / 100})`,
            transformOrigin: 'top left',
            width: `${10000 / (activeTab.zoomLevel || 100)}%`,
            height: `${10000 / (activeTab.zoomLevel || 100)}%`,
          }}
        >
          <iframe
            key={activeTab.url + (useProxy ? '-proxy' : '-direct')}
            src={getRenderUrl(activeTab.url)}
            title={activeTab.title}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
