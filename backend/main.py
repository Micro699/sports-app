import math
import re
import os
import requests
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
    over15: int
    over25: int
    over35: int
    over45: int
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

# REAL-WORLD TEAM POWER RATING INDEX
REAL_WORLD_POWER_INDEX = {
    "ivory coast": 2.05, "tunisia": 1.90, "morocco": 2.20, "senegal": 2.15,
    "egypt": 1.95, "algeria": 1.90, "nigeria": 1.85, "cameroon": 1.80,
    "ghana": 1.65, "mali": 1.65, "south africa": 1.60, "uganda": 1.20,
    "zimbabwe": 1.15, "sierra leone": 1.10, "libya": 1.25, "botswana": 1.05,
    "france": 2.40, "argentina": 2.45, "brazil": 2.35, "england": 2.30,
    "spain": 2.35, "germany": 2.20, "portugal": 2.20, "netherlands": 2.15,
    "usa": 1.80, "mexico": 1.80, "japan": 1.90, "south korea": 1.80,
    "equatorial guinea": 1.30, "congo dr": 1.45, "andorra": 0.90, "malta": 0.95
}

GENERIC_REJECTS = {
    "football", "soccer", "group stage", "regular season", "1st round", "2nd round", "3rd round",
    "round of 16", "quarter-finals", "semi-finals", "finals", "playoffs", "play-offs",
    "preliminary round", "second round", "first round", "third round",
    "regular-season", "group-stage", "torneo-clausura", "torneo-apertura",
    "second qualifying round", "first qualifying round", "third qualifying round",
    "qualifying round", "qualifying", "stage 1a", "stage 1b", "stage 1", "stage 2",
    "stage 3", "round 1", "round 2", "round 3", "league", "cup", "mens soccer", "womens soccer"
}

ESPN_SLUG_MAP = {
    "eng.1": "Premier League",
    "eng.2": "Championship",
    "eng.3": "League One",
    "eng.4": "League Two",
    "esp.1": "LaLiga",
    "esp.2": "LaLiga 2",
    "esp.copa_del_rey": "Copa del Rey",
    "ita.1": "Serie A",
    "ita.2": "Serie B",
    "ger.1": "Bundesliga",
    "fra.1": "Ligue 1",
    "ned.1": "Eredivisie",
    "por.1": "Liga Portugal",
    "usa.1": "MLS",
    "usa.ncaa.m.1": "NCAA College Soccer",
    "usa.ncaa.w.1": "NCAA College Soccer (W)",
    "per.1": "Peru - Liga 1",
    "sui.1": "Swiss Super League",
    "sui.cup": "Swiss Cup",
    "mex.1": "Liga MX",
    "rsa.1": "South African Premiership",
    "sau.1": "Saudi Pro League",
    "uefa.champions": "UEFA Champions League",
    "uefa.europa": "UEFA Europa League",
    "uefa.ecoconference": "UEFA Conference League",
    "fifa.friendly": "Int. Friendly",
    "fifa.world": "World Cup Qualifiers",
    "caf.nations": "AFCON Qualifiers"
}

LEAGUE_TEXT_MAP = {
    "premier league": "Premier League",
    "english premier league": "Premier League",
    "championship": "Championship",
    "laliga": "LaLiga",
    "spanish laliga": "LaLiga",
    "la liga": "LaLiga",
    "copa del rey": "Copa del Rey",
    "serie a": "Serie A",
    "italian serie a": "Serie A",
    "bundesliga": "Bundesliga",
    "ligue 1": "Ligue 1",
    "eredivisie": "Eredivisie",
    "liga portugal": "Liga Portugal",
    "saudi pro league": "Saudi Pro League",
    "south african premiership": "South African Premiership",
    "mls": "MLS",
    "liga mx": "Liga MX",
    "ncaa": "NCAA College Soccer",
    "liga 1": "Peru - Liga 1",
    "swiss super league": "Swiss Super League",
    "uefa champions league": "UEFA Champions League",
    "uefa europa league": "UEFA Europa League",
    "uefa conference league": "UEFA Conference League"
}

def clean_title_case(text: str) -> str:
    cleaned = re.sub(r'^\d{4}\s*', '', text.strip())
    for prefix in ["Spanish ", "English ", "German ", "Italian ", "French ", "Dutch ", "Men's ", "Women's "]:
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix):]
    return cleaned.strip().title() if cleaned else text.title()

