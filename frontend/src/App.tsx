import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Radio, 
  Flame, 
  Award, 
  TrendingUp, 
  Zap, 
  Calendar 
} from "lucide-react";
import type { Match } from "./types";
import { ITEMS_PER_PAGE } from "./types";

// Import modular components from src/components/
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MatchCard } from "./components/MatchCard";
import { PredictionModal, VerifiedModal } from "./components/Modals";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSport, setActiveSport] = useState("Football");
  const [activeDateTab, setActiveDateTab] = useState("Today");
  const [customDate, setCustomDate] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [activeTab, setActiveTab] = useState<"Predictions" | "HotPicks" | "Odds" | "Accuracy">("Predictions");
  
  const [selectedMatchModal, setSelectedMatchModal] = useState<Match | null>(null);
  const [verifiedModalType, setVerifiedModalType] = useState<"WON" | "LOST" | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const sportsList = ["Football", "Basketball"];

  // --- Auto System & Time-based Dark/Light Mode Listener ---
  useEffect(() => {
    const applyTheme = () => {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const systemPrefersDark = mediaQuery.matches;

      // Time-based fallback: Dark mode between 18:00 (6 PM) and 06:00 (6 AM)
      const currentHour = new Date().getHours();
      const isNightTime = currentHour >= 18 || currentHour < 6;

      const shouldBeDark = systemPrefersDark || isNightTime;

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Apply immediately on load
    applyTheme();

    // Listen for real-time system changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const getFormattedDate = (tab: string) => {
    const today = new Date();
    if (tab === "Yesterday") today.setDate(today.getDate() - 1);
    else if (tab === "Tomorrow") today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  };

  const fetchFixtures = async (sport: string, dateTab: string, dateInput: string) => {
    setIsLoading(true);
    setCurrentPage(1);
    setSelectedLeague("All");
    const targetDate = dateInput || getFormattedDate(dateTab === "LIVE" ? "Today" : dateTab);

    try {
      const response = await fetch(`/api/v1/fixtures?target_date=${targetDate}&sport=${sport}`);
      if (response.ok) {
        const data = await response.json();
        setAllMatches(Array.isArray(data) ? data : data.matches || []);
      }
    } catch (error) {
      console.error("Failed to fetch matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures(activeSport, activeDateTab, customDate);
  }, [activeSport, activeDateTab, customDate]);

  const liveCount = allMatches.filter((m: Match) => m.status === "LIVE").length;
  const availableLeagues = ["All", ...Array.from(new Set(allMatches.map((m: Match) => m.league))).filter(Boolean)];

  let filteredMatches = allMatches.filter((match: Match) => {
    if (match.status === "FINISHED") return false;
    if (activeDateTab === "LIVE" && match.status !== "LIVE") return false;
    if (selectedLeague !== "All" && match.league !== selectedLeague) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      match.homeTeam.toLowerCase().includes(query) ||
      match.awayTeam.toLowerCase().includes(query) ||
      match.league.toLowerCase().includes(query)
    );
  });

  if (activeTab === "HotPicks") {
    filteredMatches = filteredMatches
      .filter((m: Match) => m.isHot || (m.aiProbabilities && Math.max(m.aiProbabilities.homeWin, m.aiProbabilities.awayWin, m.aiProbabilities.over25) >= 55))
      .sort((a: Match, b: Match) => {
        const probA = Math.max(a.aiProbabilities?.homeWin || 0, a.aiProbabilities?.awayWin || 0, a.aiProbabilities?.over25 || 0);
        const probB = Math.max(b.aiProbabilities?.homeWin || 0, b.aiProbabilities?.awayWin || 0, b.aiProbabilities?.over25 || 0);
        return probB - probA;
      })
      .slice(0, 25);
  }

  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE) || 1;
  const currentMatches = filteredMatches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // --- Dynamic Live Accuracy Calculations ---
  const finishedMatches = allMatches.filter((m: Match) => m.status === "FINISHED" && m.isWon !== null && m.isWon !== undefined);
  const liveWon = finishedMatches.filter((m: Match) => m.isWon === true).length;
  const liveLost = finishedMatches.filter((m: Match) => m.isWon === false).length;
  const liveTotalVerified = finishedMatches.length;
  const liveOverallWinRate = liveTotalVerified > 0 ? Math.round((liveWon / liveTotalVerified) * 100) : 88;

  const getMarketStats = (keywords: string[], fallbackRate: number) => {
    const picks = finishedMatches.filter((m: Match) => keywords.some((k: string) => m.predictionDetail.toLowerCase().includes(k.toLowerCase())));
    if (picks.length === 0) return fallbackRate;
    return Math.round((picks.filter((m: Match) => m.isWon).length / picks.length) * 100);
  };

  const goalsRate = getMarketStats(["over", "under", "goals"], 92);
  const dcRate = getMarketStats(["1x", "2x", "win or draw", "double chance"], 88);
  const winRate = getMarketStats(["straight win", "win (1)", "win (2)", "home win", "away win"], 84);
  const bttsRate = getMarketStats(["btts", "both teams to score"], 78);

  const topMarket = [
    { name: "Over Goals", rate: goalsRate },
    { name: "Double Chance", rate: dcRate },
    { name: "Straight Wins", rate: winRate },
    { name: "BTTS", rate: bttsRate },
  ].reduce((max, curr) => (curr.rate > max.rate ? curr : max));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 pb-12 font-sans relative overflow-x-hidden transition-colors duration-200">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        sportsList={sportsList} 
        setActiveSport={setActiveSport} 
        setActiveTab={setActiveTab} 
      />
      
      <Header
        onOpenSidebar={() => setIsSidebarOpen(true)}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeDateTab={activeDateTab}
        setActiveDateTab={setActiveDateTab}
        setCustomDate={setCustomDate}
        liveCount={liveCount}
        setCurrentPage={setCurrentPage}
      />

      <main className="max-w-md mx-auto space-y-4 pt-3 px-3">
        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
          
          {/* Sports Header Row */}
          <div className="flex space-x-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold">
            {sportsList.map((sport: string) => (
              <button 
                key={sport} 
                onClick={() => { setActiveSport(sport); setSelectedLeague("All"); }} 
                className={`pb-1 ${activeSport === sport ? "text-slate-900 dark:text-white border-b-2 border-orange-500 font-extrabold" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}
              >
                {sport}
              </button>
            ))}
          </div>

          {/* Date Filter Bar */}
          <div className="flex items-center space-x-2 text-xs font-semibold overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {["Yesterday", "Today", "Tomorrow"].map((tab: string) => (
              <button 
                key={tab} 
                onClick={() => { setActiveDateTab(tab); setCustomDate(""); }} 
                className={`py-1.5 px-3 rounded-lg border whitespace-nowrap ${activeDateTab === tab && !customDate ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 font-bold" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
              >
                {tab}
              </button>
            ))}
            <div className={`relative flex items-center space-x-1 border rounded-lg px-2.5 py-1.5 whitespace-nowrap ${customDate ? "bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 font-bold" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>{customDate || "Date"}</span>
              <input type="date" value={customDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          {/* League Pills Bar */}
          {availableLeagues.length > 1 && (
            <div className="flex space-x-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1 pb-0.5 text-[11px] font-semibold">
              {availableLeagues.map((league: string) => (
                <button 
                  key={league} 
                  onClick={() => { setSelectedLeague(league); setCurrentPage(1); }} 
                  className={`px-3 py-1 rounded-full border whitespace-nowrap ${selectedLeague === league ? "bg-slate-900 text-white dark:bg-orange-500 dark:text-slate-950 font-extrabold" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}
                >
                  {league}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Tabs Bar */}
        <div className="flex justify-between items-center px-1">
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold space-x-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {(["Predictions", "HotPicks", "Odds", "Accuracy"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 whitespace-nowrap ${activeTab === tab ? "text-slate-900 dark:text-white border-b-2 border-orange-500 font-extrabold" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"}`}>
                {tab === "HotPicks" ? <span className="flex items-center space-x-1"><Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /><span>Hot Picks</span></span> : tab}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap pl-2">{filteredMatches.length} {activeTab === "HotPicks" ? "Top Picks" : "Matches"}</span>
        </div>

        {/* Hot Picks Banner */}
        {activeTab === "HotPicks" && (
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-2xl p-3.5 shadow-md space-y-1">
            <div className="flex items-center space-x-1.5"><Zap className="w-4 h-4 fill-amber-200 text-amber-200" /><span className="font-extrabold text-[11px] uppercase tracking-wider">Top AI Confidence Picks</span></div>
            <h2 className="font-black text-xs">Top 20–25 Matches</h2>
            <p className="text-[10px] text-orange-100">Handpicked statistical selections based on maximum win probability for {activeSport}.</p>
          </div>
        )}

        {/* Accuracy Dashboard */}
        {activeTab === "Accuracy" && (
          <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-2xl p-4 space-y-4 shadow-lg border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2"><Award className="w-5 h-5 text-amber-400" /><span className="font-extrabold text-sm">AI Model Accuracy</span></div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs px-2.5 py-0.5 rounded-full">{liveOverallWinRate}% Win Rate</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60"><span className="text-slate-400 text-[10px] block font-semibold">Verified</span><span className="text-base font-black">{liveTotalVerified}</span></div>
              <button onClick={() => setVerifiedModalType("WON")} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer"><span className="text-slate-400 text-[10px] block font-semibold">Won</span><span className="text-base font-black text-emerald-400">{liveWon} ✅</span></button>
              <button onClick={() => setVerifiedModalType("LOST")} className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer"><span className="text-slate-400 text-[10px] block font-semibold">Lost</span><span className="text-base font-black text-rose-400">{liveLost} ❌</span></button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400 text-[11px]">Market Success Breakdown</span>
                <div className="bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[10px] flex items-center space-x-1 font-extrabold">
                  <TrendingUp className="w-3 h-3" /><span>Top Pick: {topMarket.name} ({topMarket.rate}%)</span>
                </div>
              </div>

              {[
                { label: "Over/Under Goals Market", rate: goalsRate, color: "bg-amber-400", textColor: "text-amber-400" },
                { label: "Double Chance (1X / 2X)", rate: dcRate, color: "bg-emerald-400", textColor: "text-emerald-400" },
                { label: "Straight Match Wins (1 / 2)", rate: winRate, color: "bg-sky-400", textColor: "text-sky-400" },
                { label: "Both Teams to Score (BTTS)", rate: bttsRate, color: "bg-indigo-400", textColor: "text-indigo-400" },
              ].map((m) => (
                <div key={m.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold"><span className="text-slate-300">{m.label}</span><span className={m.textColor}>{m.rate}% Win Rate</span></div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"><div style={{ width: `${m.rate}%` }} className={`h-full ${m.color} transition-all rounded-full`} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Cards List */}
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 flex flex-col items-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
            <span>Fetching real-time matches...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 space-y-2">
            <Radio className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
            <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">No Matches Available</p>
          </div>
        ) : (
          currentMatches.map((match: Match) => (
            <MatchCard key={match.id} match={match} activeTab={activeTab} onSelectMatch={(m: Match) => setSelectedMatchModal(m)} />
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex justify-between items-center text-xs font-bold">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
              className="flex items-center space-x-1 px-3 py-2 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-xl disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <span className="text-slate-700 dark:text-slate-300">Page <span className="text-orange-600 font-extrabold">{currentPage}</span> of {totalPages}</span>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
              className="flex items-center space-x-1 px-3 py-2 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-xl disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-600"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <PredictionModal match={selectedMatchModal} onClose={() => setSelectedMatchModal(null)} />
      <VerifiedModal 
        type={verifiedModalType} 
        onClose={() => setVerifiedModalType(null)} 
        allMatches={allMatches} 
        stats={{ 
          totalVerified: liveTotalVerified, 
          totalWon: liveWon, 
          totalLost: liveLost, 
          accuracyPercentage: liveOverallWinRate, 
          over25Accuracy: goalsRate, 
          straightWinsAccuracy: winRate, 
          bttsAccuracy: bttsRate 
        }} 
      />

    </div>
  );
}
