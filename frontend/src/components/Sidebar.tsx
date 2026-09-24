import { useState } from "react";
import { X, ChevronDown, ChevronUp, ChevronRight, Flame, Filter } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sportsList: string[];
  setActiveSport: (sport: string) => void;
  setActiveTab: (tab: "Predictions" | "HotPicks" | "Odds" | "Accuracy") => void;
  selectedMarketFilter: string;
  setSelectedMarketFilter: (market: string) => void;
}

export const Sidebar = ({
  isOpen,
  onClose,
  sportsList,
  setActiveSport,
  setActiveTab,
  selectedMarketFilter,
  setSelectedMarketFilter,
}: SidebarProps) => {
  const [openAccordion, setOpenAccordion] = useState<"Predictions" | "HotPicks" | "Odds" | "OUGoals" | null>("Predictions");

  const ouMarkets = [
    { id: "ALL", label: "All Markets (Mixed)" },
    { id: "OU15", label: "Over / Under 1.5 Goals" },
    { id: "OU25", label: "Over / Under 2.5 Goals" },
    { id: "OU35", label: "Over / Under 3.5 Goals" },
    { id: "OU45", label: "Over / Under 4.5 Goals" },
  ];

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs" />
      )}

      <div className={`fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center space-x-1.5">
              <span className="text-orange-600 font-extrabold text-sm">★</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">Micro<span className="text-orange-600">Pulse</span></span>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Predictions Menu */}
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "Predictions" ? null : "Predictions")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-200">
                <span>Predictions</span>
                {openAccordion === "Predictions" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "Predictions" && (
                <div className="bg-white dark:bg-slate-900 py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("Predictions"); onClose(); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between rounded-md">
                      <span>{sport} Predictions</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Over / Under Goals Menu */}
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "OUGoals" ? null : "OUGoals")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-200">
                <span className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-orange-500" />
                  <span>Goal Markets <span className="text-orange-500">(O/U)</span></span>
                </span>
                {openAccordion === "OUGoals" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "OUGoals" && (
                <div className="bg-white dark:bg-slate-900 py-1 pl-8 pr-4 space-y-1">
                  {ouMarkets.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMarketFilter(m.id);
                        setActiveTab("Predictions");
                        onClose();
                      }}
                      className={`w-full py-2 px-3 text-xs font-semibold flex justify-between items-center rounded-lg transition ${
                        selectedMarketFilter === m.id
                          ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{m.label}</span>
                      {selectedMarketFilter === m.id ? (
                        <span className="text-[10px] bg-orange-500 text-white font-black px-1.5 py-0.2 rounded-full">ACTIVE</span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hot Picks Menu */}
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "HotPicks" ? null : "HotPicks")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-200">
                <span className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Hot <span className="text-orange-500">Picks</span></span>
                </span>
                {openAccordion === "HotPicks" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "HotPicks" && (
                <div className="bg-white dark:bg-slate-900 py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("HotPicks"); onClose(); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between rounded-md">
                      <span>{sport} Hot Picks (Top 25)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Odds Menu */}
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "Odds" ? null : "Odds")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800 dark:text-slate-200">
                <span>Odds</span>
                {openAccordion === "Odds" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "Odds" && (
                <div className="bg-white dark:bg-slate-900 py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("Odds"); onClose(); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between rounded-md">
                      <span>{sport} Odds</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
