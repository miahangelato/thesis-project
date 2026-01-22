import json
import logging
import os

logger = logging.getLogger(__name__)


class OpenAIService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            # Try loading from .env manually if not in environment
            try:
                env_path = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)), ".env"
                )
                if os.path.exists(env_path):
                    with open(env_path) as f:
                        for line in f:
                            if line.strip().startswith("OPENAI_API_KEY="):
                                api_key = (
                                    line.split("=", 1)[1].strip().strip('"').strip("'")
                                )
                                os.environ["OPENAI_API_KEY"] = api_key
                                break
            except Exception as e:
                logger.warning(f"Could not load .env file: {e}")

        if not api_key:
            logger.error("OPENAI_API_KEY not found. OpenAI service will fail.")
            # We don't raise here to allow application to start, but calls will fail

        try:
            from openai import OpenAI  # noqa: PLC0415

            self.client = OpenAI(api_key=api_key)
            self.model_name = "gpt-4o-mini"  # Much cheaper than gpt-3.5-turbo
            logger.info(f"OpenAI service initialized with model {self.model_name}")
        except ImportError:
            logger.error(
                "openai module not found. Please install it: pip install openai"
            )
            self.client = None

        self._initialized = True

    def generate_risk_explanation(self, patient_data: dict) -> str:
        """Generate risk explanation using OpenAI."""
        if not self.client:
            return self._fallback_explanation(patient_data)

        prompt = self._build_explanation_prompt(patient_data)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful medical AI assistant.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=600,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI explanation generation failed: {e}")
            return self._fallback_explanation(patient_data)

    def generate_patient_explanation(
        self, analysis_results: dict, demographics: dict
    ) -> str:
        """Generate comprehensive explanation for patient results."""
        if not self.client:
            return self._fallback_comprehensive_explanation(
                analysis_results, demographics
            )

        # Re-use the prompt construction logic from Gemini service for consistency
        # In a real refactor, this prompt should be central, but duplication is safer for now to avoid breaking Gemini
        prompt = f"""
You are a compassionate medical AI assistant. Generate a clear, personable health report for a patient.

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

SCIENTIFIC CONTEXT (Use this to explain HOW the result was calculated):
1. **"No-Age" Diabetes Model**:
   - The model EXPLICITLY excludes age to prevent discrimination. It relies on biology, not age.
   - **Key Features by Importance**: 1. #1 Height ({demographics.get("height_cm", "N/A")}cm) - Strongest predictor.
     2. #2 Whorl Patterns (Patient has {analysis_results["pattern_counts"]["Whorl"]}) - Specific variations correlate with insulin resistance.
     3. #3 Loop Patterns (Patient has {analysis_results["pattern_counts"]["Loop"]}) - Secondary marker.
     4. #4 Arch Patterns (Patient has {analysis_results["pattern_counts"]["Arc"]}).
     5. #5 Weight ({demographics.get("weight_kg", "N/A")}kg) - Metabolic indicator.
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
                    {
                        "role": "system",
                        "content": "You are a helpful medical assistant.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            return self._fallback_comprehensive_explanation(
                analysis_results, demographics
            )

    def generate_health_facilities(self, risk_level: str) -> list:
        """Generate recommended health facilities based on risk level."""
        from .constants import FACILITIES_DB  # noqa: PLC0415

        if not self.client:
            return self._fallback_facilities()

        logger.info(
            f"🏥 Starting health facilities generation for risk level: {risk_level}"
        )
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
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                response_format={"type": "json_object"},
            )

            text = response.choices[0].message.content.strip()

            # OpenAI typically returns straight JSON if instructed, but handle wrapping just in case
            if text.startswith("```json"):
                text = text[7:-3]
            elif text.startswith("```"):
                text = text[3:-3]

            facilities = json.loads(text)
            # Sometimes OpenAI wraps in {"facilities": [...]} if not explicit
            if isinstance(facilities, dict) and "facilities" in facilities:
                facilities = facilities["facilities"]

            return facilities
        except Exception as e:
            logger.error(f"OpenAI facility generation failed: {e}")
            return self._fallback_facilities()

    def _build_explanation_prompt(self, data: dict) -> str:
        # Same as Gemini prompt but simplified for text reuse
        return f"""
        Analyze the following Type 2 Diabetes risk assessment:
        - Risk Score: {data.get("risk_score", 0):.2f} ({data.get("risk_level", "Unknown")})
        - BMI: {data.get("bmi", "N/A")}
        - Fingerprint Patterns: {data.get("pattern_whorl", 0)} Whorls, {data.get("pattern_loop", 0)} Loops, {data.get("pattern_arc", 0)} Arcs

        Explain why this risk level was assigned based on BMI and dermatoglyphics.
        """

    def _fallback_explanation(self, data: dict) -> str:
        """Fallback if AI fails."""
        risk_level = data.get("risk_level", "unknown").lower()
        templates = {
            "low": f"Your diabetes risk assessment shows a low risk level ({data.get('risk_score', 0):.1%}). Your biological markers (fingerprints and height) and BMI indicate a favorable profile.",
            "moderate": f"Your assessment indicates a moderate risk level ({data.get('risk_score', 0):.1%}). Your BMI of {data.get('bmi', 'N/A')} and fingerprint patterns contribute to this assessment.",
            "high": f"Your assessment shows an elevated risk level ({data.get('risk_score', 0):.1%}). Biological factors including your height, fingerprint patterns, and BMI ({data.get('bmi', 'N/A')}) contribute to this result.",
        }
        return templates.get(risk_level, "Risk assessment completed.")

    def _fallback_comprehensive_explanation(
        self, results: dict, demographics: dict
    ) -> str:
        """Fallback explanation if OpenAI fails."""
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
        # Add basic recommendations based on risk
        if risk == "High":
            explanation += "- Consult with a healthcare provider for a comprehensive evaluation.\n- Monitor your blood sugar levels regularly.\n- Maintain a balanced diet and regular exercise routine."
        elif risk == "Moderate":
            explanation += "- Consider scheduling a check-up with your doctor.\n- Focus on maintaining a healthy weight.\n- Adopt a heart-healthy diet."
        else:
            explanation += "- Continue maintaining your healthy lifestyle habits.\n- Regular check-ups are still recommended for preventive care."

        return explanation.strip()

    def generate_doctor_explanation(self, structured_response: dict) -> str:
        """Generate a personalized, empathetic doctor-like explanation.
        
        Takes the full structured response (INPUT, PREDICTIONS, risk_assessment, 
        clinical_interpretation, model_info) and generates an explanation that:
        1. Explains WHY the results are what they are
        2. References dermatoglyphic studies
        3. Reassures that this is just a prediction
        4. Explains the fingerprint pattern traits
        
        Args:
            structured_response: Full response dict containing all prediction data
        
        Returns:
            Personalized explanation as a doctor would give to a worried patient
        """
        if not self.client:
            return self._fallback_doctor_explanation(structured_response)
        
        # Extract data from structured response
        input_data = structured_response.get("input", {})
        predictions = structured_response.get("predictions", {})
        risk_assessment = structured_response.get("risk_assessment", {})
        clinical_interpretation = structured_response.get("clinical_interpretation", {})
        model_info = structured_response.get("model_info", {})
        pattern_probs = input_data.get("fingerprint_patterns", {})
        
        prompt = f"""
