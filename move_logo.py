import shutil
import os

source = "/Users/reepsy/.gemini/antigravity/brain/08db9f79-2ef1-46e2-b2e1-45fd31e1f095/vroomx_final_v4_dynamic_stroke_1768863843213.png"
destination = "/Users/reepsy/Documents/TRUCKING COMPLIANCE HUB1/logo.png"

try:
    shutil.copy2(source, destination)
    print(f"Successfully copied logo to {destination}")
except Exception as e:
    print(f"Error copying file: {e}")
