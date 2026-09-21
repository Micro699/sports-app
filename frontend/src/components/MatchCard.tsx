import React from "react";
import { Flame, CheckCircle2, XCircle } from "lucide-react";
import type { Match } from "../types";

const DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png";

interface MatchCardProps {
  match: Match;
  activeTab: string;
  onSelectMatch: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, activeTab, onSelectMatch }) => {
  const isFinished = match.status === "FINISHED" || match.dateTime === "FT";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
      
      {/* Dynamic Status Badge */}
      {isFinished && match.isWon !== undefined && match.isWon !== null ? (
        <div className={`absolute top-0 right-0 font-black text-[10px] px-3 py-1 rounded-bl-xl flex items-center space-x-1 ${
          match.isWon 
            ? "bg-emerald-600 text-white" 
            : "bg-rose-600 text-white"
        }`}>
          {match.isWon ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          <span className="tracking-wider uppercase font-extrabold">{match.isWon ? "WON" : "LOST"}</span>
        </div>
      ) : match.isHot ? (
        <div className="absolute top-0 right-0 bg-orange-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center space-x-0.5">
          <span>HOT</span>
          <Flame className="w-3 h-3 text-amber-300" />
        </div>
      ) : null}

      <div className="text-center pt-3 pb-1 px-4">
        <div className="text-xs font-extrabold text-slate-900">{match.dateTime}</div>
        <div className="text-[11px] font-medium text-slate-500">{match.league}</div>
      </div>

      <div className="flex items-center justify-center space-x-3 px-4 py-2">
        <div className="flex items-center space-x-2 text-right justify-end w-2/5">
          <span className="font-extrabold text-xs text-slate-900 leading-tight">{match.homeTeam}</span>
          <img src={match.homeLogo} alt={match.homeTeam} className="w-7 h-7 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }} />
        </div>

        <div className="w-1/5 text-center">
          {isFinished || match.status === "LIVE" ? (
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-slate-300 font-bold">VS</span>
          )}
        </div>

        <div className="flex items-center space-x-2 text-left justify-start w-2/5">
          <img src={match.awayLogo} alt={match.awayTeam} className="w-7 h-7 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }} />
          <span className="font-extrabold text-xs text-slate-900 leading-tight">{match.awayTeam}</span>
        </div>
      </div>

      {activeTab === "Odds" ? (
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-center text-xs">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200"><span className="text-slate-400 text-[10px] block">1</span><span className="font-bold text-slate-900">{match.odds.home}</span></div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200"><span className="text-slate-400 text-[10px] block">X</span><span className="font-bold text-slate-900">{match.odds.draw}</span></div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200"><span className="text-slate-400 text-[10px] block">2</span><span className="font-bold text-slate-900">{match.odds.away}</span></div>
        </div>
      ) : (
        <div className="mx-4 my-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
          <div className="text-[11px] text-slate-500 font-medium">{match.predictionTitle}</div>
          <div className="text-xs font-black text-slate-900">{match.predictionDetail}</div>
          
          {/* Prominent Outcome Tag for Accuracy Tab */}
          {isFinished && match.isWon !== undefined && match.isWon !== null && (
            <div className="pt-1">
              <span className={`text-[11px] font-black inline-flex items-center space-x-1 px-3 py-0.5 rounded-full ${
                match.isWon 
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300" 
                  : "bg-rose-100 text-rose-700 border border-rose-300"
              }`}>
                {match.isWon ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                <span>{match.isWon ? "WON" : "LOST"}</span>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
        <button onClick={() => onSelectMatch(match)} className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs py-2.5 rounded-full shadow-xs">
          GET FULL AI PREDICTION
        </button>
      </div>
    </div>
  );
};