You are a compassionate, professional doctor speaking to a patient who is worried about their diabetes screening results. Your goal is to:
1. Explain the results clearly and honestly
2. Help them understand WHY they got this result (the scientific basis)
3. Reassure them that this is a SCREENING tool, not a diagnosis
4. Explain what their fingerprint patterns mean about them as a person
5. Provide actionable next steps

PATIENT'S SCREENING DATA:
========================

INPUT (What we measured):
- Weight: {input_data.get('weight_kg', 'N/A')} kg
- Height: {input_data.get('height_cm', 'N/A')} cm
- Gender: {input_data.get('gender', 'N/A')}
- BMI: {input_data.get('bmi', 'N/A')}
- Fingerprint Patterns:
  * Arc probability: {pattern_probs.get('arc_probability', 0):.1%}
  * Loop probability: {pattern_probs.get('loop_probability', 0):.1%}
  * Whorl probability: {pattern_probs.get('whorl_probability', 0):.1%}
  * Dominant pattern: {pattern_probs.get('dominant_pattern', 'Unknown')}

PREDICTIONS:
- Diabetes Probability: {predictions.get('diabetes_probability_percent', 'N/A')}
- Predicted Class: {predictions.get('predicted_class', 'N/A')}
- Binary Classification: {predictions.get('binary_classification', 'N/A')}

RISK ASSESSMENT:
- Risk Level: {risk_assessment.get('risk_level', 'N/A')}
- Urgency: {risk_assessment.get('urgency', 'N/A')}
- Recommendation: {risk_assessment.get('recommendation', 'N/A')}
- Risk Score: {risk_assessment.get('risk_score', 'N/A')}/100

CLINICAL INTERPRETATION:
- Primary Risk Factor: {clinical_interpretation.get('primary_risk_factor', 'N/A')}
- BMI Category: {clinical_interpretation.get('bmi_category', 'N/A')}
- Confidence: {clinical_interpretation.get('confidence', 'N/A')}

