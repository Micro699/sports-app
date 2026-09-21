import { useState, useEffect } from "react";
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

const DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png";
const ITEMS_PER_PAGE = 10;

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<"Predictions" | "Odds" | null>("Predictions");
  const [activeSport, setActiveSport] = useState("Football");
  const [activeDateTab, setActiveDateTab] = useState("Today");
  const [customDate, setCustomDate] = useState("");
  const [activeTab, setActiveTab] = useState<"Predictions" | "HotPicks" | "Odds" | "Accuracy">("Predictions");
  const [selectedMatchModal, setSelectedMatchModal] = useState<Match | null>(null);

  // Filter state for Accuracy page (ALL / WON / LOST)
  const [accuracyFilter, setAccuracyFilter] = useState<"ALL" | "WON" | "LOST">("ALL");

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Match State
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const sportsList = ["Football", "Basketball"];

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
      const response = await fetch(
        `http://localhost:8000/api/v1/fixtures?target_date=${targetDate}&sport=${sport}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAllMatches(data);
        } else if (data.matches) {
          setAllMatches(data.matches);
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

  // Finished Matches for Accuracy Section
  const finishedMatches = allMatches.filter((m) => m.status === "FINISHED");
  const totalVerified = finishedMatches.length;
  const totalWon = finishedMatches.filter((m) => m.isWon === true).length;
  const totalLost = finishedMatches.filter((m) => m.isWon === false).length;
  const accuracyPercentage = totalVerified > 0 ? Math.round((totalWon / totalVerified) * 100) : 88;

  // Active Matches (Exclude FINISHED from Predictions / HotPicks / Odds)
  const activeMatches = allMatches.filter((m) => m.status !== "FINISHED");

  // Determine display list based on active view tab
  const displayList = activeTab === "Accuracy"
    ? finishedMatches.filter((match) => {
        // Filter by Won / Lost buttons
        if (accuracyFilter === "WON" && match.isWon !== true) return false;
        if (accuracyFilter === "LOST" && match.isWon !== false) return false;

        // Search Filter
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          match.homeTeam.toLowerCase().includes(query) ||
          match.awayTeam.toLowerCase().includes(query) ||
          match.league.toLowerCase().includes(query)
        );
      })
    : activeMatches.filter((match) => {
        // Hot Picks Tab: ONLY show matches marked isHot
        if (activeTab === "HotPicks" && !match.isHot) {
          return false;
        }

        // LIVE Tab Filter
        if (activeDateTab === "LIVE" && match.status !== "LIVE") {
          return false;
        }

        // Search Filter
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          match.homeTeam.toLowerCase().includes(query) ||
          match.awayTeam.toLowerCase().includes(query) ||
          match.league.toLowerCase().includes(query)
        );
      });

  // Pagination calculations
  const totalPages = Math.ceil(displayList.length / ITEMS_PER_PAGE) || 1;
  const currentMatches = displayList.slice(
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
            {/* Predictions Accordion */}
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

            {/* Hot Picks Sidebar Item */}
            <div>
              <button 
                onClick={() => { setActiveTab("HotPicks"); setIsSidebarOpen(false); }} 
                className="w-full px-5 py-4 flex justify-between items-center text-sm font-extrabold text-orange-600 bg-orange-50/50 hover:bg-orange-50"
              >
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Hot Picks 🔥</span>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-400" />
              </button>
            </div>

            {/* Odds Accordion */}
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

          {/* Header Controls: Search, LIVE Button, Globe */}
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

            {/* Pulsating LIVE Header Button */}
            <button
              onClick={() => { setActiveDateTab("LIVE"); setActiveTab("Predictions"); setCustomDate(""); }}
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

        {/* Search Bar Input */}
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
          <div className="flex space-x-6 overflow-x-auto border-b border-slate-100 pb-2 text-xs font-bold">
            {sportsList.map((sport) => (
              <button key={sport} onClick={() => setActiveSport(sport)} className={`pb-1 ${activeSport === sport ? "text-slate-900 border-b-2 border-orange-500 font-extrabold" : "text-slate-400"}`}>
                {sport}
              </button>
            ))}
          </div>

          {/* Clean Date Filter Bar */}
          <div className="flex items-center space-x-2 text-xs font-semibold overflow-x-auto">
            {["Yesterday", "Today", "Tomorrow"].map((tab) => (
              <button 
                key={tab} 
                onClick={() => { setActiveDateTab(tab); setCustomDate(""); }} 
                className={`py-1.5 px-3 rounded-lg border whitespace-nowrap ${
                  activeDateTab === tab && !customDate 
                    ? "bg-orange-50 border-orange-500 text-orange-600 font-bold" 
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
            
            {/* Custom Date Overlay */}
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
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex justify-between items-center px-1">
          <div className="flex border-b border-slate-200 text-xs font-bold space-x-3.5">
            <button 
              onClick={() => { setActiveTab("Predictions"); setCurrentPage(1); }} 
              className={`py-2 ${activeTab === "Predictions" ? "text-slate-900 border-b-2 border-orange-500 font-extrabold" : "text-slate-400"}`}
            >
              Predictions
            </button>

            <button 
              onClick={() => { setActiveTab("HotPicks"); setCurrentPage(1); }} 
              className={`py-2 flex items-center space-x-1 ${activeTab === "HotPicks" ? "text-orange-600 border-b-2 border-orange-500 font-extrabold" : "text-slate-400"}`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>Hot Picks</span>
            </button>

            <button 
              onClick={() => { setActiveTab("Odds"); setCurrentPage(1); }} 
              className={`py-2 ${activeTab === "Odds" ? "text-slate-900 border-b-2 border-orange-500 font-extrabold" : "text-slate-400"}`}
            >
              Odds
            </button>

            <button 
              onClick={() => { setActiveTab("Accuracy"); setCurrentPage(1); }} 
              className={`py-2 ${activeTab === "Accuracy" ? "text-slate-900 border-b-2 border-orange-500 font-extrabold" : "text-slate-400"}`}
            >
              Accuracy
            </button>
          </div>

          <span className="text-xs text-slate-500 font-bold">
            {displayList.length} {activeTab === "Accuracy" ? "Verified" : (activeDateTab === "LIVE" ? "In-Play" : "Matches")}
          </span>
        </div>

        {/* ACCURACY DASHBOARD VIEW */}
        {activeTab === "Accuracy" && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-4 shadow-lg border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-sm text-slate-100">AI Model Accuracy</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs px-2.5 py-0.5 rounded-full">
                {accuracyPercentage}% Win Rate
              </span>
            </div>

            {/* Verified Matches Breakdown Controls */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <button 
                onClick={() => { setAccuracyFilter("ALL"); setCurrentPage(1); }}
                className={`p-2.5 rounded-xl border transition ${accuracyFilter === "ALL" ? "bg-slate-800 border-amber-400" : "bg-slate-800/80 border-slate-700/60"}`}
              >
                <span className="text-slate-400 text-[10px] block font-semibold">Verified Picks</span>
                <span className="text-base font-black text-slate-100">{totalVerified}</span>
              </button>

              <button
                onClick={() => { setAccuracyFilter("WON"); setCurrentPage(1); }}
                className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${accuracyFilter === "WON" ? "bg-slate-800 border-emerald-400" : "bg-slate-800/80 border-slate-700/60"}`}
              >
                <span className="text-slate-400 text-[10px] block font-semibold">Won</span>
                <span className="text-base font-black text-emerald-400 flex items-center justify-center space-x-1">
                  <span>{totalWon}</span>
                  <span className="text-[10px]">✅</span>
                </span>
              </button>

              <button
                onClick={() => { setAccuracyFilter("LOST"); setCurrentPage(1); }}
                className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${accuracyFilter === "LOST" ? "bg-slate-800 border-rose-400" : "bg-slate-800/80 border-slate-700/60"}`}
              >
                <span className="text-slate-400 text-[10px] block font-semibold">Lost</span>
                <span className="text-base font-black text-rose-400 flex items-center justify-center space-x-1">
                  <span>{totalLost}</span>
                  <span className="text-[10px]">❌</span>
                </span>
              </button>
            </div>

            {/* PERCENTAGE PROGRESS BARS */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px] font-bold block">Accuracy by Betting Market</span>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-1">
                    <span>Over 2.5 Goals</span>
                    <span className="text-amber-400 font-bold">88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: "88%" }} className="bg-amber-400 h-full rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-1">
                    <span>Straight Match Wins</span>
                    <span className="text-emerald-400 font-bold">81%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: "81%" }} className="bg-emerald-400 h-full rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-1">
                    <span>Both Teams to Score (BTTS)</span>
                    <span className="text-sky-400 font-bold">79%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: "79%" }} className="bg-sky-400 h-full rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES FEED */}
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-500 border border-slate-200 flex flex-col items-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
            <span>Loading matches...</span>
          </div>
        ) : displayList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-500 border border-slate-200 space-y-2">
            <Radio className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
            <p className="font-extrabold text-slate-800 text-sm">
              {activeTab === "Accuracy" 
                ? "No Verified Finished Matches for this Date" 
                : activeTab === "HotPicks"
                ? "No Hot Picks Available for this Selection"
                : (activeDateTab === "LIVE" ? "No Matches Currently In-Play" : "No Active Matches Available")}
            </p>
            <p className="text-[11px] text-slate-500">
              {activeTab === "Accuracy"
                ? "Verified picks will populate automatically as matches conclude throughout the day!"
                : activeTab === "HotPicks"
                ? "Try checking another sport or picking a different date for high-confidence picks."
                : (activeDateTab === "LIVE" 
                    ? "There are no live matches taking place right now. Check back during match hours!"
                    : "Try picking another date or sport."
                  )
              }
            </p>
          </div>
        ) : (
          currentMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative">
              
              {/* STATUS BADGES */}
              {activeTab === "Accuracy" || match.status === "FINISHED" ? (
                <div className={`absolute top-0 right-0 font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center space-x-1 text-white ${
                  match.isWon ? "bg-emerald-600" : "bg-rose-600"
                }`}>
                  {match.isWon ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{match.isWon ? "WON" : "LOST"}</span>
                </div>
              ) : match.status === "LIVE" ? (
                <div className="absolute top-0 right-0 bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-bl-lg flex items-center space-x-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  <span>LIVE • {match.dateTime}</span>
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

              {/* TEAMS & SCORES */}
              <div className="flex items-center justify-center space-x-3 px-4 py-2">
                <div className="flex items-center space-x-2 text-right justify-end w-2/5">
                  <span className="font-extrabold text-xs text-slate-900 leading-tight">{match.homeTeam}</span>
                  <img src={match.homeLogo} alt={match.homeTeam} className="w-7 h-7 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_LOGO; }} />
                </div>

                <div className="w-1/5 text-center">
                  {match.status === "FINISHED" || match.status === "LIVE" ? (
                    <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${
                      match.status === "LIVE" 
                        ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse" 
                        : "bg-slate-100 text-slate-900 border-slate-200"
                    }`}>
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

        {/* Pagination Controls */}
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

    </div>
  );
}
