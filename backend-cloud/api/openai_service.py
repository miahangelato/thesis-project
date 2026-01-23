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

        system_prompt = """You generate patient-facing WELLNESS SCREENING summaries.

STRICT SAFETY RULES (must follow):
- This is NOT a medical diagnosis.
- Do NOT claim clinical validation or proven medical science.
- Do NOT cite studies, journals, researchers, or statistics.
- Do NOT imply fingerprints or AI can diagnose disease.
- If fingerprints or blood type are mentioned, describe them only as experimental, non-diagnostic model inputs.
- If height, weight, or BMI appear unusual, warn that results may be inaccurate and suggest re-checking inputs.

TONE & STYLE:
- Calm, reassuring, supportive
- Short and easy to scan
- Clear, plain language
- Empowering, not alarming

ALLOWED:
- Encourage clinical confirmation (HbA1c, fasting glucose)
- Encourage healthy lifestyle habits
- Encourage seeing a healthcare professional

NOT ALLOWED:
- Treatment plans
- Medical certainty
- "Research shows" or "studies prove"
"""
        prompt = self._build_explanation_prompt(patient_data)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
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

        # Extract values with proper formatting
        risk_score_percent = f"{analysis_results['diabetes_risk_score'] * 100:.1f}"
        risk_level = analysis_results["diabetes_risk_level"]
        whorl_count = analysis_results["pattern_counts"]["Whorl"]
        loop_count = analysis_results["pattern_counts"]["Loop"]
        arc_count = analysis_results["pattern_counts"]["Arc"]
        blood_group = analysis_results.get("predicted_blood_group", "Unknown")
        
        prompt = f"""Create a wellness screening summary using the information below.

Patient info:
- Age: {demographics.get("age", "N/A")}
- Gender: {demographics.get("gender", "N/A")}
- Height (cm): {demographics.get("height_cm", "N/A")}
- Weight (kg): {demographics.get("weight_kg", "N/A")}
- BMI: {analysis_results["bmi"]}

Screening results:
- Diabetes risk score: {risk_score_percent}%
- Risk level: {risk_level}
- Fingerprint pattern counts (non-diagnostic): 
  Whorl {whorl_count}, Loop {loop_count}, Arc {arc_count}
- Experimental blood group prediction: {blood_group}

Output MUST use this structure:

1) What this result means
2) What this result does NOT mean
3) What influenced this estimate
4) What you can do next

Rules:
- Keep under 180 words
- No medical claims or citations
- Use simple language
- Emphasize user control and uncertainty
"""

        system_prompt = """You generate patient-facing WELLNESS SCREENING summaries.

STRICT SAFETY RULES (must follow):
- This is NOT a medical diagnosis.
- Do NOT claim clinical validation or proven medical science.
- Do NOT cite studies, journals, researchers, or statistics.
- Do NOT imply fingerprints or AI can diagnose disease.
- If fingerprints or blood type are mentioned, describe them only as experimental, non-diagnostic model inputs.
- If height, weight, or BMI appear unusual, warn that results may be inaccurate and suggest re-checking inputs.

TONE & STYLE:
- Calm, reassuring, supportive
- Short and easy to scan
- Clear, plain language
- Empowering, not alarming

ALLOWED:
- Encourage clinical confirmation (HbA1c, fasting glucose)
- Encourage healthy lifestyle habits
- Encourage seeing a healthcare professional

NOT ALLOWED:
- Treatment plans
- Medical certainty
- "Research shows" or "studies prove"
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            return self._fallback_comprehensive_explanation(
                analysis_results, demographics
            )

    def _build_explanation_prompt(self, data: dict) -> str:
        return f"""Create a short wellness screening explanation.

- Risk Score: {data.get("risk_score", 0):.2f} ({data.get("risk_level", "Unknown")})
- BMI: {data.get("bmi", "N/A")}
- Pattern counts (experimental, non-diagnostic): {data.get("pattern_whorl", 0)} Whorl, {data.get("pattern_loop", 0)} Loop, {data.get("pattern_arc", 0)} Arc

Rules:
- Not a diagnosis.
- Do not claim clinical validation.
- Do not cite studies.
- Keep under 120 words.
"""

    def _fallback_explanation(self, data: dict) -> str:
        """Fallback if AI fails."""
        risk_level = data.get("risk_level", "unknown").lower()
        templates = {
            "low": f"Your wellness screening shows a lower estimated risk level ({data.get('risk_score', 0):.1%}) based on your provided measurements and experimental, non-diagnostic model inputs including BMI.",
            "moderate": f"Your wellness screening indicates a moderate estimated risk level ({data.get('risk_score', 0):.1%}). Your BMI of {data.get('bmi', 'N/A')} and experimental pattern analysis contribute to this estimate. Consider confirming with medical testing.",
            "high": f"Your wellness screening shows a higher estimated risk level ({data.get('risk_score', 0):.1%}). Factors including your BMI ({data.get('bmi', 'N/A')}) and experimental, non-diagnostic model inputs contribute to this result. Consider clinical follow-up.",
        }
        return templates.get(risk_level, "Wellness screening completed.")

    def _fallback_comprehensive_explanation(
        self, results: dict, demographics: dict
    ) -> str:
        """Fallback explanation if OpenAI fails - uses safe template."""
        risk = results["diabetes_risk_level"]
        risk_score = results["diabetes_risk_score"] * 100
        bmi = results["bmi"]
        whorl = results["pattern_counts"]["Whorl"]
        loop = results["pattern_counts"]["Loop"]
        arc = results["pattern_counts"]["Arc"]
        blood_group = results.get("predicted_blood_group", "Unknown")

        if "High" in risk:
            return f"""What this result means
