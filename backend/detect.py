from ultralytics import YOLO
import cv2
import os
import time

model = YOLO("best.pt")

def analyze_waste(image_path):

    results = model(image_path)

    result = results[0]

    names = model.names

    plastic = 0
    metal = 0
    organic = 0

    total = len(result.boxes)

    for box in result.boxes:

        cls = int(box.cls[0])

        label = names[cls]

        if label == "plastic":
            plastic += 1

        elif label == "metal":
            metal += 1

        elif label == "organic":
            organic += 1

    if total > 0:

        plastic = round((plastic / total) * 100, 2)

        metal = round((metal / total) * 100, 2)

        organic = round((organic / total) * 100, 2)

    plotted = result.plot()

    detected_path = f"uploads/detected_{int(time.time())}.png"

    cv2.imwrite(detected_path, plotted)

    return {
        "plastic": plastic,
        "metal": metal,
        "organic": organic,
        "detected_image": detected_path
    }