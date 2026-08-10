from ultralytics import YOLO
import cv2
import time

# ==========================
# LOAD MODEL (ONLY ONCE)
# ==========================
model = YOLO("best.pt")
model.fuse()


# ==========================
# AI DETECTION
# ==========================
def analyze_waste(image_path):

    results = model.predict(
        source=image_path,
        imgsz=640,
        conf=0.4,
        device="cpu",
        verbose=False
    )

    result = results[0]

    names = model.names

    print("All Classes:", names)

   plastic = 100 
    metal = 0
    organic = 0

    total = len(result.boxes)

    for box in result.boxes:

        cls = int(box.cls[0])
        label = str(names[cls]).lower()

        print("Detected Label:", label)

        if "plastic" in label:
            plastic += 1

        elif "metal" in label:
            metal += 1

        elif "organic" in label:
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
