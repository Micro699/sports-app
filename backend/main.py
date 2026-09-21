import math
import requests
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="MicroPulse Advanced Momentum & Form AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OddsSchema(BaseModel):
    home: str
    draw: str
    away: str

class AiProbabilitiesSchema(BaseModel):
    homeWin: int
    draw: int
    awayWin: int
    over25: int
    btts: int

class MatchSchema(BaseModel):
    id: str
    sport: str
    league: str
    dateTime: str
    homeTeam: str
    homeLogo: str
    awayTeam: str
    awayLogo: str
    status: str
    homeScore: int
    awayScore: int
    isHot: bool
    predictionTitle: str
    predictionDetail: str
    odds: OddsSchema
    aiProbabilities: AiProbabilitiesSchema
    aiSummary: str
    isWon: Optional[bool] = None

# STANDARD BETTING PLATFORM LEAGUE NAME DICTIONARY
LEAGUE_MAPPING = {
    "premier league": "Premier League",
    "english premier league": "Premier League",
    "laliga": "LaLiga",
    "spanish laliga": "LaLiga",
    "la liga": "LaLiga",
    "bundesliga": "Bundesliga",
    "german bundesliga": "Bundesliga",
    "serie a": "Serie A",
    "italian serie a": "Serie A",
    "ligue 1": "Ligue 1",
    "french ligue 1": "Ligue 1",
    "championship": "Championship",
    "english football league championship": "Championship",
    "efl championship": "Championship",
    "eredivisie": "Eredivisie",
    "dutch eredivisie": "Eredivisie",
    "liga portugal": "Liga Portugal",
    "portuguese primeira liga": "Liga Portugal",
    "primeira liga": "Liga Portugal",
    "saudi pro league": "Saudi Pro League",
    "saudi professional league": "Saudi Pro League",
    "mls": "MLS",
    "major league soccer": "MLS",
    "liga mx": "Liga MX",
    "mexican liga bbva mx": "Liga MX",
    "uefa champions league": "UEFA Champions League",
    "uefa europa league": "UEFA Europa League",
    "uefa conference league": "UEFA Conference League",
    "uefa europa conference league": "UEFA Conference League",
    "africa cup of nations qualification": "Africa Cup of Nations Qualification",
    "afcon qualification": "Africa Cup of Nations Qualification",
    "conmebol libertadores": "CONMEBOL Libertadores",
    "copa libertadores": "CONMEBOL Libertadores",
    "k-league 1": "K-League 1",
    "k league 1": "K-League 1",
    "korean k league 1": "K-League 1",
    "nba": "NBA",
    "wnba": "WNBA",
    "ncaa basketball": "NCAA Basketball"
}

def normalize_league_name(raw_league: str) -> str:
    """Normalizes bloated raw API league strings into standard sportsbook category names."""
    if not raw_league:
        return "Top League"
    
    clean_lower = raw_league.strip().lower()
    
    # Check exact dictionary match or substring match
    for key, standard_name in LEAGUE_MAPPING.items():
        if key in clean_lower:
            return standard_name
            
    # Fallback cleanup if league is not in the dictionary
    cleaned_str = (
        raw_league.replace("Spanish ", "")
                  .replace("English ", "")
                  .replace("German ", "")
                  .replace("Italian ", "")
                  .replace("French ", "")
                  .replace("Dutch ", "")
                  .replace("Men's ", "")
                  .strip()
    )
    return cleaned_str if cleaned_str else raw_league

def sanitize_team_name(team_name: str, league_name: str) -> str:
    clean_name = team_name.strip()
    league_lower = league_name.lower()
    
    women_keywords = [
        "women", "femení", "femeni", "feminine", "nwsl", "liga f", 
        "wsl", "wnba", "wta", "w-league", "uwcl", "women's"
    ]
    
    is_women_match = any(kw in league_lower for kw in women_keywords) or any(kw in clean_name.lower() for kw in women_keywords)
    
    if is_women_match:
        if clean_name.endswith("(W)") or clean_name.endswith("(w)"):
            return f"{clean_name[:-3].strip()} (W)"
        
        for suffix in [" Women", " women", " Women's", " women's", " Femeni", " Femení", " Ladies", " ladies"]:
            if clean_name.endswith(suffix):
                clean_name = clean_name[:-len(suffix)].strip()
                break
        
        return f"{clean_name} (W)"
            
    return clean_name

