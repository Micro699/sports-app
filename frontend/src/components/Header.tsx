import React from "react";
import { Menu, Search, Globe, X } from "lucide-react";

export interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeDateTab: string;
  setActiveDateTab: React.Dispatch<React.SetStateAction<string>>;
  setCustomDate: React.Dispatch<React.SetStateAction<string>>;
  liveCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  setIsSidebarOpen,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  activeDateTab,
  setActiveDateTab,
  setCustomDate,
  liveCount
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 text-slate-800 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-extrabold text-slate-900 flex items-center space-x-1">
            <span className="text-orange-600 font-extrabold">★</span>
            <span>
              Micro<span className="text-orange-600">Pulse</span>
            </span>
          </span>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery("");
            }}
            className={`p-1.5 rounded-lg transition ${
              isSearchOpen
                ? "bg-orange-100 text-orange-600"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setActiveDateTab("LIVE");
              setCustomDate("");
            }}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition text-xs font-black ${
              activeDateTab === "LIVE"
                ? "bg-rose-50 border-rose-500 text-rose-600 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span>LIVE</span>
            {liveCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeDateTab === "LIVE"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {liveCount}
              </span>
            )}
          </button>

          <Globe className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      {isSearchOpen && (
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center space-x-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or league..."
              className="w-full bg-slate-100 text-slate-900 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-200 focus:outline-none focus:border-orange-500"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
