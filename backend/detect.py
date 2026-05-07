from ultralytics import YOLO
import cv2
import os
import random

# LOAD MODEL
model = YOLO("best.pt")

# CLASS NAMES
CLASS_NAMES = [
    "plastic",
    "metal",
    "organic"
]

def analyze_waste(image_path):

    # RUN YOLO
    results = model(image_path)

    result = results[0]

    # READ IMAGE
    image = cv2.imread(image_path)

    plastic = 0
    metal = 0
    organic = 0

    # DETECTION LOOP
    for box in result.boxes:

        cls_id = int(box.cls[0])

        class_name = CLASS_NAMES[cls_id]

        confidence = float(box.conf[0])

        # BOX COORDINATES
        x1, y1, x2, y2 = map(
            int,
            box.xyxy[0]
        )

        # RANDOM COLORS
        color = (
            random.randint(0,255),
            random.randint(0,255),
            random.randint(0,255)
        )

        # DRAW BOX
        cv2.rectangle(
            image,
            (x1, y1),
            (x2, y2),
            color,
            3
        )

        # LABEL
        label = f"{class_name} {confidence:.2f}"

        cv2.putText(
            image,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color,
            2
        )

        # COUNTS
        if class_name == "plastic":
            plastic += 1

        elif class_name == "metal":
            metal += 1

        elif class_name == "organic":
            organic += 1

    # TOTAL
    total = plastic + metal + organic

    if total == 0:
        total = 1

    # PERCENTAGES
    plastic_percent = round(
        (plastic / total) * 100,
        2
    )

    metal_percent = round(
        (metal / total) * 100,
        2
    )

    organic_percent = round(
        (organic / total) * 100,
        2
    )

    # SAVE DETECTED IMAGE
    detected_path = (
        "uploads/detected_" +
        os.path.basename(image_path)
    )

    cv2.imwrite(
        detected_path,
        image
    )

    return {

        "plastic": plastic_percent,

        "metal": metal_percent,

        "organic": organic_percent,

        "detected_image": detected_path

    }