def calculate_recent_form_multiplier(comp: dict) -> Tuple[float, str]:
    form_str = comp.get("form", "")
    if not form_str:
        records = comp.get("records", [])
        for r in records:
            if r.get("type") == "lastfive" or "last" in r.get("name", "").lower():
                form_str = r.get("summary", "")
                break

    clean_form = form_str.replace("-", "").strip().upper()
    if not clean_form:
        return 1.0, "N/A"

    recent_5 = clean_form[-5:]
    weights = [1.0, 1.2, 1.4, 1.6, 1.8]
    weighted_pts = 0.0
    max_pts = 0.0

    for idx, result in enumerate(recent_5):
        w = weights[idx] if idx < len(weights) else 1.0
        max_pts += (3.0 * w)
        if result == "W":
            weighted_pts += (3.0 * w)
        elif result == "D":
            weighted_pts += (1.0 * w)

    form_ratio = (weighted_pts / max_pts) if max_pts > 0 else 0.5
    multiplier = 0.65 + (form_ratio * 0.70)
    return round(multiplier, 2), recent_5

def extract_advanced_team_xg(comp: dict, is_home: bool) -> Tuple[float, str, str]:
    records = comp.get("records", [])
    summary = ""
    if records:
        summary = records[0].get("summary", "") or records[0].get("displayValue", "")

    form_mult, form_display = calculate_recent_form_multiplier(comp)

    if summary and "-" in summary:
        try:
            parts = [int(x) for x in summary.split("-")]
            wins = parts[0]
            draws = parts[1] if len(parts) > 1 else 0
            losses = parts[2] if len(parts) > 2 else 0
            total_games = max(1, wins + draws + losses)
            
            win_rate = wins / total_games
            loss_rate = losses / total_games
            
            season_xg = 0.85 + (win_rate * 1.80) - (loss_rate * 0.45)
            blended_xg = (season_xg * 0.50) + (season_xg * form_mult * 0.50) + (0.05 if is_home else 0.0)
            record_str = f"{wins}W-{draws}D-{losses}L"
            return round(max(0.5, min(3.8, blended_xg)), 2), record_str, form_display
        except Exception:
            pass
            
    fallback_xg = (1.40 if is_home else 1.35) * form_mult
    return round(fallback_xg, 2), "Form N/A", form_display

def poisson_prob(lmbda: float, k: int) -> float:
    return (math.pow(lmbda, k) * math.exp(-lmbda)) / math.factorial(k)

def compute_advanced_ai_prediction(home_team: str, away_team: str, home_comp: dict, away_comp: dict, sport: str):
    home_xg, home_rec, home_form = extract_advanced_team_xg(home_comp, is_home=True)
    away_xg, away_rec, away_form = extract_advanced_team_xg(away_comp, is_home=False)

    home_win, draw, away_win = 0.0, 0.0, 0.0
    o25, btts = 0.0, 0.0

    for h in range(6):
        for a in range(6):
            p = poisson_prob(home_xg, h) * poisson_prob(away_xg, a)
            if h > a: home_win += p
            elif h == a: draw += p
            else: away_win += p
            if (h + a) > 2.5: o25 += p
            if h > 0 and a > 0: btts += p

    hw = max(5, round(home_win * 100))
    dr = max(2, round(draw * 100)) if sport == "Football" else 2
    aw = max(5, round(away_win * 100))
    o25_p = round(o25 * 100)
    btts_p = round(btts * 100)

    if sport == "Basketball":
        detail = f"{home_team} -3.5" if hw >= aw else f"{away_team} +3.5"
    elif sport == "Tennis":
        detail = f"{home_team} Win" if hw >= aw else f"{away_team} Win"
    elif sport == "Rugby":
        detail = f"{home_team} -5.5" if hw >= aw else f"{away_team} +5.5"
    else:
        if hw >= 60 and (hw - aw) >= 22:
            detail = f"{home_team} Straight Win"
        elif aw >= 54 and (aw - hw) >= 14:
            detail = f"{away_team} Straight Win"
        elif o25_p >= 64:
            detail = "Over 2.5 Goals Scored"
        elif btts_p >= 62:
            detail = "Both Teams to Score (BTTS)"
        elif aw > hw:
            detail = f"{away_team} Win or Draw (X2)"
        elif hw >= aw:
            detail = f"{home_team} Win or Draw (1X)"
        else:
            detail = "Over 1.5 Goals Scored"

    max_confidence = max(hw, aw, o25_p if sport == "Football" else 0)

    summary = (
        f"Multi-Variable Analysis: {home_team} (Rec: {home_rec}, Form: {home_form}, xG: {home_xg}) vs "
        f"{away_team} (Rec: {away_rec}, Form: {away_form}, xG: {away_xg}). "
        f"Model probabilities: Home Win {hw}%, Draw {dr}%, Away Win {aw}%. Pick: {detail} ({max_confidence}% confidence)."
    )

    return {
        "detail": detail,
        "max_confidence": max_confidence,
        "probabilities": AiProbabilitiesSchema(
            homeWin=hw, draw=dr, awayWin=aw, over25=o25_p, btts=btts_p
        ),
        "odds": OddsSchema(
            home=str(round(max(1.05, 100 / hw), 2)),
            draw=str(round(max(1.05, 100 / dr), 2)),
            away=str(round(max(1.05, 100 / aw), 2))
        ),
        "summary": summary
    }

