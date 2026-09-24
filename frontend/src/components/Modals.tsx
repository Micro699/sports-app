import React from "react";
import { X, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import type { Match, AccuracyStats } from "../types";

interface PredictionModalProps {
  match: Match | null;
  onClose: () => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({ match, onClose }) => {
  if (!match) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-sm text-slate-900">{match.homeTeam} vs {match.awayTeam}</h3>
            <p className="text-[10px] text-slate-500">{match.league}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-2 text-xs font-semibold">
          <span className="text-slate-600 text-[11px]">Winning Probabilities</span>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>{match.homeTeam} ({match.aiProbabilities?.homeWin || 45}%)</span>
            <span>Draw ({match.aiProbabilities?.draw || 25}%)</span>
            <span>{match.awayTeam} ({match.aiProbabilities?.awayWin || 30}%)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden">
            <div style={{ width: `${match.aiProbabilities?.homeWin || 45}%` }} className="bg-emerald-500"></div>
            <div style={{ width: `${match.aiProbabilities?.draw || 25}%` }} className="bg-amber-400"></div>
            <div style={{ width: `${match.aiProbabilities?.awayWin || 30}%` }} className="bg-cyan-500"></div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>AI Analytical Breakdown</span>
          </div>
          <p className="text-[11px] text-amber-950 leading-relaxed">{match.aiSummary}</p>
        </div>

        <button onClick={onClose} className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl">
          Close Breakdown
        </button>
      </div>
    </div>
  );
};

interface VerifiedModalProps {
  type: "WON" | "LOST" | null;
  onClose: () => void;
  allMatches: Match[];
  stats?: AccuracyStats;
}

export const VerifiedModal: React.FC<VerifiedModalProps> = ({ type, onClose, allMatches }) => {
  if (!type) return null;
  const filtered = allMatches.filter((m: Match) => m.status === "FINISHED" && m.isWon === (type === "WON"));

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <span className={`font-extrabold text-sm flex items-center space-x-1 ${type === "WON" ? "text-emerald-600" : "text-rose-600"}`}>
            <span>{type === "WON" ? "✅" : "❌"}</span>
            <span>Verified {type} Picks ({filtered.length})</span>
          </span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No verified {type.toLowerCase()} matches recorded for this date.
            </div>
          ) : (
            filtered.map((match: Match) => (
              <div key={match.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-b border-slate-200/60 pb-1">
                  <span>{match.league}</span>
                  <span>{match.dateTime}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-900">{match.homeTeam}</span>
                  <span className="bg-slate-200 text-slate-900 font-black px-2 py-0.5 rounded text-[11px]">
                    {match.homeScore} - {match.awayScore}
                  </span>
                  <span className="font-extrabold text-slate-900">{match.awayTeam}</span>
                </div>
                <div className="flex justify-between items-center pt-1 text-xs">
                  <div className="text-[11px]">
                    <span className="text-slate-500">Pick: </span>
                    <span className="font-black text-slate-900">{match.predictionDetail}</span>
                  </div>
                  <span className={`font-black text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1 ${type === "WON" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {type === "WON" ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                    <span>{type}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl">
          Close History
        </button>
      </div>
    </div>
  );
};
