import os
import logging
from typing import Dict, Optional, List
import json
import time

logger = logging.getLogger(__name__)

class OpenAIService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(OpenAIService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Try loading from .env manually if not in environment
            try:
                env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
                if os.path.exists(env_path):
                    with open(env_path, 'r') as f:
                        for line in f:
                            if line.strip().startswith('OPENAI_API_KEY='):
                                api_key = line.split('=', 1)[1].strip().strip('"').strip("'")
                                os.environ["OPENAI_API_KEY"] = api_key
                                break
            except Exception as e:
                logger.warning(f"Could not load .env file: {e}")

        if not api_key:
            logger.error("OPENAI_API_KEY not found. OpenAI service will fail.")
            # We don't raise here to allow application to start, but calls will fail
        
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            self.model_name = "gpt-3.5-turbo"
            logger.info(f"OpenAI service initialized with model {self.model_name}")
        except ImportError:
            logger.error("openai module not found. Please install it: pip install openai")
            self.client = None
            
        self._initialized = True
    
    def generate_risk_explanation(self, patient_data: Dict) -> str:
        """Generate risk explanation using OpenAI."""
        if not self.client:
            return self._fallback_explanation(patient_data)
            
        prompt = self._build_explanation_prompt(patient_data)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful medical AI assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=600
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI explanation generation failed: {e}")
            return self._fallback_explanation(patient_data)

    def generate_patient_explanation(self, analysis_results: Dict, demographics: Dict) -> str:
        """Generate comprehensive explanation for patient results."""
        if not self.client:
            return self._fallback_comprehensive_explanation(analysis_results, demographics)

        # Re-use the prompt construction logic from Gemini service for consistency
        # In a real refactor, this prompt should be central, but duplication is safer for now to avoid breaking Gemini
        prompt = f"""
You are a compassionate medical AI assistant. Generate a clear, personable health report for a patient.

PATIENT PROFILE:
- Age: {demographics['age']} years
- Gender: {demographics['gender']}
- BMI: {analysis_results['bmi']}
- Blood Type: {demographics.get('blood_type', 'Unknown')} (Patient reported)

ANALYSIS RESULTS:
- Diabetes Risk Score: {analysis_results['diabetes_risk_score']:.1%}
- Risk Level: {analysis_results['diabetes_risk_level']}
- Predicted Blood Group (from fingerprint AI): {analysis_results['predicted_blood_group']}
- Fingerprint Patterns: {analysis_results['pattern_counts']['Whorl']} Whorls, {analysis_results['pattern_counts']['Loop']} Loops, {analysis_results['pattern_counts']['Arc']} Arcs

SCIENTIFIC CONTEXT (Use this to explain HOW the result was calculated):
1. **"No-Age" Diabetes Model**:
   - The model EXPLICITLY excludes age to prevent discrimination. It relies on biology, not age.
   - **Key Features by Importance**: 
     1. #1 Height ({demographics.get('height_cm', 'N/A')}cm) - Strongest predictor.
     2. #2 Whorl Patterns (Patient has {analysis_results['pattern_counts']['Whorl']}) - Specific variations correlate with insulin resistance.
     3. #3 Loop Patterns (Patient has {analysis_results['pattern_counts']['Loop']}) - Secondary marker.
     4. #4 Arch Patterns (Patient has {analysis_results['pattern_counts']['Arc']}).
     5. #5 Weight ({demographics.get('weight_kg', 'N/A')}kg) - Metabolic indicator.
   - **Logic**: Fetal development of fingerprints (weeks 13-19) overlaps with pancreas development, creating a permanent biological marker.

2. **Blood Group Prediction**:
   - Uses "Deep Metric Learning" (Triplet Loss) to match fingerprint mathematical codes to blood groups.
   - Based on dermatoglyphic statistical correlations (e.g., Type O often links to Loop patterns).

INSTRUCTIONS:
Generate a health report in the following structure:

1. **Summary** (2-3 sentences):
   - Start with their diabetes risk level assessment.
   - Explain that this result comes from analyzing their unique physiological markers (Height, Weight) and dermatoglyphics (Fingerprints), *not just their age*.

2. **Scientific Explanation** (The "Why"):
   - Explain *specifically* for this patient why they got this result using the features above. 
   - Example: "Your risk is influenced by your height combined with the high frequency of Whorl patterns..." or "Your favorable result is supported by..."
   - Mention the "No-Age" logic: "Unlike traditional tools, this AI looks at your biology, not your birth year."

3. **Key Findings** (bullet points):
   - Fingerprint Analysis: Specific count of Whorls/Loops and what it suggests.
   - Blood Group: Mention the AI prediction and confidence.
   - BMI: Mention if it contributes to the risk.

4. **Recommendations** (3-4 actionable tips):
   - Based on risk level, provide specific health advice.
   - If moderate/high: recommend doctor visit.
   - If low: encourage healthy habits.
   - If willing to donate: mention blood donation.

TONE GUIDELINES:
- **Be Calm and Reassuring**: Do NOT use alarmist words like "Warning", "Danger", "Critical", or "Severe".
- **Screening, Not Diagnosis**: Emphasize that this is a *statistical screening* based on their unique biology, not a medical diagnosis. Use phrases like "Your indicators suggest..." or "You may benefit from..."
- **Empowering**: Focus on what they can *do* (actionable steps) rather than just the risk itself.
- **Clear & Simple**: Avoid jargon. Explain the science as if speaking to a friend.

Keep the tone friendly, professional, encouraging, but scientifically transparent. Use simple language.
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful medical assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            return self._fallback_comprehensive_explanation(analysis_results, demographics)

    def generate_health_facilities(self, risk_level: str) -> list:
        """Generate recommended health facilities based on risk level."""
        from .constants import FACILITIES_DB
        import json
        
        if not self.client:
            return self._fallback_facilities()

        logger.info(f"🏥 Starting health facilities generation for risk level: {risk_level}")
        facilities_context = json.dumps(FACILITIES_DB, indent=2)
        
        prompt = f"""
You are a medical referral assistant for a patient in Central Luzon, Philippines.
Patient Status: {risk_level} Diabetes Risk.

Verified Hospital Database:
{facilities_context}

Task:
1. Select exactly 3 facilities from the database that are best suited for this patient.
2. Prioritize facilities with Endocrinology/Diabetes specializations.
3. Provide a mix of locations if appropriate.
4. For each selected facility, add these SIMULATED details:
   - "doctors": List of 2 realistic Filipino doctor names with specializations (e.g., "Dr. Maria Santos - Endocrinologist")
   - "operating_hours": Operating hours (e.g., "24/7 Emergency, Clinics: Mon-Sat 8AM-5PM")
   - "availability": Status like "High Capacity", "Walk-ins Welcome", or "By Appointment"
   - "current_status": "Open" or "Closed"
   - "city": The city from the database

Return ONLY a valid JSON list. Each object must have: name, type, address, google_query, operating_hours, current_status, availability, doctors (list), city.
"""
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a JSON generator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={ "type": "json_object" }
            )
            
            text = response.choices[0].message.content.strip()
            
            # OpenAI typically returns straight JSON if instructed, but handle wrapping just in case
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]
                
            facilities = json.loads(text)
            # Sometimes OpenAI wraps in {"facilities": [...]} if not explicit
            if isinstance(facilities, dict) and 'facilities' in facilities:
                facilities = facilities['facilities']
            
            return facilities
        except Exception as e:
            logger.error(f"OpenAI facility generation failed: {e}")
            return self._fallback_facilities()

    def _build_explanation_prompt(self, data: Dict) -> str:
        # Same as Gemini prompt but simplified for text reuse
        return f"""
        Analyze the following Type 2 Diabetes risk assessment:
        - Risk Score: {data.get('risk_score', 0):.2f} ({data.get('risk_level', 'Unknown')})
        - BMI: {data.get('bmi', 'N/A')}
        - Fingerprint Patterns: {data.get('pattern_whorl', 0)} Whorls, {data.get('pattern_loop', 0)} Loops, {data.get('pattern_arc', 0)} Arcs
        
        Explain why this risk level was assigned based on BMI and dermatoglyphics.
        """

    def _fallback_explanation(self, data: Dict) -> str:
        """Fallback if AI fails."""
        risk_level = data.get('risk_level', 'unknown').lower()
        templates = {
            "low": f"Your diabetes risk assessment shows a low risk level ({data.get('risk_score', 0):.1%}). Your biological markers (fingerprints and height) and BMI indicate a favorable profile.",
            "moderate": f"Your assessment indicates a moderate risk level ({data.get('risk_score', 0):.1%}). Your BMI of {data.get('bmi', 'N/A')} and fingerprint patterns contribute to this assessment.",
            "high": f"Your assessment shows an elevated risk level ({data.get('risk_score', 0):.1%}). Biological factors including your height, fingerprint patterns, and BMI ({data.get('bmi', 'N/A')}) contribute to this result."
        }
        return templates.get(risk_level, "Risk assessment completed.")

    def _fallback_comprehensive_explanation(self, results: Dict, demographics: Dict) -> str:
        """Fallback explanation if OpenAI fails."""
        risk = results['diabetes_risk_level']
        blood_group = results['predicted_blood_group']
        
        explanation = f"""
**Health Assessment Summary**

Your diabetes risk assessment indicates a {risk} risk level (confidence: {results['diabetes_confidence']:.1%}). This screening is based on your unique biological markers, not just your age.

**Key Findings:**
- Your BMI is {results['bmi']}
- Fingerprint analysis revealed {results['pattern_counts']['Whorl']} Whorls, {results['pattern_counts']['Loop']} Loops, and {results['pattern_counts']['Arc']} Arcs
- AI predicted blood group: {blood_group}

**Recommendations:**
"""
        # Add basic recommendations based on risk
        if risk == "High":
            explanation += "- Consult with a healthcare provider for a comprehensive evaluation.\n- Monitor your blood sugar levels regularly.\n- Maintain a balanced diet and regular exercise routine."
        elif risk == "Moderate":
            explanation += "- Consider scheduling a check-up with your doctor.\n- Focus on maintaining a healthy weight.\n- Adopt a heart-healthy diet."
        else:
            explanation += "- Continue maintaining your healthy lifestyle habits.\n- Regular check-ups are still recommended for preventive care."

        return explanation.strip()

    def _fallback_facilities(self) -> list:
        """Fallback to static list from Angeles if AI fails."""
        from .constants import FACILITIES_DB
        return FACILITIES_DB.get("Angeles", [])[:3]

_openai_service = None

def get_openai_service() -> OpenAIService:
    global _openai_service
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service
