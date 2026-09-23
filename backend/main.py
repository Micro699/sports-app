import math
import re
import requests
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="MicroPulse Unbiased Multi-Sport AI Engine")

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

# GENERIC MATCH STAGES TO REJECT AS LEAGUE NAMES
GENERIC_STAGES = {
    "group stage", "regular season", "1st round", "2nd round", "3rd round",
    "round of 16", "quarter-finals", "semi-finals", "finals", "playoffs",
    "preliminary round", "second round", "first round", "third round",
    "regular-season", "group-stage", "torneo-clausura", "torneo-apertura"
}

LEAGUE_MAPPING = {
    # --- ENGLAND ---
    "premier league": "Premier League",
    "english premier league": "Premier League",
    "championship": "Championship",
    "english football league championship": "Championship",
    "efl championship": "Championship",
    "fa cup": "FA Cup",
    "efl cup": "EFL Cup",

    # --- SPAIN ---
    "laliga": "LaLiga",
    "spanish laliga": "LaLiga",
    "la liga": "LaLiga",
    "copa del rey": "Copa del Rey",

    # --- ITALY ---
    "serie a": "Serie A",
    "italian serie a": "Serie A",
    "coppa italia": "Coppa Italia",

    # --- GERMANY ---
    "bundesliga": "Bundesliga",
    "german bundesliga": "Bundesliga",
    "dfb pokal": "DFB-Pokal",

    # --- FRANCE ---
    "ligue 1": "Ligue 1",
    "french ligue 1": "Ligue 1",

    # --- INTERNATIONAL QUALIFIERS ---
    "caf world cup": "WC Qualifiers (Africa)",
    "afc world cup": "WC Qualifiers (Asia)",
    "concacaf world cup": "WC Qualifiers (CONCACAF)",
    "conmebol world cup": "WC Qualifiers (CONMEBOL)",
    "uefa world cup": "WC Qualifiers (Europe)",
    "world cup qualification": "World Cup Qualifiers",
    "afcon qualification": "AFCON Qualifiers",
    "international friendly": "Int. Friendly",
    "womens international friendly": "Women's Int. Friendly",

    # --- TOP LEAGUES & CUPS ---
    "eredivisie": "Eredivisie",
    "primeira liga": "Liga Portugal",
    "liga portugal": "Liga Portugal",
    "saudi pro league": "Saudi Pro League",
    "south african premiership": "South African Premiership",
    "mls": "MLS",
    "liga mx": "Liga MX",
    "uefa champions league": "UEFA Champions League",
    "uefa europa league": "UEFA Europa League",
    "uefa conference league": "UEFA Conference League"
}

def extract_true_competition_name(event: dict, default_label: str) -> str:
    """Rejects generic stage names like 'Group Stage' and extracts true Flashscore-style tournament titles."""
    competitions = event.get("competitions", [{}])
    comp_obj = competitions[0] if competitions else {}
    
    # 1. Check event notes headline (e.g. '2026 FIFA World Cup Qualifiers, CAF')
    notes = comp_obj.get("notes", [])
    if notes and isinstance(notes, list) and len(notes) > 0:
        headline = notes[0].get("headline", "").strip()
        if headline:
            h_lower = headline.lower()
            if "world cup" in h_lower and ("qualifi" in h_lower or "caf" in h_lower or "afc" in h_lower):
                if "caf" in h_lower or "africa" in h_lower:
                    return "WC Qualifiers (Africa)"
                if "afc" in h_lower or "asia" in h_lower:
                    return "WC Qualifiers (Asia)"
                if "concacaf" in h_lower:
                    return "WC Qualifiers (CONCACAF)"
                if "conmebol" in h_lower:
                    return "WC Qualifiers (CONMEBOL)"
                if "uefa" in h_lower or "europe" in h_lower:
                    return "WC Qualifiers (Europe)"
                return "World Cup Qualifiers"
            if "africa cup of nations" in h_lower or "afcon" in h_lower:
                return "AFCON Qualifiers"

    # 2. Check competition series or tournament name
    series_title = comp_obj.get("series", {}).get("title", "").strip()
    if series_title and series_title.lower() not in GENERIC_STAGES:
        return series_title

    # 3. Check event league name
    league_info = event.get("league", {}) or {}
    league_name = league_info.get("name", "").strip()
    if league_name and league_name.lower() not in GENERIC_STAGES:
        return league_name

    # 4. Check season displayName
    season_info = event.get("season", {}) or {}
    season_name = season_info.get("displayName") or season_info.get("name") or ""
    if season_name and season_name.lower() not in GENERIC_STAGES:
        return season_name

    return default_label

