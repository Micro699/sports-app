import React from "react";
import { Flame } from "lucide-react";
import type { Match } from "../types";

interface MatchCardProps {
  match: Match;
  activeTab: "Predictions" | "HotPicks" | "Odds" | "Accuracy";
  onSelectMatch: (match: Match) => void;
}

const DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png";

export const MatchCard: React.FC<MatchCardProps> = ({ match, activeTab, onSelectMatch }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden relative transition-colors">
      
      {/* Badges */}
      {match.status === "LIVE" ? (
        <div className="absolute top-0 right-0 bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center space-x-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
          <span>LIVE</span>
        </div>
      ) : match.isHot ? (
        <div className="absolute top-0 right-0 bg-orange-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center space-x-0.5">
          <span>HOT</span>
          <Flame className="w-3 h-3 text-amber-300" />
        </div>
      ) : null}

      <div className="text-center pt-3 pb-1 px-4">
        <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{match.dateTime}</div>
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{match.league}</div>
      </div>

      {/* Match Teams */}
      <div className="flex items-center justify-center space-x-3 px-4 py-2">
        <div className="flex items-center space-x-2 text-right justify-end w-2/5">
          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-tight">{match.homeTeam}</span>
          <img 
            src={match.homeLogo} 
            alt={match.homeTeam} 
            className="w-7 h-7 object-contain flex-shrink-0" 
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }} 
          />
        </div>

        <div className="w-1/5 text-center">
          {match.status === "LIVE" ? (
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600 font-bold">VS</span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-left justify-start w-2/5">
          <img 
            src={match.awayLogo} 
            alt={match.awayTeam} 
            className="w-7 h-7 object-contain flex-shrink-0" 
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }} 
          />
          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 leading-tight">{match.awayTeam}</span>
        </div>
      </div>

      {activeTab === "Odds" ? (
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-center text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] block">1</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{match.odds?.home || "1.90"}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] block">X</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{match.odds?.draw || "3.40"}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] block">2</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{match.odds?.away || "3.80"}</span>
          </div>
        </div>
      ) : (
        <div className="mx-4 my-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center space-y-1">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{match.predictionTitle}</div>
          <div className="text-xs font-black text-slate-900 dark:text-slate-100">{match.predictionDetail}</div>
        </div>
      )}

      <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
        <button 
          onClick={() => onSelectMatch(match)} 
          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs py-2.5 rounded-full shadow-xs active:scale-95 transition"
        >
          GET FULL AI PREDICTION
        </button>
      </div>

    </div>
  );
};
