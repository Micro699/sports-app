export const ITEMS_PER_PAGE = 10;

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
  country: string;
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

export interface AccuracyStats {
  totalVerified: number;
  totalWon: number;
  totalLost: number;
  accuracyPercentage: number;
  over25Accuracy: number;
  straightWinsAccuracy: number;
  bttsAccuracy: number;
}