Your wellness screening shows a higher estimated risk for diabetes ({risk_score:.1f}%). This means the information you provided matches patterns that are sometimes seen in people who benefit from further health checks.

What this result does NOT mean
This is not a diagnosis. It does not mean you have diabetes or will develop it. Only medical tests, such as blood sugar or HbA1c tests, can confirm that.

What influenced this estimate
The estimate was generated using general body measurements (BMI: {bmi}) and experimental, non-diagnostic fingerprint patterns ({whorl} Whorls, {loop} Loops, {arc} Arcs). The experimental blood group prediction was {blood_group}. These patterns are not medically proven predictors.

What you can do next
• Consider scheduling a check-up with a healthcare professional
• Ask about a fasting blood sugar or HbA1c test
• Maintain a balanced diet and regular physical activity
• Monitor your health and follow medical advice"""

        elif "Moderate" in risk:
            return f"""What this result means
Your wellness screening shows a moderate estimated risk for diabetes ({risk_score:.1f}%). This suggests staying aware of your metabolic health may be beneficial.

What this result does NOT mean
This is not a diagnosis or confirmation of any disease. Many people with similar results remain healthy. Only proper medical testing can assess your actual health status.

What influenced this estimate
The estimate used your body measurements (BMI: {bmi}) and experimental fingerprint pattern analysis ({whorl} Whorls, {loop} Loops, {arc} Arcs). Blood group prediction: {blood_group}. These are experimental inputs, not diagnostic tools.

What you can do next
• Consider a routine health check-up within 6 months
• Focus on maintaining a healthy weight
• Stay physically active with regular exercise
• Eat a balanced diet with plenty of vegetables"""

        else:
            return f"""What this result means
Your wellness screening shows a lower estimated risk for diabetes ({risk_score:.1f}%). The information you provided suggests a favorable profile at this time.

What this result does NOT mean
This is not a guarantee of health or immunity from diabetes. Screening results can change, and lifestyle factors remain important regardless of this estimate.

What influenced this estimate
The estimate was based on your body measurements (BMI: {bmi}) and experimental fingerprint patterns ({whorl} Whorls, {loop} Loops, {arc} Arcs). Blood group prediction: {blood_group}. These are non-diagnostic model inputs.

What you can do next
• Continue maintaining healthy lifestyle habits
• Schedule routine check-ups every 1-2 years
• Stay physically active and eat well
• Monitor any changes in your health"""

    def generate_doctor_explanation(self, structured_response: dict, session_id: str = None) -> str:
        """Generate a compassionate wellness screening explanation.
        
        Args:
            structured_response: Full response dict containing all prediction data
            session_id: Optional session ID for caching (not used in OpenAI service currently)
        
        Returns:
            Safe wellness screening explanation
        """
        if not self.client:
            return self._fallback_doctor_explanation(structured_response)
        
        # Extract data from structured response
        input_data = structured_response.get("input", {})
        predictions = structured_response.get("predictions", {})
        risk_assessment = structured_response.get("risk_assessment", {})
        clinical_interpretation = structured_response.get("clinical_interpretation", {})
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

        system_prompt = """You generate patient-facing WELLNESS SCREENING summaries.

STRICT SAFETY RULES (must follow):
- This is NOT a medical diagnosis.
- Do NOT claim clinical validation or proven medical science.
- Do NOT cite studies, journals, researchers, or statistics.
- Do NOT imply fingerprints or AI can diagnose disease.
- Describe fingerprints only as experimental, non-diagnostic model inputs.
- If height, weight, or BMI appear unusual, warn that results may be inaccurate.

TONE & STYLE:
- Calm, reassuring, supportive
- Clear, plain language
- Empowering, not alarming
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=800,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI doctor explanation generation failed: {e}")
            return self._fallback_doctor_explanation(structured_response)

    def _fallback_doctor_explanation(self, structured_response: dict) -> str:
        """Template-based fallback if OpenAI fails."""
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

_openai_service = None


def get_openai_service() -> OpenAIService:
    global _openai_service  # noqa: PLW0603
    if _openai_service is None:
        _openai_service = OpenAIService()
    return _openai_service