MODEL INFO:
- Model Version: {model_info.get('model_version', 'v3_calibrated')}
- Model Accuracy: {model_info.get('model_accuracy', '94.7%')}
- Features Used: {', '.join(model_info.get('features_used', ['weight', 'height', 'gender', 'bmi', 'fingerprint_patterns']))}

SCIENTIFIC CONTEXT FOR YOUR EXPLANATION:
========================================

REAL DERMATOGLYPHIC RESEARCH (Published Studies Only - DO NOT INVENT):

**Fingerprint-Diabetes Correlations:**
- Abdul et al. (2025) - Kuwaiti population study: Found 48% loop patterns among diabetics. Diabetic males predominantly show loops, while diabetic females show whorls. Non-diabetics show contrasting patterns.
- Tadesse et al. (2022) - East African study: While total finger ridge counts did not differ significantly, tri-radius angles were significantly wider in Type II diabetic patients.
- Clevin et al. (2023) - Western Kenya study (300 participants): Significantly higher frequency of whorl patterns among female diabetics, notable decrease in ulnar loop patterns. Variations closely associated with family history of diabetes.
- Guo et al. (2022) - Genetic abnormalities may manifest as distinct dermatoglyphic patterns due to embryological link between skin ridge formation and organ development.

**Blood Group Correlations:**
- Rastogi et al. (2023) - Eastern India study: Significant associations between fingerprint patterns and ABO blood groups. Loop patterns frequently correlate with O+ blood type (most common universal donor).

**General Dermatoglyphics:**
- Abbasi & Ayoubzadeh (2023) - Dermatoglyphics increasingly recognized as non-invasive biomarker for genetic predispositions since 2020.
- Smail (2020) - Fingerprint ridge patterns develop between 5th-21st weeks of gestation and remain stable throughout life.

**Philippine Context:**
- Cando et al. (2024) - Philippines has ~4.3M diagnosed diabetics and 2.8M undiagnosed (as of 2021). Nearly 40% remain undiagnosed due to lack of awareness and screening.

**Key Insight:** 
Fingerprints form at weeks 13-19 of fetal development, the same period as pancreas development. This creates a permanent biological marker that may reflect genetic/developmental factors. This is a CORRELATION, not causation.

PATTERN CHARACTERISTICS (What patterns mean):
- LOOP (60-65% of population): Most common pattern. Associated with adaptability, balanced personality. Research shows higher frequency in diabetic populations (Abdul 2025).
- WHORL (25-35% of population): Circular ridge formations. Associated with independence, analytical thinking. Studies show protective association against diabetes, especially in females (Clevin 2023).
- ARC (5% of population): Least common, simple arch shape. Associated with practical, grounded personality. Shows neutral correlation with diabetes risk.

YOUR RESPONSE STRUCTURE:
========================

Generate a warm, professional explanation with these sections:

1. **Opening (Reassurance first)**
   - Start with a calming, human greeting
   - Acknowledge they may have concerns
   - Emphasize this is a screening, NOT a diagnosis

2. **Understanding Your Results**
   - Explain their risk level in simple terms
   - Be honest but not alarming
   - Use phrases like "Your screening suggests..." or "Based on our analysis..."

3. **Why You Got This Result (The Science)**
   - Explain the specific factors that contributed to THEIR result
   - Reference the actual research studies appropriately (use author names and years)
   - Explain how fingerprints relate to metabolic health (fetal development connection)
   - Make it personal to their specific pattern and BMI

4. **About Your Fingerprint Patterns**
   - Explain what their dominant pattern means
   - Share characteristics associated with their pattern
   - Explain the statistical correlation (NOT causation) with health
   - Reference relevant studies (e.g., "Studies like Abdul et al. 2025 found that...")

5. **Important Perspective**
   - Strongly emphasize: "This does NOT mean you have or will have diabetes"
   - Explain that many people with similar patterns never develop diabetes
   - Note that lifestyle factors (diet, exercise) have much greater impact than fingerprints
   - Reference Philippine context from Cando et al. 2024 if relevant

6. **What To Do Next**
   - Specific, actionable recommendations based on their risk level
   - If High Risk: Recommend clinical follow-up but don't cause panic
   - If Moderate: Suggest lifestyle awareness and optional screening
   - If Low: Encourage maintaining healthy habits

7. **Closing**
   - Empowering, positive message
   - Remind them they are in control of their health
   - Offer to answer questions (even if virtual)

TONE REQUIREMENTS:
- Be warm and human, not robotic
- Avoid medical jargon unless explained
- NEVER use alarming words like "danger", "severe", "critical"
- Focus on empowerment, not fear
- Be scientifically accurate but accessible
- Write as if speaking face-to-face with a worried patient

