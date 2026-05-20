from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request
from database import SessionLocal, User, Report

from detect import analyze_waste

import shutil
import time

# ==========================
# FASTAPI
# ==========================
app = FastAPI()
@app.put("/status/{report_id}")
async def update_status(

    report_id: int,

    request: Request

):

    data = await request.json()

    db = SessionLocal()

    report = (

        db.query(Report)

        .filter(Report.id == report_id)

        .first()

    )

    if report:

        report.status = data["status"]

        db.commit()

    return {
        "message": "Status Updated"
    }
# ==========================
# CORS
# ==========================
app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)

# ==========================
# STATIC FILES
# ==========================
app.mount(

    "/uploads",

    StaticFiles(directory="uploads"),

    name="uploads"

)

# ==========================
# ROOT
# ==========================
@app.get("/")
def home():

    return {
        "message": "EcoVision AI Backend Running"
    }

# ==========================
# REGISTER USER
# ==========================
@app.post("/register")
def register_user(data: dict):

    db = SessionLocal()

    user = User(

        name=data["name"],

        city=data["city"],

        points=0,

        reports=0,

        garbage=0

    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return {

        "message": "User Registered",

        "user_id": user.id,

        "name": user.name,

        "city": user.city

    }

# ==========================
# GET USER DASHBOARD
# ==========================
@app.get("/user/{user_id}")
def get_user(user_id: int):

    db = SessionLocal()

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        return {
            "error": "User not found"
        }

    return {

        "id": user.id,

        "name": user.name,

        "city": user.city,

        "points": user.points,

        "reports": user.reports,

        "garbage": user.garbage

    }

# ==========================
# ANALYZE IMAGE
# ==========================
@app.post("/analyze")
async def analyze_image(

    user_id: int = Form(...),

    latitude: str = Form(...),

    longitude: str = Form(...),

    file: UploadFile = File(...)

):

    # SAVE IMAGE
    filename = f"uploads/{int(time.time())}_{file.filename}"

    with open(filename, "wb") as buffer:

        shutil.copyfileobj(file.file, buffer)

    # AI ANALYSIS
    results = analyze_waste(filename)

    # DATABASE
    db = SessionLocal()

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        return {
            "error": "User not found"
        }

    # UPDATE USER STATS
    user.points += 10

    user.reports += 1

    user.garbage += 5

    # SAVE REPORT
    report = Report(

        user_id=user_id,

        image_path=filename,

        plastic=results["plastic"],

        metal=results["metal"],

        organic=results["organic"],

        latitude=latitude,

        longitude=longitude,

        location=user.city,

        status="Pending"

    )

    db.add(report)

    db.commit()

    return {

        "message": "Analysis Complete",

        "results": results,

        "stats": {

            "points": user.points,

            "reports": user.reports,

            "garbage": user.garbage

        }

    }

# ==========================
# MUNICIPAL REPORTS
# ==========================
@app.get("/reports")
def get_reports():

    db = SessionLocal()

    reports = db.query(Report).all()

    all_reports = []

    for report in reports:

        all_reports.append({

            "id": report.id,

            "image": report.image_path,

            "plastic": report.plastic,

            "metal": report.metal,

            "organic": report.organic,

            "location": report.location,

            "latitude": report.latitude,

            "longitude": report.longitude,

            "status": report.status

        })

    return all_reports
@app.put("/clean/{report_id}")
def clean_report(report_id: int):

    db = SessionLocal()

    report = (
        db.query(Report)
        .filter(Report.id == report_id)
        .first()
    )

    if report:

        report.status = "Cleaned"

        db.commit()

    db.close()

    return {
        "message": "Updated"
    }