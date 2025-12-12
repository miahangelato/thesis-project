"""Gemini Pro service for AI-powered report generation."""

import os
import logging
from typing import Dict
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiService:
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY in environment")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini Flash service initialized")
    
    def generate_risk_explanation(self, patient_data: Dict) -> str:
        """Generate personalized risk explanation."""
        
        prompt = f"""
You are a medical AI assistant. Generate a brief, professional explanation of diabetes risk assessment.

Patient Data:
- Age: {patient_data['age']} years
- BMI: {patient_data['bmi']}
- Fingerprint Patterns: {patient_data['pattern_arc']} Arcs, {patient_data['pattern_whorl']} Whorls, {patient_data['pattern_loop']} Loops
- Risk Score: {patient_data['risk_score']:.2%}
- Risk Level: {patient_data['risk_level']}

Generate a 2-3 sentence explanation for the patient that:
1. Explains what the risk score means
2. Mentions the key contributing factors
3. Is empathetic and clear

Do not include medical advice or recommendations.
"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            return self._fallback_explanation(patient_data)
    
    def _fallback_explanation(self, data: Dict) -> str:
        """Template-based fallback if Gemini fails."""
        risk_level = data['risk_level'].lower()
        
        templates = {
            "low": f"Your diabetes risk assessment shows a low risk level ({data['risk_score']:.1%}). Your current health indicators are within favorable ranges.",
            "moderate": f"Your assessment indicates a moderate risk level ({data['risk_score']:.1%}). Your BMI of {data['bmi']} and age contribute to this assessment.",
            "high": f"Your assessment shows an elevated risk level ({data['risk_score']:.1%}). Multiple factors including BMI ({data['bmi']}) contribute to this result."
        }
        
        return templates.get(risk_level, "Risk assessment completed.")


_gemini_instance = None

def get_gemini_service() -> GeminiService:
    """Singleton pattern for Gemini service."""
    global _gemini_instance
    if _gemini_instance is None:
        _gemini_instance = GeminiService()
    return _gemini_instance
