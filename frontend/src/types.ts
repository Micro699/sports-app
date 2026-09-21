export const DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png";
export const ITEMS_PER_PAGE = 10;

// Runtime JavaScript object fallbacks (Prevents Vite strip-out errors)
export const Match = {};
export const Odds = {};
export const AiProbabilities = {};
export const AccuracyStats = {};

export interface Odds {
  home: string;
  draw: string;
  away: string;
}

export interface AiProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  btts: number;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  dateTime: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  status: string;
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

export interface AccuracyStats {
  totalVerified: number;
  totalWon: number;
  totalLost: number;
  accuracyPercentage: number;
  over25Accuracy: number;
  straightWinsAccuracy: number;
  bttsAccuracy: number;
}
