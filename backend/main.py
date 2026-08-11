from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware

from detect import analyze_waste
from supabase_client import supabase, BUCKET_NAME

import os
import shutil
import uuid


# ==========================
# FASTAPI
# ==========================

app = FastAPI()


# ==========================
# CORS
# ==========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ecoai-frontend.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

    response = (
        supabase
        .table("users")
        .insert({
            "name": data["name"],
            "city": data["city"],
            "points": 0,
            "reports": 0,
            "garbage": 0
        })
        .select()
        .execute()
    )

    if not response.data:
        return {
            "error": "User registration failed"
        }

    user = response.data[0]

    return {
        "message": "User Registered",
        "user_id": user["id"],
        "name": user["name"],
        "city": user["city"]
    }


# ==========================
# GET USER
# ==========================

@app.get("/user/{user_id}")
def get_user(user_id: int):

    response = (
        supabase
        .table("users")
        .select("*")
        .eq("id", user_id)
        .execute()
    )

    if not response.data:
        return {
            "error": "User not found"
        }

    user = response.data[0]

    return {
        "id": user["id"],
        "name": user["name"],
        "city": user["city"],
        "points": user["points"],
        "reports": user["reports"],
        "garbage": user["garbage"]
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

    # ==========================
    # CHECK USER
    # ==========================

    user_response = (
        supabase
        .table("users")
        .select("*")
        .eq("id", user_id)
        .execute()
    )

    if not user_response.data:
        return {
            "error": "User not found"
        }

    user = user_response.data[0]


    # ==========================
    # TEMP DIRECTORY
    # ==========================

    os.makedirs("uploads", exist_ok=True)


    # ==========================
    # SAVE TEMPORARY IMAGE
    # ==========================

    extension = os.path.splitext(file.filename)[1]

    if not extension:
        extension = ".png"

    unique_id = uuid.uuid4().hex

    temp_filename = f"uploads/{unique_id}{extension}"

    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)


    # ==========================
    # AI ANALYSIS
    # ==========================

    results = analyze_waste(temp_filename)


    # ==========================
    # UPLOAD ORIGINAL IMAGE
    # ==========================

    original_storage_path = (
        f"original/{unique_id}{extension}"
    )

    with open(temp_filename, "rb") as image_file:

        supabase.storage \
            .from_(BUCKET_NAME) \
            .upload(
                original_storage_path,
                image_file,
                {
                    "content-type":
                        file.content_type or "image/png"
                }
            )


    # ==========================
    # UPLOAD DETECTED IMAGE
    # ==========================

    detected_path = results["detected_image"]

    detected_storage_path = (
        f"detected/{unique_id}.png"
    )

    with open(detected_path, "rb") as detected_file:

        supabase.storage \
            .from_(BUCKET_NAME) \
            .upload(
                detected_storage_path,
                detected_file,
                {
                    "content-type": "image/png"
                }
            )


    # ==========================
    # PUBLIC URLS
    # ==========================

    original_url = (
        supabase.storage
        .from_(BUCKET_NAME)
        .get_public_url(original_storage_path)
    )

    detected_url = (
        supabase.storage
        .from_(BUCKET_NAME)
        .get_public_url(detected_storage_path)
    )


    # ==========================
    # UPDATE USER STATS
    # ==========================

    new_points = user["points"] + 10
    new_reports = user["reports"] + 1
    new_garbage = user["garbage"] + 5

    (
        supabase
        .table("users")
        .update({
            "points": new_points,
            "reports": new_reports,
            "garbage": new_garbage
        })
        .eq("id", user_id)
        .execute()
    )


    # ==========================
    # SAVE REPORT
    # ==========================

    (
        supabase
        .table("reports")
        .insert({
            "user_id": user_id,
            "image_url": detected_url,
            "plastic": results["plastic"],
            "metal": results["metal"],
            "organic": results["organic"],
            "latitude": latitude,
            "longitude": longitude,
            "location": user["city"],
            "status": "Pending"
        })
        .execute()
    )


    # ==========================
    # DELETE TEMPORARY FILES
    # ==========================

    try:

        os.remove(temp_filename)

        if os.path.exists(detected_path):
            os.remove(detected_path)

    except Exception as error:

        print(
            "Temporary file cleanup error:",
            error
        )


    # ==========================
    # RESPONSE
    # ==========================

    return {

        "message": "Analysis Complete",

        "results": {

            "plastic": results["plastic"],

            "metal": results["metal"],

            "organic": results["organic"],

            "detected_image": detected_url,

            "original_image": original_url

        },

        "stats": {

            "points": new_points,

            "reports": new_reports,

            "garbage": new_garbage

        }

    }


# ==========================
# MUNICIPAL REPORTS
# ==========================

@app.get("/reports")
def get_reports():

    response = (
        supabase
        .table("reports")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    reports = response.data

    all_reports = []

    for report in reports:

        all_reports.append({

            "id": report["id"],

            "image": report["image_url"],

            "plastic": report["plastic"],

            "metal": report["metal"],

            "organic": report["organic"],

            "location": report["location"],

            "latitude": report["latitude"],

            "longitude": report["longitude"],

            "status": report["status"]

        })

    return all_reports


# ==========================
# UPDATE STATUS
# ==========================

@app.put("/status/{report_id}")
async def update_status(
    report_id: int,
    request: Request
):

    data = await request.json()

    (
        supabase
        .table("reports")
        .update({
            "status": data["status"]
        })
        .eq("id", report_id)
        .execute()
    )

    return {
        "message": "Status Updated"
    }


# ==========================
# CLEAN REPORT
# ==========================

@app.put("/clean/{report_id}")
def clean_report(report_id: int):

    (
        supabase
        .table("reports")
        .update({
            "status": "Cleaned"
        })
        .eq("id", report_id)
        .execute()
    )

    return {
        "message": "Updated"
    }
