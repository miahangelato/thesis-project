import os
import google.generativeai as genai

# Manually load .env to ensure we have the key
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value.strip().strip('"').strip("'")

api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    models = list(genai.list_models())
    
    print("AVAILABLE MODELS:")
    for m in models:
        if 'generateContent' in m.supported_generation_methods:
            print(f"{m.name}")

except Exception as e:
    print(f"API Error: {str(e)}")