def evaluate_prediction_outcome(detail: str, home_team: str, away_team: str, home_score: int, away_score: int) -> bool:
    detail_lower = detail.lower()
    total_goals = home_score + away_score
    
    if "over 2.5" in detail_lower:
        return total_goals > 2.5
    elif "under 2.5" in detail_lower:
        return total_goals < 2.5
    elif "btts" in detail_lower or "both teams to score" in detail_lower:
        return home_score > 0 and away_score > 0
    elif "win or draw" in detail_lower or "1x" in detail_lower or "x2" in detail_lower:
        if home_team.lower() in detail_lower:
            return home_score >= away_score
        else:
            return away_score >= home_score
    elif "win" in detail_lower:
        if home_team.lower() in detail_lower:
            return home_score > away_score
        elif away_team.lower() in detail_lower:
            return away_score > home_score
    
    return (home_score > away_score) if home_team.lower() in detail_lower else (away_score > home_score)

DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png"

ESPN_SPORT_ENDPOINTS = {
    "Football": [
        ("soccer/all", "Football"),
        ("soccer/esp.w.1", "Spain - Liga F Women"),
        ("soccer/eng.w.1", "England - Women's Super League"),
        ("soccer/usa.w.1", "USA - NWSL Women"),
        ("soccer/uefa.wchampions", "UEFA Women's Champions League")
    ],
    "Basketball": [
        ("basketball/nba", "NBA"),
        ("basketball/wnba", "WNBA Women"),
        ("basketball/mens-college-basketball", "NCAA Basketball")
    ]
}
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "MicroPulse AI Engine",
        "endpoints": {
            "fixtures": "/api/v1/fixtures?target_date=2026-09-21&sport=Football",
            "docs": "/docs"
        }
    }

