import os

import google.generativeai as genai

# Manually load .env to ensure we have the key
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            stripped_line = line.strip()
            if (
                stripped_line
                and not stripped_line.startswith("#")
                and "=" in stripped_line
            ):
                key, value = stripped_line.split("=", 1)
                os.environ[key] = value.strip().strip('"').strip("'")

api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    models = list(genai.list_models())

    print("AVAILABLE MODELS:")
    for m in models:
        if "generateContent" in m.supported_generation_methods:
            print(f"{m.name}")

except Exception as e:
    print(f"API Error: {e!s}")