def normalize_league_name(raw_league: str) -> str:
    """Standardizes parsed league text into clean, human-readable filter titles."""
    if not raw_league:
        return "Top League"
    
    clean_lower = raw_league.strip().lower().replace("-", " ").replace("_", " ")
    
    for key, standard_name in LEAGUE_MAPPING.items():
        if key in clean_lower:
            return standard_name
            
    cleaned_str = re.sub(r'^\d{4}\s*', '', clean_lower)
    cleaned_str = (
        cleaned_str.replace("spanish ", "")
                   .replace("english ", "")
                   .replace("german ", "")
                   .replace("italian ", "")
                   .replace("french ", "")
                   .replace("dutch ", "")
                   .replace("men's ", "")
                   .strip()
    )
    
    return cleaned_str.title() if cleaned_str else raw_league.title()

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

def extract_real_team_stats(comp: dict, is_home: bool) -> Tuple[float, str]:
    records = comp.get("records", [])
    summary = ""
    
    if records:
        summary = records[0].get("summary", "") or records[0].get("displayValue", "")

    if summary and "-" in summary:
        try:
            parts = [int(x) for x in summary.split("-")]
            wins = parts[0]
            draws = parts[1] if len(parts) > 1 else 0
            losses = parts[2] if len(parts) > 2 else 0
            total_games = max(1, wins + draws + losses)
            
            win_rate = wins / total_games
            loss_rate = losses / total_games
            
            base_xg = 0.85 + (win_rate * 1.85) - (loss_rate * 0.45) + (0.10 if is_home else 0.0)
            formatted_record = f"{wins}W-{draws}D-{losses}L"
            return round(max(0.5, min(3.8, base_xg)), 2), formatted_record
        except Exception:
            pass
            
    fallback_xg = 1.45 if is_home else 1.35
    return fallback_xg, "Form N/A"

def poisson_prob(lmbda: float, k: int) -> float:
    return (math.pow(lmbda, k) * math.exp(-lmbda)) / math.factorial(k)

def compute_unbiased_prediction(home_team: str, away_team: str, home_comp: dict, away_comp: dict, sport: str):
    home_xg, home_rec = extract_real_team_stats(home_comp, is_home=True)
    away_xg, away_rec = extract_real_team_stats(away_comp, is_home=False)

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
    else:  # Football
        if hw >= 58 and (hw - aw) >= 20:
            detail = f"{home_team} Straight Win"
        elif aw >= 52 and (aw - hw) >= 12:
            detail = f"{away_team} Straight Win"
        elif o25_p >= 63:
            detail = "Over 2.5 Goals Scored"
        elif btts_p >= 61:
            detail = "Both Teams to Score (BTTS)"
        elif aw > hw:
            detail = f"{away_team} Win or Draw (X2)"
        elif hw >= aw:
            detail = f"{home_team} Win or Draw (1X)"
        else:
            detail = "Over 1.5 Goals Scored"

    max_confidence = max(hw, aw, o25_p if sport == "Football" else 0)

    summary = (
        f"Stat comparison ({home_rec} vs {away_rec}). "
        f"Calculated probabilities: Home {hw}%, Draw {dr}%, Away {aw}%. Recommended market: {detail} ({max_confidence}% confidence)."
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

                    # Use extract_true_competition_name to bypass "Group Stage"
                    raw_comp_name = extract_true_competition_name(event, default_league_label)
                    league_name = normalize_league_name(raw_comp_name)

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

                    ai = compute_unbiased_prediction(home_team, away_team, home_comp, away_comp, sport)

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
