"""Gemini Pro service for AI-powered report generation."""

import logging
import os
from typing import Dict

import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY in environment")

        genai.configure(api_key=api_key)
        # Use gemini-flash-latest (Stable Flash with best free tier quotas)
        # Use low temperature for consistency and safety
        self.model = genai.GenerativeModel(
            "gemini-flash-latest",
            generation_config={"temperature": 0.3}  # Low temp for privacy/consistency
        )
        logger.info("[PRIVACY] Gemini Flash service initialized (temperature=0.3)")

    def generate_risk_explanation(self, patient_data: Dict, session_id: str = None) -> str:
        """Generate personalized risk explanation.
        
        PRIVACY: If session_id provided, uses session-scoped cache.
        """
        from .cache_service import get_response_cache  # noqa: PLC0415

        # Check session-scoped cache first if session_id exists
        cache = None
        if session_id:
            cache = get_response_cache()
            cached_response = cache.get(session_id, patient_data)
            if cached_response:
                logger.info(f"[PRIVACY] Gemini: Using cached explanation for session {session_id[:8]}...")
                return cached_response

        prompt = f"""
You are a medical AI assistant. Generate a brief, professional explanation of diabetes risk assessment.

Patient Data:
- Age: {patient_data["age"]} years
- BMI: {patient_data["bmi"]}
- Fingerprint Patterns: {patient_data["pattern_arc"]} Arcs, {patient_data["pattern_whorl"]} Whorls, {patient_data["pattern_loop"]} Loops
- Risk Score: {patient_data["risk_score"]:.2%}
- Risk Level: {patient_data["risk_level"]}

Generate a 2-3 sentence explanation for the patient that:
1. Explains what the risk score means
2. Mentions the key contributing factors
3. Is empathetic and clear

Do not include medical advice or recommendations.
"""

        try:
            # Apply rate limiting
            import time  # noqa: PLC0415

            from .rate_limiter import get_gemini_rate_limiter  # noqa: PLC0415

            rate_limiter = get_gemini_rate_limiter()
            wait_time = rate_limiter.wait_if_needed()
            if wait_time:
                logger.warning(f"Gemini: Rate limited, waiting {wait_time:.2f}s")
                time.sleep(wait_time)

            response = self.model.generate_content(prompt)
            explanation = response.text.strip()
            
            # Cache for THIS SESSION ONLY
            if session_id and cache:
                cache.set(session_id, patient_data, explanation)
                logger.info(f"[PRIVACY] Gemini: Generated and cached new explanation for session {session_id[:8]}...")
            return explanation
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            fallback = self._fallback_explanation(patient_data)
            # Cache fallback to avoid repeated failures (session-scoped)
            if session_id and cache:
                cache.set(session_id, patient_data, fallback)
            return fallback

    def _fallback_explanation(self, data: Dict) -> str:
        """Template-based fallback if Gemini fails."""
        risk_level = data["risk_level"].lower()

        templates = {
            "low": f"Your diabetes risk assessment shows a low risk level ({data['risk_score']:.1%}). Your biological markers (fingerprints and height) and BMI indicate a favorable profile.",
            "moderate": f"Your assessment indicates a moderate risk level ({data['risk_score']:.1%}). Your BMI of {data['bmi']} and fingerprint patterns contribute to this assessment.",
            "high": f"Your assessment shows an elevated risk level ({data['risk_score']:.1%}). Biological factors including your height, fingerprint patterns, and BMI ({data['bmi']}) contribute to this result.",
        }

        return templates.get(risk_level, "Risk assessment completed.")

    def generate_patient_explanation(
        self, analysis_results: Dict, demographics: Dict, session_id: str = None
    ) -> str:
        """Generate comprehensive explanation for patient results.
        
        PRIVACY: If session_id provided, uses session-scoped cache.
        """
        from .cache_service import get_response_cache  # noqa: PLC0415

        # Check cache if session_id provided
        cache = None
        if session_id:
            cache = get_response_cache()
            # Create a composite key or just use the data
            cached_response = cache.get(session_id, {"results": analysis_results, "demo": demographics})
            if cached_response:
                logger.info(f"[PRIVACY] Gemini: Using cached comprehensive report for session {session_id[:8]}...")
                return cached_response

        prompt = f"""
You are a medical health screening assistant. Generate a scientifically accurate, calm health screening report.

PATIENT PROFILE:
- Age: {demographics["age"]} years
- Gender: {demographics["gender"]}
- BMI: {analysis_results["bmi"]}
- Blood Type: {demographics.get("blood_type", "Unknown")} (Patient reported)

ANALYSIS RESULTS:
- Diabetes Risk Score: {analysis_results["diabetes_risk_score"]:.1%}
- Risk Level: {analysis_results["diabetes_risk_level"]}
- Predicted Blood Group (from fingerprint AI): {analysis_results["predicted_blood_group"]}
- Fingerprint Patterns: {analysis_results["pattern_counts"]["Whorl"]} Whorls, {analysis_results["pattern_counts"]["Loop"]} Loops, {analysis_results["pattern_counts"]["Arc"]} Arcs

SCIENTIFIC CONTEXT:
Dermatoglyphic research suggests that fingerprint patterns may show statistical correlations with certain genetic and metabolic conditions at a population level.

Studies have observed that:
- Whorl patterns appear more frequently in populations with diabetes
- Loop patterns are the most common in the general population and are considered baseline
- Arch patterns are less common and show weaker associations with metabolic conditions

⚠️ These patterns do not cause disease. They are considered biological markers that may reflect early developmental influences.

INSTRUCTIONS - Generate a report with this clean structure (NO markdown symbols like ##, **, etc.):

📊 Your Fingerprint Pattern Summary

Based on your scanned fingerprints:
- Whorls: {analysis_results["pattern_counts"]["Whorl"]}
- Loops: {analysis_results["pattern_counts"]["Loop"]}
- Arches: {analysis_results["pattern_counts"]["Arc"]}

[Provide 1-2 sentences explaining what this pattern distribution suggests in correlation with the risk level, without claiming causation]

🤖 How This Affected Your Result
Fingerprint pattern analysis was used as one component of your overall health screening.
It was combined with:
- Image-based fingerprint feature extraction (Convolutional Neural Networks - CNNs)
- Machine-learning risk models (e.g., Random Forest classifiers, trained on population health data)

📌 Fingerprint patterns alone did not determine your result.
They contributed alongside other factors to generate a screening-level risk assessment.

Recommendations
[Provide 3-4 actionable recommendations based on their risk level]

🛡️ Important Note
This analysis is intended for health screening and research purposes only.
It does not provide a medical diagnosis. Always consult a licensed healthcare professional for clinical evaluation.

TONE GUIDELINES:
- Use calm, research-based language
- Emphasize "correlation, not diagnosis"
- No alarmist words
- Be clear that this is a screening tool
- DO NOT include patient demographics (age, gender, BMI) - these are already shown in the UI
- DO NOT use markdown formatting symbols (no ##, **, ---, etc.)
- Use only plain text with emoji icons for visual organization
"""

        try:
            # Apply rate limiting
            import re  # noqa: PLC0415
            import time  # noqa: PLC0415

            from .rate_limiter import get_gemini_rate_limiter  # noqa: PLC0415

            rate_limiter = get_gemini_rate_limiter()

            # Simple retry loop for 429 errors
            max_retries = 3
            for attempt in range(max_retries):
                wait_time = rate_limiter.wait_if_needed()
                if wait_time:
                    logger.warning(
                        f"Gemini: Local rate limit, waiting {wait_time:.2f}s"
                    )
                    time.sleep(wait_time)

                try:
                    response = self.model.generate_content(prompt)
                    text = response.text.strip()
                    
                    # Cache result if session active
                    if session_id and cache:
                        cache.set(session_id, {"results": analysis_results, "demo": demographics}, text)
                        logger.info(f"[PRIVACY] Gemini: Cached comprehensive report for session {session_id[:8]}...")
                        
                    return text
                except Exception as e:
                    error_str = str(e)
                    if "429" in error_str and attempt < max_retries - 1:
                        logger.warning(
                            "Gemini quota exceeded (attempt %s/%s). Retrying...",
                            attempt + 1,
                            max_retries,
                        )
                        logger.warning("Gemini 429 error: %s", e)

                        # Try to extract retry delay or default to 30s
                        sleep_for = 30
                        if "retry in" in error_str:
                            try:
                                match = re.search(r"retry in (\d+(\.\d+)?)s", error_str)
                                if match:
                                    sleep_for = (
                                        float(match.group(1)) + 1
                                    )  # Add mild buffer
                            except Exception:
                                pass

                        logger.info("Sleeping %.1fs before retry", sleep_for)
                        time.sleep(sleep_for)
                        continue
                    else:
                        raise e  # Re-raise if not 429 or out of retries

        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            logger.error(f"Gemini generation failed: {e}")
            return self._fallback_comprehensive_explanation(
                analysis_results, demographics
            )

    def generate_doctor_explanation(self, structured_response: Dict, session_id: str = None) -> str:
        """Generate a compassionate wellness screening explanation.
        
        PRIVACY: If session_id provided, uses session-scoped cache.
        """
        from .cache_service import get_response_cache  # noqa: PLC0415
        
        # Check cache if session_id provided
        cache = None
        if session_id:
            cache = get_response_cache()
            cached_response = cache.get(session_id, structured_response)
            if cached_response:
                logger.info(f"[PRIVACY] Gemini: Using cached doctor explanation for session {session_id[:8]}...")
                return cached_response

        # Extract data from structured response
        input_data = structured_response.get("input", {})
        risk_assessment = structured_response.get("risk_assessment", {})
        pattern_probs = input_data.get("fingerprint_patterns", {})
        
        # Check for unusual inputs
        bmi = input_data.get('bmi', 0)
        height = input_data.get('height_cm', 0)
        weight = input_data.get('weight_kg', 0)
        
        unusual_input = False
        if height < 100 or height > 250 or weight < 30 or weight > 300 or bmi > 80 or bmi < 10:
            unusual_input = True
        
        prompt = f"""You are a compassionate clinician explaining a WELLNESS SCREENING result.

Rules:
- Do NOT cite research/studies/authors/statistics.
- Do NOT claim fingerprints are medically proven predictors.
- Do NOT describe personality traits from fingerprints.
- Emphasize: screening estimate, not diagnosis; confirm with HbA1c/fasting glucose.
- If inputs look unusual, advise re-checking.

Use these headings:
What this result means
What this result does NOT mean
What influenced this estimate
What you can do next

Data:
- Risk level: {risk_assessment.get('risk_level', 'N/A')}
- Risk score: {risk_assessment.get('risk_score', 'N/A')}/100
- BMI: {bmi}
- Height: {height} cm
- Weight: {weight} kg
- Dominant pattern: {pattern_probs.get('dominant_pattern', 'Unknown')} (experimental input)
- Unusual input detected: {'Yes - suggest rechecking measurements' if unusual_input else 'No'}

Keep under 200 words. Be warm and reassuring.
"""

        try:
            # Apply rate limiting
            import time  # noqa: PLC0415
            from .rate_limiter import get_gemini_rate_limiter  # noqa: PLC0415
            
            rate_limiter = get_gemini_rate_limiter()
            if rate_limiter.wait_if_needed():
                time.sleep(rate_limiter.wait_if_needed())

            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Cache result if session active
            if session_id and cache:
                cache.set(session_id, structured_response, text)
                logger.info(f"[PRIVACY] Gemini: Cached doctor explanation for session {session_id[:8]}...")
                
            return text
        except Exception as e:
            logger.error(f"Gemini doctor explanation failed: {e}")
            from .openai_service import get_openai_service # fallback to openai logic if needed, or simple template
            # Actually easier to just implement a simple fallback here to avoid circular dep
            fallback = self._fallback_doctor_explanation(structured_response)
            if session_id and cache:
                cache.set(session_id, structured_response, fallback)
            return fallback

    def _fallback_doctor_explanation(self, structured_response: Dict) -> str:
        """Template-based fallback if Gemini fails."""
        risk_level = structured_response.get("risk_assessment", {}).get("risk_level", "Low Risk")
        probability_percent = structured_response.get("predictions", {}).get("diabetes_probability_percent", "N/A")
        bmi = structured_response.get("input", {}).get("bmi", "N/A")
        
        if "High" in risk_level:
            return f"""What this result means
Your wellness screening shows a higher estimated risk for diabetes (score: {probability_percent}). This suggests it may be beneficial to follow up with clinical testing.

What this result does NOT mean
This is not a diagnosis. It does not confirm you have or will develop diabetes. Only medical tests like HbA1c or fasting glucose can confirm that.

What influenced this estimate
Your BMI ({bmi}) and experimental, non-diagnostic fingerprint pattern analysis were used as model inputs. These are screening estimates, not proven medical predictors.

What you can do next
• Schedule a follow-up with your healthcare provider within the next month
• Ask about a fasting blood glucose or HbA1c test
• Focus on a balanced diet and regular physical activity
• Remember: lifestyle choices have the greatest impact on your health"""
        elif "Moderate" in risk_level:
            return f"""What this result means
Your wellness screening shows a moderate estimated risk (score: {probability_percent}). This suggests staying aware of your metabolic health may be beneficial.

What this result does NOT mean
This is not a diagnosis or confirmation of disease. Many people with similar results remain healthy. Only proper medical testing can assess your actual health.

What influenced this estimate
Your BMI ({bmi}) and experimental fingerprint pattern inputs contributed to this estimate. These are non-diagnostic screening tools, not medical certainty.

What you can do next
• Consider scheduling a health check-up within 6 months
• Maintain a balanced diet with plenty of vegetables
• Stay physically active - even daily walks help
• Your choices matter more than any screening estimate"""
        else:
            return f"""What this result means
Your wellness screening shows a lower estimated risk for diabetes (score: {probability_percent}). The information you provided suggests a favorable profile at this time.

What this result does NOT mean
This is not a guarantee of health. Screening results can change over time, and healthy habits remain important regardless of this estimate.

What influenced this estimate
Your BMI ({bmi}) and experimental, non-diagnostic pattern analysis were used. These are screening estimates based on provided measurements.

What you can do next
• Continue maintaining healthy lifestyle habits
• Schedule routine check-ups every 1-2 years
• Stay physically active and eat well
• Monitor any changes in your health over time""" 


    def generate_health_facilities(self, risk_level: str) -> list:
        """Generate recommended health facilities based on risk level."""
        import json  # noqa: PLC0415

        from .constants import FACILITIES_DB  # noqa: PLC0415

        logger.info(
            f"🏥 Starting health facilities generation for risk level: {risk_level}"
        )

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
            logger.info(
                f"✅ Successfully parsed {len(facilities)} facilities from Gemini"
            )
            for idx, fac in enumerate(facilities):
                logger.debug(
                    f"  {idx + 1}. {fac.get('name', 'Unknown')} ({fac.get('city', 'Unknown')})"
                )

            return facilities
        except Exception as e:
            logger.error(f"❌ Gemini facility generation failed: {e}")
            logger.warning("⚠️ Falling back to static facilities list")
            return self._fallback_facilities()

    def _fallback_facilities(self) -> list:
        """Fallback to static list from Angeles if AI fails - REAL DATA ONLY."""
        from .constants import FACILITIES_DB  # noqa: PLC0415

        # Return first 3 facilities from Angeles - NO SIMULATED FIELDS
        return FACILITIES_DB.get("Angeles", [])[:3]

    def _fallback_comprehensive_explanation(
        self, results: Dict, demographics: Dict
    ) -> str:
        """Fallback explanation if Gemini fails."""
        risk = results["diabetes_risk_level"]
        blood_group = results["predicted_blood_group"]

        explanation = f"""
**Health Assessment Summary**

Your diabetes risk assessment indicates a {risk} risk level (confidence: {results["diabetes_confidence"]:.1%}). This screening is based on your unique biological markers, not just your age.

**Key Findings:**
- Your BMI is {results["bmi"]}
- Fingerprint analysis revealed {results["pattern_counts"]["Whorl"]} Whorls, {results["pattern_counts"]["Loop"]} Loops, and {results["pattern_counts"]["Arc"]} Arcs
- AI predicted blood group: {blood_group}

**Recommendations:**
"""

        if risk.lower() in ["high", "moderate"]:
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
    global _gemini_instance  # noqa: PLW0603
    if _gemini_instance is None:
        _gemini_instance = GeminiService()
    return _gemini_instance
