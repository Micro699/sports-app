import React from "react";
import { Flame } from "lucide-react";
import type { Match } from "../types";

const DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png";

interface MatchCardProps {
  match: Match;
  activeTab: string;
  onSelectMatch: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, activeTab, onSelectMatch }) => {
  const isMatchLive = 
    match.status === "LIVE" || 
    match.dateTime.includes("'") || 
    match.dateTime.toLowerCase().includes("ht") ||
    match.dateTime.toLowerCase().includes("half");

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800/80 shadow-md overflow-hidden relative my-3 transition-colors duration-200">
      
      {/* Badges Container (Top Right) */}
      <div className="absolute top-0 right-0 flex items-center z-10">
        {isMatchLive && (
          <div className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center space-x-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>LIVE</span>
          </div>
        )}

        {match.isHot && (
          <div className={`bg-orange-600 text-white font-black text-[10px] px-2.5 py-0.5 flex items-center space-x-0.5 ${!isMatchLive ? "rounded-bl-lg" : ""}`}>
            <span>HOT</span>
            <Flame className="w-3 h-3 text-amber-300" />
          </div>
        )}
      </div>

      {/* Match Time / League */}
      <div className="text-center pt-3 pb-1 px-4">
        <div className={`text-xs font-black ${isMatchLive ? "text-rose-400 animate-pulse" : "text-slate-200"}`}>
          {match.dateTime}
        </div>
        <div className="text-[11px] font-semibold text-slate-400">{match.league}</div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-center space-x-3 px-4 py-2">
        <div className="flex items-center space-x-2 text-right justify-end w-2/5">
          <span className="font-extrabold text-xs text-slate-100 leading-tight">{match.homeTeam}</span>
          <img
            src={match.homeLogo}
            alt={match.homeTeam}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }}
          />
        </div>

        <div className="w-1/5 text-center">
          {isMatchLive || match.status === "FINISHED" ? (
            <span className="text-xs font-black text-slate-100 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-bold">VS</span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-left justify-start w-2/5">
          <img
            src={match.awayLogo}
            alt={match.awayTeam}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }}
          />
          <span className="font-extrabold text-xs text-slate-100 leading-tight">{match.awayTeam}</span>
        </div>
      </div>

      {/* Odds or Predictions View */}
      {activeTab === "Odds" ? (
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-center text-xs">
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 text-[10px] block">1</span>
            <span className="font-bold text-slate-100">{match.odds?.home || "1.90"}</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 text-[10px] block">X</span>
            <span className="font-bold text-slate-100">{match.odds?.draw || "3.40"}</span>
          </div>
          <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 text-[10px] block">2</span>
            <span className="font-bold text-slate-100">{match.odds?.away || "3.80"}</span>
          </div>
        </div>
      ) : (
        <div className="mx-4 my-2 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">{match.predictionTitle}</div>
          <div className="text-xs font-black text-amber-400">{match.predictionDetail}</div>
        </div>
      )}

      {/* Action Button */}
      <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex justify-center">
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
