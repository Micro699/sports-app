import os
import math
import requests
from datetime import datetime
from typing import List
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="MicroPulse Real ESPN Multi-Sport AI Engine")

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

def poisson_prob(lmbda: float, k: int) -> float:
    return (math.pow(lmbda, k) * math.exp(-lmbda)) / math.factorial(k)

def compute_prediction(home_team: str, away_team: str, sport: str):
    h_seed = sum(ord(c) for c in home_team) % 10
    a_seed = sum(ord(c) for c in away_team) % 10

    home_xg = round(max(0.8, 1.8 + (h_seed * 0.12) - (a_seed * 0.04)), 2)
    away_xg = round(max(0.5, 1.1 + (a_seed * 0.10) - (h_seed * 0.04)), 2)

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
        detail = f"{home_team} -3.5 Point Spread" if hw >= aw else f"{away_team} +3.5 Point Spread"
    elif sport == "Tennis":
        detail = f"{home_team} Match Winner" if hw >= aw else f"{away_team} Match Winner"
    elif sport == "Rugby":
        detail = f"{home_team} Win (-5.5)" if hw >= aw else f"{away_team} Win (+5.5)"
    else:  # Football
        if o25_p >= 68:
            detail = "Over 2.5 Goals Scored"
        elif hw > aw:
            detail = f"{home_team} Win or Draw"
        else:
            detail = f"{away_team} Win or Draw"

    max_confidence = max(hw, aw, o25_p if sport == "Football" else 0)

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
        "summary": f"{sport} Poisson model ({home_xg} vs {away_xg} xG). Recommended selection: {detail} ({max_confidence}% confidence)."
    }

DEFAULT_LOGO = "https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo.png"

ESPN_SPORT_ENDPOINTS = {
    "Football": [
        ("soccer/all", "Football")
    ],
    "Basketball": [
        ("basketball/nba", "NBA"),
        ("basketball/mens-college-basketball", "NCAA Basketball")
    ],
    "Tennis": [
        ("tennis/atp", "ATP Tennis"),
        ("tennis/wta", "WTA Tennis")
    ],
    "Rugby": [
        ("rugby/leagues", "Rugby Union")
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
                    league_info = event.get("league", {}) or {}
                    league_name = league_info.get("name") or event.get("season", {}).get("slug") or default_league_label

                    status_info = event.get("status", {}).get("type", {})
                    state = status_info.get("state", "pre")
                    detail = status_info.get("shortDetail", "")

                    if state == "in":
                        match_status = "LIVE"
                        formatted_time = detail if detail else "LIVE"
                    elif state == "post":
                        match_status = "FINISHED"
                        formatted_time = "FT"
                    else:
                        match_status = "UPCOMING"
                        raw_date = event.get("date", "")
                        try:
                            dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                            formatted_time = dt.strftime("%d %b %Y, %H:%M")
                        except Exception:
                            formatted_time = target_date

                    competitions = event.get("competitions", [{}])[0]
                    competitors = competitions.get("competitors", [])
                    
                    if len(competitors) < 2:
                        continue

                    c1, c2 = competitors[0], competitors[1]
                    home_comp = c1 if c1.get("homeAway") == "home" else c2
                    away_comp = c2 if c1.get("homeAway") == "home" else c1

                    home_team = home_comp.get("team", {}).get("displayName", "Home")
                    home_logo = home_comp.get("team", {}).get("logo", DEFAULT_LOGO)
                    home_score = int(home_comp.get("score", 0)) if home_comp.get("score") else 0
                    
                    away_team = away_comp.get("team", {}).get("displayName", "Away")
                    away_logo = away_comp.get("team", {}).get("logo", DEFAULT_LOGO)
                    away_score = int(away_comp.get("score", 0)) if away_comp.get("score") else 0

                    # STRICT DEDUPLICATION
                    h_lower = home_team.lower().strip()
                    a_lower = away_team.lower().strip()
                    if h_lower in seen_teams_today or a_lower in seen_teams_today:
                        continue
                    
                    seen_teams_today.add(h_lower)
                    seen_teams_today.add(a_lower)

                    ai = compute_prediction(home_team, away_team, sport)

                    raw_matches.append({
                        "id": f"espn_{event_id}",
                        "sport": sport,
                        "league": league_name,
                        "dateTime": formatted_time,
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
                        "aiSummary": ai["summary"]
                    })
        except Exception as e:
            print(f"Error fetching real ESPN fixtures for {endpoint_path}: {e}")

    # Rank matches by confidence
    raw_matches.sort(key=lambda x: x["confidence"], reverse=True)

    matches = []
    for idx, item in enumerate(raw_matches):
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
            isHot=(idx < 25),
            predictionTitle=item["predictionTitle"],
            predictionDetail=item["predictionDetail"],
            odds=item["odds"],
            aiProbabilities=item["aiProbabilities"],
            aiSummary=item["aiSummary"]
        ))

    return matches

# --- MOUNT REACT FRONTEND AT THE BOTTOM OF MAIN.PY ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")
else:
    @app.get("/")
    def read_root():
        return {
            "status": "Backend API is online",
            "warning": f"Frontend folder not found at {FRONTEND_DIR}"
        }
