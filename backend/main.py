from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel

from database import (
    SessionLocal,
    User,
    Report
)

from fastapi.middleware.cors import CORSMiddleware

from detect import analyze_waste

import shutil
import os
import time

app = FastAPI()

# ==========================
# CREATE UPLOADS FOLDER
# ==========================
os.makedirs("uploads", exist_ok=True)

# ==========================
# ALLOW FRONTEND CONNECTION
# ==========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================
# USER MODEL
# ==========================
class UserCreate(BaseModel):

    name: str

    city: str

# ==========================
# REGISTER USER API
# ==========================
@app.post("/register")
def register_user(user: UserCreate):

    db = SessionLocal()

    new_user = User(
        name=user.name,
        city=user.city
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {

        "message": "User Registered",

        "user_id": new_user.id,

        "name": new_user.name,

        "city": new_user.city

    }

# ==========================
# ANALYZE IMAGE API
# ==========================
from fastapi import Form

@app.post("/analyze")
async def analyze_image(
    user_id: int = Form(...),
    file: UploadFile = File(...)
):

    # ==========================
    # UNIQUE FILE NAME
    # ==========================
    unique_filename = (
        f"{int(time.time())}_{file.filename}"
    )

    file_path = f"uploads/{unique_filename}"

    # ==========================
    # SAVE IMAGE
    # ==========================
    with open(file_path, "wb") as buffer:

        shutil.copyfileobj(file.file, buffer)

    # ==========================
    # YOLO ANALYSIS
    # ==========================
    result = analyze_waste(file_path)

    # ==========================
    # DATABASE
    # ==========================
    db = SessionLocal()

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    # ==========================
    # USER NOT FOUND
    # ==========================
    if not user:

        return {
            "message": "User not found"
        }

    # ==========================
    # UPDATE USER STATS
    # ==========================
    user.points += 10

    user.reports_count += 1

    user.garbage_reported += 2.5

    # ==========================
    # SAVE REPORT
    # ==========================
    new_report = Report(

        user_id=user.id,

        image_path=file_path,

        plastic=result["plastic"],

        metal=result["metal"],

        organic=result["organic"],

        location=user.city

    )

    db.add(new_report)

    db.commit()

    db.refresh(user)

    # ==========================
    # RETURN RESPONSE
    # ==========================
    return {

        "message": "Image Uploaded Successfully",

        "results": result,

        "stats": {

            "points": user.points,

            "reports": user.reports_count,

            "garbage": user.garbage_reported

        }

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
            "message": "User not found"
        }

    return {

        "id": user.id,

        "name": user.name,

        "city": user.city,

        "points": user.points,

        "reports": user.reports_count,

        "garbage": user.garbage_reported

    }

# ==========================
# HOME ROUTE
# ==========================
@app.get("/")
def home():

    return {
        "message": "EcoVision AI Backend Running"
    }