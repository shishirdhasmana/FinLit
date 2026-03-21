import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

print("=== EMBEDDING MODELS ===")
for model in genai.list_models():
    if "embed" in model.name.lower():
        print(model.name)

print("\n=== CHAT MODELS ===")
for model in genai.list_models():
    if "generateContent" in model.supported_generation_methods:
        print(model.name)