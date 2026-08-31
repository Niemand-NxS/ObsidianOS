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
  const { accentConfig, addNotification, sounds } = useOS();

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
    <div id="browser-app" className="flex flex-col h-full w-full bg-[#0a0a0e] text-[#f4f4f5] select-none">
      {/* Top Tab Bar (Hidden in Fullscreen Web Mode) */}
      {!isFullscreenWeb && (
        <div className="h-10 bg-[#121218] border-b border-[#27272a]/70 flex items-center px-2 gap-1 overflow-x-auto shrink-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setUrlInput(tab.url);
                }}
                className={`group max-w-[180px] min-w-[110px] h-8 px-3 rounded-t-xl flex items-center justify-between text-xs cursor-pointer border-t border-x transition-all ${
                  isActive
                    ? 'bg-[#181822] text-white border-[#3f3f46]/60 shadow-sm font-semibold'
                    : 'bg-[#0f0f14] text-zinc-400 border-transparent hover:bg-[#14141c] hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">{tab.title}</span>
                </div>
                <button
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-zinc-700/60 ml-1"
                >
                  <X className="w-3 h-3 text-zinc-400" />
                </button>
              </div>
            );
          })}

          <button
            onClick={handleCreateTab}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1f1f2a] transition-all ml-1"
            title="Neuer Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Toolbar & URL Bar */}
      <div className="h-12 bg-[#161620] border-b border-[#27272a] px-3 flex items-center gap-2 shrink-0 relative">
        <div className="flex items-center gap-1">
          {/* Back Button (Tab-specific) */}
          <button
            onClick={handleGoBack}
            disabled={!activeTab || activeTab.historyIndex <= 0}
            className={`p-1.5 rounded-lg transition-colors ${
              activeTab && activeTab.historyIndex > 0
                ? 'text-zinc-200 hover:text-white hover:bg-[#222230]'
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
                ? 'text-zinc-200 hover:text-white hover:bg-[#222230]'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            title="Vorwärts in diesem Tab"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Reload */}
          <button
            onClick={() => navigateTo(urlInput)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#222230] transition-colors"
            title="Neu laden"
          >
            <RotateCw className={`w-4 h-4 ${activeTab.isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          {/* Home */}
          <button
            onClick={() => navigateTo('https://duckduckgo.com')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#222230] transition-colors"
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
          className="flex-1 flex items-center bg-[#0d0d12] border border-[#27272a] focus-within:border-purple-500 rounded-xl px-3 py-1.5 gap-2 transition-all shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="URL eingeben oder mit DuckDuckGo suchen..."
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none font-sans"
          />
          <button type="submit" className="text-zinc-400 hover:text-purple-400">
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Zoom Indicator */}
        {(activeTab.zoomLevel || 100) !== 100 && (
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
            {activeTab.zoomLevel}%
          </span>
        )}

        {/* Proxy / Direct Mode Toggle */}
        <button
          onClick={() => setUseProxy(!useProxy)}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
            useProxy
              ? 'bg-purple-900/30 text-purple-300 border-purple-500/40'
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
              isMoreMenuOpen ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-[#222230]'
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
                className="absolute top-10 right-0 w-64 rounded-2xl bg-[#14141c]/95 backdrop-blur-2xl border border-[#27272a] shadow-2xl p-1.5 z-50 text-xs space-y-0.5"
              >
                <div className="px-3 py-1.5 border-b border-[#27272a]/60">
                  <p className="font-bold text-white text-xs">Webseiten-Funktionen</p>
                  <p className="text-[10px] text-zinc-400 font-mono truncate">{activeTab.url}</p>
                </div>

                {/* Toggle Fullscreen Web */}
                <button
                  onClick={() => {
                    setIsFullscreenWeb(!isFullscreenWeb);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-200 hover:bg-[#22222f] hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {isFullscreenWeb ? <Minimize className="w-3.5 h-3.5 text-purple-400" /> : <Maximize className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{isFullscreenWeb ? 'Vollbild beenden' : 'Webseite Vollbild'}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">F11</span>
                </button>

                {/* Duplicate Tab */}
                <button
                  onClick={handleDuplicateTab}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-[#22222f] hover:text-white transition-colors text-left"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tab duplizieren</span>
                </button>

                {/* Copy URL */}
                <button
                  onClick={handleCopyUrl}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-[#22222f] hover:text-white transition-colors text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>URL kopieren</span>
                </button>

                {/* Add Bookmark */}
                <button
                  onClick={handleAddBookmark}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-[#22222f] hover:text-white transition-colors text-left"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zu Lesezeichen hinzufügen</span>
                </button>

                {/* Reader Mode */}
                <button
                  onClick={handleToggleReader}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-200 hover:bg-[#22222f] hover:text-white transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span>Leseansicht (Reader)</span>
                  </div>
                  {activeTab.isReaderMode && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <div className="border-t border-[#27272a]/60 my-1" />

                {/* Zoom Controls */}
                <div className="px-3 py-1.5 flex items-center justify-between text-zinc-300">
                  <span className="text-[11px]">Zoom ({activeTab.zoomLevel || 100}%)</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustZoom(-10)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-300"
                      title="Verkleinern"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="px-1.5 py-0.5 rounded hover:bg-white/10 text-[10px] font-mono text-zinc-400 hover:text-white"
                      title="100% Zurücksetzen"
                    >
                      100%
                    </button>
                    <button
                      onClick={() => handleAdjustZoom(10)}
                      className="p-1 rounded hover:bg-white/10 text-zinc-300"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-[#22222f] hover:text-white transition-colors text-left"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Drucken / PDF exportieren</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bookmarks Bar (Hidden in Fullscreen Web Mode) */}
      {!isFullscreenWeb && (
        <div className="h-8 bg-[#111117] border-b border-[#27272a]/60 px-3 flex items-center gap-2 overflow-x-auto shrink-0">
          <Bookmark className="w-3 h-3 text-purple-400 shrink-0" />
          {bookmarks.map((bm, i) => (
            <button
              key={i}
              onClick={() => navigateTo(bm.url)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-zinc-300 hover:text-white hover:bg-[#1a1a24] transition-all whitespace-nowrap"
            >
              <span>{bm.icon}</span>
              <span>{bm.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Browser View Area with Fullscreen & Zoom Transform */}
      <div className="flex-1 bg-[#09090c] relative overflow-hidden">
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