def resolve_clean_league_name(event: dict, home_team: str, away_team: str, default_label: str) -> str:
    league_info = event.get("league", {}) or {}
    comp_obj = event.get("competitions", [{}])[0] if event.get("competitions") else {}

    slug = (league_info.get("slug") or "").lower()
    if slug in ESPN_SLUG_MAP:
        return ESPN_SLUG_MAP[slug]

    mid_name = (league_info.get("midsizeName") or "").strip()
    if mid_name and mid_name.lower() not in GENERIC_REJECTS:
        return clean_title_case(mid_name)

    abbr = (league_info.get("abbreviation") or "").strip()
    if abbr and abbr.lower() not in GENERIC_REJECTS and len(abbr) >= 3:
        return abbr.upper()

    name = (league_info.get("name") or "").strip()
    if name and name.lower() not in GENERIC_REJECTS:
        n_lower = name.lower()
        for k, v in LEAGUE_TEXT_MAP.items():
            if k in n_lower:
                return v
        return clean_title_case(name)

    notes = comp_obj.get("notes", [])
    if notes and isinstance(notes, list) and len(notes) > 0:
        headline = notes[0].get("headline", "").strip()
        if headline:
            h_lower = headline.lower()
            if "copa del rey" in h_lower: return "Copa del Rey"
            if "world cup" in h_lower: return "World Cup Qualifiers"
            if "afcon" in h_lower or "africa cup" in h_lower: return "AFCON Qualifiers"
            if "ncaa" in h_lower or "college" in h_lower: return "NCAA College Soccer"

    h_team, a_team = home_team.lower(), away_team.lower()
    if any(x in h_team or x in a_team for x in ["hornets", "highlanders", "ucla", "stanford", "uc riverside", "sacramento"]):
        return "NCAA College Soccer"
    if any(x in h_team or x in a_team for x in ["real madrid", "real sociedad", "barcelona", "atletico"]):
        return "LaLiga"
    if any(x in h_team or x in a_team for x in ["cienciano", "adt", "universitario", "alianza lima"]):
        return "Peru - Liga 1"
    if any(x in h_team or x in a_team for x in ["zürich", "xamax", "basel", "young boys"]):
        return "Swiss Super League"
    if ("australia" in h_team and "brazil" in a_team) or ("national" in h_team):
        return "Int. Friendly"

    return default_label if default_label.lower() not in GENERIC_REJECTS else "Top Leagues"

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

def extract_real_team_stats(comp: dict, is_home: bool, team_name: str) -> Tuple[float, str]:
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
            
            base_xg = 0.90 + (win_rate * 1.80) - (loss_rate * 0.50) + (0.08 if is_home else 0.0)
            formatted_record = f"{wins}W-{draws}D-{losses}L"
            return round(max(0.5, min(3.8, base_xg)), 2), formatted_record
        except Exception:
            pass
            
    t_lower = team_name.lower().strip()
    for known_team, power in REAL_WORLD_POWER_INDEX.items():
        if known_team in t_lower:
            xg_val = power + (0.08 if is_home else 0.0)
            return round(xg_val, 2), f"Power Rank ({power})"

    fallback_xg = 1.30 + (0.08 if is_home else 0.0)
    return round(fallback_xg, 2), "Neutral Baseline"

def poisson_prob(lmbda: float, k: int) -> float:
    return (math.pow(lmbda, k) * math.exp(-lmbda)) / math.factorial(k)

