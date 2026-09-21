import React from "react";
import { X, TrendingUp, CheckCircle, XCircle } from "lucide-react";
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
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700 block">Win Probabilities (AI Model)</span>
          <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
            <span>{match.homeTeam} ({match.aiProbabilities?.homeWin || 0}%)</span>
            <span>Draw ({match.aiProbabilities?.draw || 0}%)</span>
            <span>{match.awayTeam} ({match.aiProbabilities?.awayWin || 0}%)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden">
            <div style={{ width: `${match.aiProbabilities?.homeWin || 0}%` }} className="bg-emerald-500" />
            <div style={{ width: `${match.aiProbabilities?.draw || 0}%` }} className="bg-amber-400" />
            <div style={{ width: `${match.aiProbabilities?.awayWin || 0}%` }} className="bg-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-400">Over 2.5 Goals</div>
            <div className="font-extrabold text-slate-900">{match.aiProbabilities?.over25 || 0}%</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-400">Both Teams Score</div>
            <div className="font-extrabold text-slate-900">{match.aiProbabilities?.btts || 0}%</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>AI Match Breakdown</span>
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
  stats: AccuracyStats;
}

export const VerifiedModal: React.FC<VerifiedModalProps> = ({ type, onClose, allMatches }) => {
  if (!type) return null;

  const filtered = allMatches.filter((m) => (type === "WON" ? m.isWon === true : m.isWon === false));

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            {type === "WON" ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
            <h3 className="font-black text-sm text-slate-900">
              Verified {type === "WON" ? "Won" : "Lost"} Matches ({filtered.length})
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No verified {type.toLowerCase()} matches recorded yet.</p>
          ) : (
            filtered.map((match) => (
              <div key={match.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{match.league}</span>
                  <span className="font-bold text-slate-700">Score: {match.homeScore} - {match.awayScore}</span>
                </div>
                <div className="font-bold text-slate-900">{match.homeTeam} vs {match.awayTeam}</div>
                <div className="text-[11px] font-semibold text-orange-600">Pick: {match.predictionDetail}</div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl">
          Close
        </button>
      </div>
    </div>
  );
};