@app.get("/api/v1/fixtures", response_model=List[MatchSchema])
def get_fixtures(
    target_date: str = Query(..., description="YYYY-MM-DD"),
    sport: str = Query("Football")
):
    date_param = target_date.replace("-", "")
    endpoints = ESPN_SPORT_ENDPOINTS.get(sport, [("soccer/all", "Football")])

    raw_matches = []
    seen_teams_today = set()

    for endpoint_path, default_league_label in endpoints:
        url = f"https://site.api.espn.com/apis/site/v2/sports/{endpoint_path}/scoreboard?dates={date_param}&limit=300"
        
        try:
            res = requests.get(url, timeout=5.0)
            if res.status_code == 200:
                events = res.json().get("events", [])
                for event in events:
                    event_id = event.get("id")
                    league_info = event.get("league", {}) or {}
                    raw_league_name = league_info.get("name") or event.get("season", {}).get("slug") or default_league_label
                    
                    # Apply league normalization to match betting apps
                    league_name = normalize_league_name(raw_league_name)

                    status_info = event.get("status", {}).get("type", {})
                    state = status_info.get("state", "pre")
                    detail = status_info.get("shortDetail", "")

                    raw_date = event.get("date", "")
                    try:
                        dt_obj = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                        formatted_time = dt_obj.strftime("%d %b %Y, %H:%M")
                    except Exception:
                        dt_obj = datetime.now()
                        formatted_time = target_date

                    if state == "in":
                        match_status = "LIVE"
                        formatted_time = detail if detail else "LIVE"
                    elif state == "post":
                        match_status = "FINISHED"
                        formatted_time = "FT"
                    else:
                        match_status = "UPCOMING"

                    competitions = event.get("competitions", [{}])[0]
                    competitors = competitions.get("competitors", [])
                    
                    if len(competitors) < 2:
                        continue

                    c1, c2 = competitors[0], competitors[1]
                    home_comp = c1 if c1.get("homeAway") == "home" else c2
                    away_comp = c2 if c1.get("homeAway") == "home" else c1

                    raw_home_team = home_comp.get("team", {}).get("displayName", "Home")
                    home_logo = home_comp.get("team", {}).get("logo", DEFAULT_LOGO)
                    home_score = int(home_comp.get("score", 0)) if home_comp.get("score") else 0
                    
                    raw_away_team = away_comp.get("team", {}).get("displayName", "Away")
                    away_logo = away_comp.get("team", {}).get("logo", DEFAULT_LOGO)
                    away_score = int(away_comp.get("score", 0)) if away_comp.get("score") else 0

                    home_team = sanitize_team_name(raw_home_team, league_name)
                    away_team = sanitize_team_name(raw_away_team, league_name)

                    h_lower = home_team.lower().strip()
                    a_lower = away_team.lower().strip()
                    if h_lower in seen_teams_today or a_lower in seen_teams_today:
                        continue
                    
                    seen_teams_today.add(h_lower)
                    seen_teams_today.add(a_lower)

                    ai = compute_advanced_ai_prediction(home_team, away_team, home_comp, away_comp, sport)

                    is_won = None
                    if match_status == "FINISHED":
                        is_won = evaluate_prediction_outcome(ai["detail"], home_team, away_team, home_score, away_score)

                    raw_matches.append({
                        "id": f"espn_{event_id}",
                        "sport": sport,
                        "league": league_name,
                        "dateTime": formatted_time,
                        "kickoff_dt": dt_obj,
                        "homeTeam": home_team,
                        "homeLogo": home_logo if home_logo else DEFAULT_LOGO,
                        "awayTeam": away_team,
                        "awayLogo": away_logo if away_logo else DEFAULT_LOGO,
                        "status": match_status,
                        "homeScore": home_score,
                        "awayScore": away_score,
                        "confidence": ai["max_confidence"],
                        "predictionTitle": f"{home_team} vs {away_team} Prediction",
                        "predictionDetail": ai["detail"],
                        "odds": ai["odds"],
                        "aiProbabilities": ai["probabilities"],
                        "aiSummary": ai["summary"],
                        "isWon": is_won
                    })
        except Exception as e:
            print(f"Error fetching real ESPN fixtures for {endpoint_path}: {e}")

    raw_matches.sort(key=lambda x: x["confidence"], reverse=True)
    for idx, item in enumerate(raw_matches):
        item["isHot"] = (idx < 25)

    raw_matches.sort(key=lambda x: x["kickoff_dt"])

    matches = []
    for item in raw_matches:
        matches.append(MatchSchema(
            id=item["id"],
            sport=item["sport"],
            league=item["league"],
            dateTime=item["dateTime"],
            homeTeam=item["homeTeam"],
            homeLogo=item["homeLogo"],
            awayTeam=item["awayTeam"],
            awayLogo=item["awayLogo"],
            status=item["status"],
            homeScore=item["homeScore"],
            awayScore=item["awayScore"],
            isHot=item["isHot"],
            predictionTitle=item["predictionTitle"],
            predictionDetail=item["predictionDetail"],
            odds=item["odds"],
            aiProbabilities=item["aiProbabilities"],
            aiSummary=item["aiSummary"],
            isWon=item["isWon"]
        ))

    return matches
