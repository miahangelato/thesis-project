# Edge Node (FastAPI + OpenVINO)

Local bridge running on the Kiosk Mini PC for hardware control and AI inference.

## Stack
- FastAPI
- OpenVINO (Intel optimization)
- DigitalPersona SDK
- Ollama (Local LLM)

## Hardware
- Intel Alder Lake Mini PC
- DigitalPersona Fingerprint Scanner

## Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the bridge
python main.py
```

## Security
- All patient data processed in RAM only
- Encrypted communication with cloud backend
- Auto-wipe after each request
