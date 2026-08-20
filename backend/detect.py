from ultralytics import YOLO
import cv2
import time
import os

model = YOLO("best.pt")
model.fuse()


def analyze_waste(image_path):

    results = model.predict(
        source=image_path,
        imgsz=416,
        conf=0.4,
        device="cpu",
        verbose=False
    )

    result = results[0]
    names = model.names

    plastic = 0
    metal = 0
    organic = 0

    total = len(result.boxes)

    print("All Classes:", names)
    print("Total detections:", total)

    for box in result.boxes:

        cls = int(box.cls[0])
        label = names[cls]

        print("Detected Label:", label)

        # Handle your actual YOLO class name
        label_lower = label.lower()

        if "plastic" in label_lower:
            plastic += 1

        elif "metal" in label_lower:
            metal += 1

        elif "organic" in label_lower:
            organic += 1

    # Convert detections to percentages
    if total > 0:

        plastic = round((plastic / total) * 100, 2)
        metal = round((metal / total) * 100, 2)
        organic = round((organic / total) * 100, 2)

    # Create annotated image
    plotted = result.plot()

    os.makedirs("uploads", exist_ok=True)

    detected_path = (
        f"uploads/detected_{int(time.time() * 1000)}.png"
    )

    cv2.imwrite(
        detected_path,
        plotted
    )

    print(
        f"Results → Plastic: {plastic}%, "
        f"Metal: {metal}%, "
        f"Organic: {organic}%"
    )

    return {
        "plastic": plastic,
        "metal": metal,
        "organic": organic,
        "detected_image": detected_path
    }