CRITICAL: Only reference the studies listed above. DO NOT invent studies or citations. If you mention a study, it MUST be from the list provided.

FORMATTING:
- Use clear paragraph breaks
- No markdown symbols (no **, ##, etc.)
- Use simple bullet points if needed (-)
- Keep it conversational, not clinical
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a compassionate, experienced doctor explaining health screening results to a patient. You are warm, reassuring, scientifically accurate, and focused on empowering the patient.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=1000,  # Reduced from 1500 to save costs
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI doctor explanation generation failed: {e}")
            return self._fallback_doctor_explanation(structured_response)

    def _fallback_doctor_explanation(self, structured_response: dict) -> str:
        """Template-based fallback if OpenAI fails."""
        risk_level = structured_response.get("risk_assessment", {}).get("risk_level", "Low Risk")
        probability_percent = structured_response.get("predictions", {}).get("diabetes_probability_percent", "N/A")
        dominant_pattern = structured_response.get("input", {}).get("fingerprint_patterns", {}).get("dominant_pattern", "Loop")
        bmi = structured_response.get("input", {}).get("bmi", "N/A")
        
        pattern_traits = {
            "Loop": "adaptability and balance",
            "Whorl": "independence and analytical thinking", 
            "Arc": "practicality and groundedness"
        }
        trait = pattern_traits.get(dominant_pattern, "unique characteristics")
        
        if "High" in risk_level:
            return f"""
Hello,

I want to start by reassuring you that what we're looking at today is a screening result, not a diagnosis. Your screening showed a risk score of {probability_percent}, which places you in a higher-risk category for diabetes screening purposes.

This result is based on a combination of factors: your BMI of {bmi} and the analysis of your fingerprint patterns. Your dominant {dominant_pattern.lower()} pattern, which is associated with {trait}, has been correlated in research studies with certain metabolic markers.

Here's what's important to understand: Having this result does NOT mean you have diabetes or will definitely develop it. Many people with similar patterns live healthy lives without ever developing diabetes. Your lifestyle choices - diet, exercise, stress management - have a much greater impact on your actual risk than your fingerprint patterns.

What I recommend:
- Schedule a follow-up with your healthcare provider within the next month
- Consider getting a fasting blood glucose or HbA1c test for clinical confirmation
- Focus on a balanced diet low in processed sugars
- Aim for regular physical activity

Remember, you are in control of your health. This screening is a tool to help you be proactive, not a prediction of your future. Take care, and please don't hesitate to reach out with questions.
"""
        elif "Moderate" in risk_level:
            return f"""
Hello,

Thank you for taking the time to undergo this health screening. Your results show a risk score of {probability_percent}, which places you in a moderate-risk category.

Let me explain what this means: Our screening analyzed your physical measurements (BMI of {bmi}) along with your fingerprint patterns. Your dominant {dominant_pattern.lower()} pattern, associated with {trait}, contributes to this assessment based on research in dermatoglyphics - the study of fingerprint patterns and health correlations.

I want to be very clear: this is a screening tool, not a diagnosis. A moderate risk score simply means it may be beneficial for you to stay aware of your metabolic health. Many people with similar results never develop diabetes.

My suggestions:
- Consider scheduling a health check-up within the next 6 months
- Maintain a balanced diet with plenty of vegetables and whole grains
- Stay physically active - even daily walks make a difference
- Monitor your weight and stress levels

Your fingerprint patterns are just one factor among many. They don't determine your future - your choices do. Stay positive and proactive!
"""
        else:
            return f"""
Hello,

Great news! Your screening results are very encouraging. Your risk score of {probability_percent} places you in a low-risk category for diabetes.

Based on our analysis of your BMI ({bmi}) and fingerprint patterns, your overall profile looks favorable. Your dominant {dominant_pattern.lower()} pattern, associated with {trait}, combined with your other measurements, suggests a healthy metabolic profile.

What does this mean? Your biological markers don't show significant correlations with diabetes risk factors. This is positive, but remember - this is a screening, not a guarantee.

To maintain this healthy trajectory:
- Continue your healthy lifestyle habits
- Schedule routine check-ups every 24 months
- Stay physically active
- Maintain a balanced diet

If you have a family history of diabetes, you might consider more frequent monitoring, but overall, your results are reassuring. Keep up the good work!
"""

    def _fallback_facilities(self) -> list:
        """Fallback to static list from Angeles if AI fails."""
        from .constants import FACILITIES_DB  # noqa: PLC0415

        return FACILITIES_DB.get("Angeles", [])[:3]


_openai_service = None


def get_openai_service() -> OpenAIService:
    global _openai_service  # noqa: PLW0603
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service
