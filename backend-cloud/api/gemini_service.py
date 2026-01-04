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
        # Use gemini-1.5-flash for better free tier quotas
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini Flash service initialized")
    
    def generate_risk_explanation(self, patient_data: Dict) -> str:
        """Generate personalized risk explanation."""
        from .cache_service import get_response_cache
        
        # Check cache first
        cache = get_response_cache()
        cached_response = cache.get(patient_data)
        if cached_response:
            logger.info("Gemini: Using cached explanation")
            return cached_response
        
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
            # Apply rate limiting
            from .rate_limiter import get_gemini_rate_limiter
            import time
            
            rate_limiter = get_gemini_rate_limiter()
            wait_time = rate_limiter.wait_if_needed()
            if wait_time:
                logger.warning(f"Gemini: Rate limited, waiting {wait_time:.2f}s")
                time.sleep(wait_time)
            
            response = self.model.generate_content(prompt)
            explanation = response.text.strip()
            # Cache the successful response
            cache.set(patient_data, explanation)
            logger.info("Gemini: Generated and cached new explanation")
            return explanation
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            fallback = self._fallback_explanation(patient_data)
            # Cache fallback to avoid repeated failures
            cache.set(patient_data, fallback)
            return fallback
    
    def _fallback_explanation(self, data: Dict) -> str:
        """Template-based fallback if Gemini fails."""
        risk_level = data['risk_level'].lower()
        
        templates = {
            "low": f"Your diabetes risk assessment shows a low risk level ({data['risk_score']:.1%}). Your biological markers (fingerprints and height) and BMI indicate a favorable profile.",
            "moderate": f"Your assessment indicates a moderate risk level ({data['risk_score']:.1%}). Your BMI of {data['bmi']} and fingerprint patterns contribute to this assessment.",
            "high": f"Your assessment shows an elevated risk level ({data['risk_score']:.1%}). Biological factors including your height, fingerprint patterns, and BMI ({data['bmi']}) contribute to this result."
        }
        
        return templates.get(risk_level, "Risk assessment completed.")
    
    def generate_patient_explanation(self, analysis_results: Dict, demographics: Dict) -> str:
        """Generate comprehensive explanation for patient results."""
        
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
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"❌ GEMINI ERROR: {str(e)}")  # Visible in console
            logger.error(f"Gemini generation failed: {e}")
            return self._fallback_comprehensive_explanation(analysis_results, demographics)
    
    def generate_health_facilities(self, risk_level: str) -> list:
        """Generate recommended health facilities based on risk level."""
        from .constants import FACILITIES_DB
        import json
        
        logger.info(f"🏥 Starting health facilities generation for risk level: {risk_level}")
        
        # Prepare the context from our verified database
        facilities_context = json.dumps(FACILITIES_DB, indent=2)
        logger.debug(f"📋 Facilities database loaded with {len(FACILITIES_DB)} cities")
        
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
        
        logger.info("🤖 Calling Gemini API for facility recommendations...")
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            logger.debug(f"✅ Gemini response received (length: {len(text)} chars)")
            logger.debug(f"📄 Raw response preview: {text[:200]}...")
            
            # Clean markdown formatting
            if text.startswith("```json"):
                text = text[7:-3]
                logger.debug("🧹 Cleaned JSON markdown formatting")
            elif text.startswith("```"):
                text = text[3:-3]
                logger.debug("🧹 Cleaned generic markdown formatting")
                
            facilities = json.loads(text.strip())
            logger.info(f"✅ Successfully parsed {len(facilities)} facilities from Gemini")
            for idx, fac in enumerate(facilities):
                logger.debug(f"  {idx+1}. {fac.get('name', 'Unknown')} ({fac.get('city', 'Unknown')})")
            
            return facilities
        except Exception as e:
            logger.error(f"❌ Gemini facility generation failed: {e}")
            logger.warning("⚠️ Falling back to static facilities list")
            return self._fallback_facilities()


    def _fallback_facilities(self) -> list:
        """Fallback to static list from Angeles if AI fails - REAL DATA ONLY."""
        from .constants import FACILITIES_DB
        
        # Return first 3 facilities from Angeles - NO SIMULATED FIELDS
        return FACILITIES_DB.get("Angeles", [])[:3]
    
    def _fallback_comprehensive_explanation(self, results: Dict, demographics: Dict) -> str:
        """Fallback explanation if Gemini fails."""
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
        
        if risk.lower() in ['high', 'moderate']:
            explanation += """
- Schedule a consultation with your healthcare provider for proper evaluation
- Consider regular blood glucose monitoring
- Maintain a balanced diet and regular exercise routine
- Keep track of your weight and BMI
"""
        else:
            explanation += """
- Continue maintaining your healthy lifestyle
- Stay physically active and eat a balanced diet
- Get regular health checkups
- Consider donating blood if you're willing and eligible
"""
        
        return explanation.strip()



_gemini_instance = None

def get_gemini_service() -> GeminiService:
    """Singleton pattern for Gemini service."""
    global _gemini_instance
    if _gemini_instance is None:
        _gemini_instance = GeminiService()
    return _gemini_instance
