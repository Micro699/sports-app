import { useState } from "react";
import { X, ChevronDown, ChevronUp, ChevronRight, Flame } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sportsList: string[];
  setActiveSport: (sport: string) => void;
  setActiveTab: (tab: "Predictions" | "HotPicks" | "Odds" | "Accuracy") => void;
}

export const Sidebar = ({
  isOpen,
  onClose,
  sportsList,
  setActiveSport,
  setActiveTab,
}: SidebarProps) => {
  const [openAccordion, setOpenAccordion] = useState<"Predictions" | "HotPicks" | "Odds" | null>("Predictions");

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs" />
      )}

      <div className={`fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center space-x-1.5">
              <span className="text-orange-600 font-extrabold text-sm">★</span>
              <span className="text-base font-extrabold text-slate-900">Micro<span className="text-orange-600">Pulse</span></span>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Predictions Menu */}
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "Predictions" ? null : "Predictions")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800">
                <span>Predictions</span>
                {openAccordion === "Predictions" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "Predictions" && (
                <div className="bg-white py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("Predictions"); onClose(); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex justify-between">
                      <span>{sport} Predictions</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Hot Picks Menu */}
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "HotPicks" ? null : "HotPicks")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800">
                <span className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Hot <span className="text-orange-500">Picks</span></span>
                </span>
                {openAccordion === "HotPicks" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "HotPicks" && (
                <div className="bg-white py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("HotPicks"); onClose(); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex justify-between">
                      <span>{sport} Hot Picks (Top 25)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Odds Menu */}
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "Odds" ? null : "Odds")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800">
                <span>Odds</span>
                {openAccordion === "Odds" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "Odds" && (
                <div className="bg-white py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("Odds"); onClose(); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex justify-between">
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
