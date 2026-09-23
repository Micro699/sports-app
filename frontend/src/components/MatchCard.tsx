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
  // Check if match is live (status is "LIVE", or dateTime contains minute marks like 78' / HT / Half)
  const isMatchLive = 
    match.status === "LIVE" || 
    match.dateTime.includes("'") || 
    match.dateTime.toLowerCase().includes("ht") ||
    match.dateTime.toLowerCase().includes("half");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
      
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

      {/* Match Time / Minute */}
      <div className="text-center pt-3 pb-1 px-4">
        <div className={`text-xs font-black ${isMatchLive ? "text-rose-600 animate-pulse" : "text-slate-900"}`}>
          {match.dateTime}
        </div>
        <div className="text-[11px] font-medium text-slate-500">{match.league}</div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-center space-x-3 px-4 py-2">
        <div className="flex items-center space-x-2 text-right justify-end w-2/5">
          <span className="font-extrabold text-xs text-slate-900 leading-tight">{match.homeTeam}</span>
          <img
            src={match.homeLogo}
            alt={match.homeTeam}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }}
          />
        </div>

        <div className="w-1/5 text-center">
          {isMatchLive || match.status === "FINISHED" ? (
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-slate-300 font-bold">VS</span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-left justify-start w-2/5">
          <img
            src={match.awayLogo}
            alt={match.awayTeam}
            className="w-7 h-7 object-contain flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }}
          />
          <span className="font-extrabold text-xs text-slate-900 leading-tight">{match.awayTeam}</span>
        </div>
      </div>

      {/* Odds or Predictions View */}
      {activeTab === "Odds" ? (
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-slate-400 text-[10px] block">1</span>
            <span className="font-bold text-slate-900">{match.odds?.home || "1.90"}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-slate-400 text-[10px] block">X</span>
            <span className="font-bold text-slate-900">{match.odds?.draw || "3.40"}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="text-slate-400 text-[10px] block">2</span>
            <span className="font-bold text-slate-900">{match.odds?.away || "3.80"}</span>
          </div>
        </div>
      ) : (
        <div className="mx-4 my-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
          <div className="text-[11px] text-slate-500 font-medium">{match.predictionTitle}</div>
          <div className="text-xs font-black text-slate-900">{match.predictionDetail}</div>
        </div>
      )}

      {/* Action Button */}
      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
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
