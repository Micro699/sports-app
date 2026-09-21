import React, { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Globe, 
  TrendingUp, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Award,
  Search,
  Calendar,
  Radio
} from "lucide-react";

interface Odds {
  home: string;
  draw: string;
  away: string;
}

interface AiProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  btts: number;
}

interface Match {
  id: string;
  sport: string;
  league: string;
  dateTime: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  status: "UPCOMING" | "LIVE" | "FINISHED";
  homeScore: number;
  awayScore: number;
  isHot: boolean;
  predictionTitle: string;
  predictionDetail: string;
  odds: Odds;
  aiProbabilities: AiProbabilities;
  aiSummary: string;
  isWon?: boolean | null;
}

interface AccuracyStats {
  totalVerified: number;
  totalWon: number;
  totalLost: number;
  accuracyPercentage: number;
  over25Accuracy: number;
  straightWinsAccuracy: number;
  bttsAccuracy: number;
}

const DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png";
const ITEMS_PER_PAGE = 10;

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<"Predictions" | "Odds" | null>("Predictions");
  const [activeSport, setActiveSport] = useState("Football");
  const [activeDateTab, setActiveDateTab] = useState("Today");
  const [customDate, setCustomDate] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [activeTab, setActiveTab] = useState<"Predictions" | "Odds" | "Accuracy">("Predictions");
  const [selectedMatchModal, setSelectedMatchModal] = useState<Match | null>(null);

  // Clickable Verified Picks Modal State ("WON" | "LOST" | null)
  const [verifiedModalType, setVerifiedModalType] = useState<"WON" | "LOST" | null>(null);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Match & Accuracy State
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [accuracyStats, setAccuracyStats] = useState<AccuracyStats>({
    totalVerified: 32,
    totalWon: 28,
    totalLost: 4,
    accuracyPercentage: 88,
    over25Accuracy: 89,
    straightWinsAccuracy: 84,
    bttsAccuracy: 78
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const sportsList = ["Football", "Basketball"];
  const topLeagues = ["All", "Premier League", "La Liga", "Serie A", "Bundesliga", "Champions League", "Europa League"];

  const getFormattedDate = (tab: string) => {
    const today = new Date();
    if (tab === "Yesterday") today.setDate(today.getDate() - 1);
    else if (tab === "Tomorrow") today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  };

  const fetchFixtures = async (sport: string, dateTab: string, dateInput: string) => {
    setIsLoading(true);
    setCurrentPage(1);
    const targetDate = dateInput || getFormattedDate(dateTab === "LIVE" ? "Today" : dateTab);
    
    try {
      // Relative path so it works locally AND on Render
      const response = await fetch(
        `/api/v1/fixtures?target_date=${targetDate}&sport=${sport}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAllMatches(data);
        } else if (data.matches) {
          setAllMatches(data.matches);
          if (data.accuracyStats) {
            setAccuracyStats(data.accuracyStats);
          }
        }
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

  // Count active live matches
  const liveCount = allMatches.filter((m) => m.status === "LIVE").length;

  // Filter Matches: Handle LIVE tab, League Pills, and Search
  const filteredMatches = allMatches.filter((match) => {
    // 1. Filter for LIVE tab
    if (activeDateTab === "LIVE" && match.status !== "LIVE") {
      return false;
    }

    // 2. League Pill Filter
    if (
      selectedLeague !== "All" &&
      !match.league.toLowerCase().includes(selectedLeague.toLowerCase())
    ) {
      return false;
    }

    // 3. Search query filter
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      match.homeTeam.toLowerCase().includes(query) ||
      match.awayTeam.toLowerCase().includes(query) ||
      match.league.toLowerCase().includes(query)
    );
  });

  // Client-Side Pagination Slicing
  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE) || 1;
  const currentMatches = filteredMatches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans relative overflow-x-hidden">
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs" />
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center space-x-1.5">
              <span className="text-orange-600 font-extrabold text-sm">★</span>
              <span className="text-base font-extrabold text-slate-900">Micro<span className="text-orange-600">Pulse</span></span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>

          <div className="divide-y divide-slate-100">
            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "Predictions" ? null : "Predictions")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800">
                <span>Predictions</span>
                {openAccordion === "Predictions" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "Predictions" && (
                <div className="bg-white py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("Predictions"); setIsSidebarOpen(false); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex justify-between">
                      <span>{sport} Predictions</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setOpenAccordion(openAccordion === "Odds" ? null : "Odds")} className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-slate-800">
                <span>Odds</span>
                {openAccordion === "Odds" ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccordion === "Odds" && (
                <div className="bg-white py-1 pl-8 pr-4 space-y-1">
                  {sportsList.map((sport) => (
                    <button key={sport} onClick={() => { setActiveSport(sport); setActiveTab("Odds"); setIsSidebarOpen(false); }} className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex justify-between">
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

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-slate-800 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-lg font-extrabold text-slate-900 flex items-center space-x-1">
              <span className="text-orange-600 font-extrabold">★</span>
              <span>Micro<span className="text-orange-600">Pulse</span></span>
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button 
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery("");
              }} 
              className={`p-1.5 rounded-lg transition ${isSearchOpen ? "bg-orange-100 text-orange-600" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setActiveDateTab("LIVE"); setCustomDate(""); }}
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
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeDateTab === "LIVE" ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-700"
                }`}>
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
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

      {/* Feed Area */}
      <div className="max-w-md mx-auto space-y-4 pt-3 px-3">
        
        {/* Filters Row */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-3">
          
          {/* Sports Header */}
          <div className="flex space-x-6 overflow-x-auto border-b border-slate-100 pb-2 text-xs font-bold">
            {sportsList.map((sport) => (
              <button 
                key={sport} 
                onClick={() => { setActiveSport(sport); setSelectedLeague("All"); }} 
                className={`pb-1 ${activeSport === sport ? "text-slate-900 border-b-2 border-orange-500 font-extrabold" : "text-slate-400"}`}
              >
                {sport}
              </button>
            ))}
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center space-x-2 text-xs font-semibold overflow-x-auto">
            {["Yesterday", "Today", "Tomorrow"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => { setActiveDateTab(tab); setCustomDate(""); }} 
                className={`py-1.5 px-3 rounded-lg border ${
                  activeDateTab === tab && !customDate 
                    ? "bg-orange-50 border-orange-500 text-orange-600 font-bold" 
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
            
            <div className={`relative flex items-center justify-between space-x-1 border rounded-lg px-2.5 py-1.5 transition whitespace-nowrap ${customDate ? "bg-orange-50 border-orange-500 text-orange-600 font-bold" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <div className="flex items-center space-x-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{customDate || "Date"}</span>
              </div>
              <input 
                type="date" 
                value={customDate} 
                onChange={(e) => setCustomDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>
          </div>

          {/* League Filter Pills */}
          <div className="flex space-x-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none text-[11px] font-semibold">
            {topLeagues.map((league) => (
              <button
                key={league}
                onClick={() => {
                  setSelectedLeague(league);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                  selectedLeague === league
                    ? "bg-slate-900 text-white border-slate-900 font-extrabold shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {league}
              </button>
            ))}
          </div>

        </div>

        {/* View Tabs Header */}
        <div className="flex justify-between items-center px-1">
          <div className="flex border-b border-slate-200 text-xs font-bold space-x-6">
            {(["Predictions", "Odds", "Accuracy"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 ${activeTab === tab ? "text-slate-900 border-b-2 border-orange-500 font-extrabold" : "text-slate-400"}`}>
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-bold">
            {filteredMatches.length} {activeDateTab === "LIVE" ? "In-Play" : "Matches"}
          </span>
        </div>

        {/* Accuracy Dashboard View */}
        {activeTab === "Accuracy" && accuracyStats && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-4 shadow-lg border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-sm text-slate-100">AI Model Accuracy</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs px-2.5 py-0.5 rounded-full">
                {accuracyStats.accuracyPercentage}% Win Rate
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block font-semibold">Verified Picks</span>
                <span className="text-base font-black text-slate-100">{accuracyStats.totalVerified}</span>
              </div>

              <button
                onClick={() => setVerifiedModalType("WON")}
                className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 hover:border-emerald-500/60 hover:bg-slate-800 transition active:scale-95 text-center cursor-pointer"
              >
                <span className="text-slate-400 text-[10px] block font-semibold">Won</span>
                <span className="text-base font-black text-emerald-400 flex items-center justify-center space-x-1">
                  <span>{accuracyStats.totalWon}</span>
                  <span className="text-[10px]">✅</span>
                </span>
              </button>

              <button
                onClick={() => setVerifiedModalType("LOST")}
                className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 hover:border-rose-500/60 hover:bg-slate-800 transition active:scale-95 text-center cursor-pointer"
              >
                <span className="text-slate-400 text-[10px] block font-semibold">Lost</span>
                <span className="text-base font-black text-rose-400 flex items-center justify-center space-x-1">
                  <span>{accuracyStats.totalLost}</span>
                  <span className="text-[10px]">❌</span>
                </span>
              </button>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <span className="text-slate-400 text-[11px] font-bold block">Accuracy by Betting Market</span>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
                    <span>Over 2.5 Goals</span>
                    <span>{accuracyStats.over25Accuracy}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: `${accuracyStats.over25Accuracy}%` }} className="bg-amber-400 h-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-0.5">
                    <span>Straight Match Wins</span>
                    <span>{accuracyStats.straightWinsAccuracy}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: `${accuracyStats.straightWinsAccuracy}%` }} className="bg-emerald-400 h-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches Feed */}
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-500 border border-slate-200 flex flex-col items-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
            <span>Fetching real-time matches...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-500 border border-slate-200 space-y-2">
            <Radio className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
            <p className="font-extrabold text-slate-800 text-sm">
              {activeDateTab === "LIVE" ? "No Matches Currently In-Play" : "No Matches Scheduled"}
            </p>
            <p className="text-[11px] text-slate-500">
              {activeDateTab === "LIVE" 
                ? "There are no live matches taking place right now. Check back during match hours!"
                : "No games found for this date/league selection."
              }
            </p>
          </div>
        ) : (
          currentMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
              
              {/* LIVE Badge or Finished Badge */}
              {match.status === "LIVE" ? (
                <div className="absolute top-0 right-0 bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  <span>LIVE</span>
                </div>
              ) : match.status === "FINISHED" ? (
                <div className="absolute top-0 right-0 bg-slate-800 text-white font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg">
                  FT
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

              {/* Match Teams & Live Score */}
              <div className="flex items-center justify-center space-x-3 px-4 py-2">
                <div className="flex items-center space-x-2 text-right justify-end w-2/5">
                  <span className="font-extrabold text-xs text-slate-900 leading-tight">{match.homeTeam}</span>
                  <img src={match.homeLogo} alt={match.homeTeam} className="w-7 h-7 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }} />
                </div>

                <div className="w-1/5 text-center">
                  {match.status === "FINISHED" || match.status === "LIVE" ? (
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
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
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200"><span className="text-slate-400 text-[10px] block">1</span><span className="font-bold text-slate-900">{match.odds?.home || "1.90"}</span></div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200"><span className="text-slate-400 text-[10px] block">X</span><span className="font-bold text-slate-900">{match.odds?.draw || "3.40"}</span></div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200"><span className="text-slate-400 text-[10px] block">2</span><span className="font-bold text-slate-900">{match.odds?.away || "3.80"}</span></div>
                </div>
              ) : (
                <div className="mx-4 my-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
                  <div className="text-[11px] text-slate-500 font-medium">{match.predictionTitle}</div>
                  <div className="text-xs font-black text-slate-900">{match.predictionDetail}</div>
                </div>
              )}

              <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                <button onClick={() => setSelectedMatchModal(match)} className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs py-2.5 rounded-full shadow-xs">
                  GET FULL AI PREDICTION
                </button>
              </div>
            </div>
          ))
        )}

        {/* Client-Side Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex justify-between items-center shadow-xs text-xs font-bold">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl border ${currentPage === 1 ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-slate-900 text-white border-slate-900 active:scale-95 transition"}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-slate-700">
              Page <span className="text-orange-600 font-extrabold">{currentPage}</span> of {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl border ${currentPage >= totalPages ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-slate-900 text-white border-slate-900 active:scale-95 transition"}`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* Prediction Breakdown Modal */}
      {selectedMatchModal && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">{selectedMatchModal.homeTeam} vs {selectedMatchModal.awayTeam}</h3>
                <p className="text-[10px] text-slate-500">{selectedMatchModal.league}</p>
              </div>
              <button onClick={() => setSelectedMatchModal(null)} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <span className="text-slate-600 text-[11px]">Winning Probabilities</span>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>{selectedMatchModal.homeTeam} ({selectedMatchModal.aiProbabilities?.homeWin || 45}%)</span>
                <span>Draw ({selectedMatchModal.aiProbabilities?.draw || 25}%)</span>
                <span>{selectedMatchModal.awayTeam} ({selectedMatchModal.aiProbabilities?.awayWin || 30}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden">
                <div style={{ width: `${selectedMatchModal.aiProbabilities?.homeWin || 45}%` }} className="bg-emerald-500"></div>
                <div style={{ width: `${selectedMatchModal.aiProbabilities?.draw || 25}%` }} className="bg-amber-400"></div>
                <div style={{ width: `${selectedMatchModal.aiProbabilities?.awayWin || 30}%` }} className="bg-cyan-500"></div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs">
                <TrendingUp className="w-4 h-4" />
                <span>AI Analytical Breakdown</span>
              </div>
              <p className="text-[11px] text-amber-950 leading-relaxed">{selectedMatchModal.aiSummary}</p>
            </div>

            <button onClick={() => setSelectedMatchModal(null)} className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl">
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* VERIFIED WON / LOST MATCHES DETAIL MODAL */}
      {verifiedModalType && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                {verifiedModalType === "WON" ? (
                  <span className="text-emerald-600 font-extrabold text-sm flex items-center space-x-1">
                    <span>✅</span>
                    <span>Verified WON Picks ({accuracyStats.totalWon})</span>
                  </span>
                ) : (
                  <span className="text-rose-600 font-extrabold text-sm flex items-center space-x-1">
                    <span>❌</span>
                    <span>Verified LOST Picks ({accuracyStats.totalLost})</span>
                  </span>
                )}
              </div>
              <button onClick={() => setVerifiedModalType(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {allMatches.filter((m) => m.isWon === (verifiedModalType === "WON")).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No verified {verifiedModalType.toLowerCase()} matches recorded in current view.
                </div>
              ) : (
                allMatches
                  .filter((m) => m.isWon === (verifiedModalType === "WON"))
                  .map((match) => (
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

                        {verifiedModalType === "WON" ? (
                          <span className="bg-emerald-100 text-emerald-700 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>WON</span>
                          </span>
                        ) : (
                          <span className="bg-rose-100 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>LOST</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button onClick={() => setVerifiedModalType(null)} className="w-full bg-slate-900 text-white font-bold text-xs py-3 rounded-xl">
              Close History
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