def compute_unbiased_prediction(home_team: str, away_team: str, home_comp: dict, away_comp: dict, sport: str):
    home_xg, home_rec = extract_real_team_stats(home_comp, is_home=True, team_name=home_team)
    away_xg, away_rec = extract_real_team_stats(away_comp, is_home=False, team_name=away_team)

    home_win, draw, away_win = 0.0, 0.0, 0.0
    o15, o25, o35, o45, btts = 0.0, 0.0, 0.0, 0.0, 0.0

    for h in range(7):
        for a in range(7):
            p = poisson_prob(home_xg, h) * poisson_prob(away_xg, a)
            if h > a: home_win += p
            elif h == a: draw += p
            else: away_win += p
            if (h + a) > 1.5: o15 += p
            if (h + a) > 2.5: o25 += p
            if (h + a) > 3.5: o35 += p
            if (h + a) > 4.5: o45 += p
            if h > 0 and a > 0: btts += p

    hw = max(5, round(home_win * 100))
    dr = max(2, round(draw * 100)) if sport == "Football" else 2
    aw = max(5, round(away_win * 100))
    o15_p = round(o15 * 100)
    o25_p = round(o25 * 100)
    o35_p = round(o35 * 100)
    o45_p = round(o45 * 100)
    btts_p = round(btts * 100)
    u25_p = 100 - o25_p

    total_expected_goals = home_xg + away_xg

    if sport == "Basketball":
        detail = f"{home_team} -3.5" if hw >= aw else f"{away_team} +3.5"
    elif sport == "Tennis":
        detail = f"{home_team} Win" if hw >= aw else f"{away_team} Win"
    elif sport == "Rugby":
        detail = f"{home_team} -5.5" if hw >= aw else f"{away_team} +5.5"
    else:  # Football - Default Mixed Selection
        if hw >= 46 and (hw - aw) >= 10:
            detail = f"{home_team} Straight Win"
        elif aw >= 44 and (aw - hw) >= 8:
            detail = f"{away_team} Straight Win"
        elif hw >= 38 and (hw - aw) >= 4:
            detail = f"{home_team} Win or Draw (1X)"
        elif aw >= 36 and (aw - hw) >= 4:
            detail = f"{away_team} Win or Draw (X2)"
        elif total_expected_goals >= 3.20 or o35_p >= 48:
            detail = "Over 3.5 Goals Scored"
        elif o25_p >= 58 and total_expected_goals >= 2.65:
            detail = "Over 2.5 Goals Scored"
        elif btts_p >= 58 and home_xg >= 1.25 and away_xg >= 1.25:
            detail = "Both Teams to Score (BTTS)"
        elif u25_p >= 58 or total_expected_goals <= 1.85:
            detail = "Under 2.5 Goals Scored"
        elif o15_p >= 75:
            detail = "Over 1.5 Goals Scored"
        elif hw >= aw:
            detail = f"{home_team} Win or Draw (1X)"
        else:
            detail = f"{away_team} Win or Draw (X2)"

    max_confidence = max(hw, aw, o25_p if sport == "Football" else 0)

    summary = (
        f"Stat comparison ({home_rec} vs {away_rec}). "
        f"Calculated probabilities: Home {hw}%, Draw {dr}%, Away {aw}%. Recommended market: {detail} ({max_confidence}% confidence)."
    )

    return {
        "detail": detail,
        "max_confidence": max_confidence,
        "probabilities": AiProbabilitiesSchema(
            homeWin=hw, draw=dr, awayWin=aw, 
            over15=o15_p, over25=o25_p, over35=o35_p, over45=o45_p, 
            btts=btts_p
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
    
    if "over 4.5" in detail_lower:
        return total_goals > 4.5
    elif "under 4.5" in detail_lower:
        return total_goals < 4.5
    elif "over 3.5" in detail_lower:
        return total_goals > 3.5
    elif "under 3.5" in detail_lower:
        return total_goals < 3.5
    elif "over 2.5" in detail_lower:
        return total_goals > 2.5
    elif "under 2.5" in detail_lower:
        return total_goals < 2.5
    elif "over 1.5" in detail_lower:
        return total_goals > 1.5
    elif "under 1.5" in detail_lower:
        return total_goals < 1.5
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

                    league_name = resolve_clean_league_name(event, raw_home_team, raw_away_team, default_league_label)

                    home_team = sanitize_team_name(raw_home_team, league_name)
                    away_team = sanitize_team_name(raw_away_team, league_name)

                    h_lower = home_team.lower().strip()
                    a_lower = away_team.lower().strip()
                    if h_lower in seen_teams_today or a_lower in seen_teams_today:
                        continue
                    
                    seen_teams_today.add(h_lower)
                    seen_teams_today.add(a_lower)

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

frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        if full_path.startswith("api/"):
            return {"detail": "API endpoint not found"}
        target_file = os.path.join(frontend_dist, full_path)
        if os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root_status():
        return {"status": "MicroPulse API Engine Running", "fixtures_endpoint": "/api/v1/fixtures"}
