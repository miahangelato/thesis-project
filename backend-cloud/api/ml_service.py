"""ML Service for Diabetes Risk and Blood Group Prediction."""

import logging
import pickle
from pathlib import Path
from typing import Dict, List

import numpy as np
from scipy.stats import entropy

logger = logging.getLogger(__name__)

# Lazy imports for ML libraries
_tf = None
_cv2 = None


def get_tensorflow():
    global _tf  # noqa: PLW0603
    if _tf is None:
        import tensorflow as tf  # noqa: PLC0415

        _tf = tf
    return _tf


def get_cv2():
    global _cv2  # noqa: PLW0603
    if _cv2 is None:
        import cv2  # noqa: PLC0415

        _cv2 = cv2
    return _cv2


class MLService:
    """Singleton service for ML model inference."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.models_path = Path(__file__).parent.parent.parent / "shared-models"
        self.support_cache_path = self.models_path / "blood_support_embeddings.npz"

        # Diabetes models (v3 - preprocessing embedded)
        self.diabetes_model = None
        self.pattern_cnn = None

        # Blood group models
        self.blood_embedding_model = None
        self.support_embeddings = []
        self.support_labels = []
        self.support_initialized = False
        self.support_available = False

        self._initialized = True
        logger.info("MLService initialized (models not loaded yet)")

    def _ensure_file(self, filename: str) -> Path:
        """Ensure file exists locally, downloading from remote if needed."""
        target_path = self.models_path / filename
        
        # If it exists and has size > 0, return it
        if target_path.exists() and target_path.stat().st_size > 0:
            return target_path

        # If not, try to download
        import os
        import requests
        
        model_storage_url = os.getenv("MODEL_STORAGE_URL")
        # Ensure directory exists
        self.models_path.mkdir(parents=True, exist_ok=True)

        if not model_storage_url:
            if not target_path.exists():
                logger.warning(f"File {filename} missing and MODEL_STORAGE_URL not set")
            return target_path

        logger.info(f"Downloading {filename} from remote storage...")
        try:
            # Handle potential trailing slash
            base_url = model_storage_url.rstrip("/")
            url = f"{base_url}/{filename}"
            
            response = requests.get(url, stream=True, timeout=60)
            if response.status_code == 200:
                with open(target_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                logger.info(f"✓ Downloaded {filename}")
            else:
                logger.error(f"Failed to download {filename}: {response.status_code}")
        except Exception as e:
            logger.error(f"Download failed for {filename}: {e}")
            
        return target_path

    def load_models(self):
        """Load all ML models into memory."""
        logger.info("Loading ML models...")

        try:
            # Load diabetes prediction model (v3 - preprocessing embedded)
            logger.info(f"Loading diabetes model from {self.models_path}")
            
            model_path = self._ensure_file("final_model_v3.pkl")

            with open(model_path, "rb") as f:
                self.diabetes_model = pickle.load(f)

            logger.info("✓ Diabetes model loaded (final_model_v3.pkl)")

            # Load pattern recognition CNN
            logger.info("Loading Pattern CNN...")
            tf = get_tensorflow()
            keras = tf.keras

            pattern_cnn_path = str(
                self._ensure_file("pattern_cnn_corrected.h5")
            )
            logger.info(f"Pattern CNN path: {pattern_cnn_path}")

            self.pattern_cnn = self._load_pattern_cnn_model(keras, pattern_cnn_path)
            logger.info("✓ Pattern CNN loaded")

            # Load blood group embedding model
            # Build architecture fresh, then load weights (avoids serialization issues)
            logger.info("Loading Blood Group model...")
            blood_model_path = str(self._ensure_file("blood_type_triplet_embedding.h5"))
            logger.info(f"Blood Group model path: {blood_model_path}")
            tf = get_tensorflow()
            keras = tf.keras

            # Build embedding model architecture (128x128 RGB input, 64-dim output)
            inputs = keras.layers.Input(shape=(128, 128, 3))
            x = keras.layers.Conv2D(32, (3, 3), activation="relu")(inputs)
            x = keras.layers.MaxPooling2D((2, 2))(x)
            x = keras.layers.BatchNormalization()(x)
            x = keras.layers.Conv2D(64, (3, 3), activation="relu")(x)
            x = keras.layers.MaxPooling2D((2, 2))(x)
            x = keras.layers.BatchNormalization()(x)
            x = keras.layers.Conv2D(128, (3, 3), activation="relu")(x)
            x = keras.layers.MaxPooling2D((2, 2))(x)
            x = keras.layers.BatchNormalization()(x)
            x = keras.layers.GlobalAveragePooling2D()(x)
            x = keras.layers.Dense(128, activation="relu")(x)
            x = keras.layers.Dense(64)(x)
            x = keras.layers.Lambda(lambda v: tf.math.l2_normalize(v, axis=1))(x)

            self.blood_embedding_model = keras.Model(inputs, x)
            self.blood_embedding_model.load_weights(blood_model_path)
            logger.info("✓ Blood group embedding model loaded")

            # Reset support set before initializing
            self.support_embeddings = []
            self.support_labels = []
            self.support_initialized = False
            self._initialize_support_set()

            logger.info("All models loaded successfully!")

        except Exception as e:
            logger.error(f"Error loading models: {e}", exc_info=True)
            raise

    def ensure_models_loaded(self):
        """Load models if any required component missing."""
        dataset_path = self.models_path / "dataset" / "train"
        support_required = dataset_path.exists()
        support_ready = True
        if support_required:
            support_ready = self.support_available and len(self.support_embeddings) > 0

        needs_reload = any(
            [
                self.diabetes_model is None,
                self.pattern_cnn is None,
                self.blood_embedding_model is None,
                not support_ready,
            ]
        )

        if needs_reload:
            logger.info("Model components missing; reloading ML artifacts...")
            self.load_models()

    @staticmethod
    def _load_pattern_cnn_model(keras, model_path: str):
        """Load Pattern CNN with compatibility handling for legacy configs."""

        tf = get_tensorflow()

        class InputLayerCompat(keras.layers.InputLayer):
            def __init__(self, *args, batch_shape=None, **kwargs):
                if batch_shape is not None and "batch_input_shape" not in kwargs:
                    kwargs["batch_input_shape"] = batch_shape
                super().__init__(*args, **kwargs)

        custom_objects = {"InputLayer": InputLayerCompat}

        policy_cls = getattr(tf.keras.mixed_precision, "Policy", None)
        if policy_cls is not None:
            custom_objects["DTypePolicy"] = policy_cls

        return keras.models.load_model(
            model_path,
            compile=False,
            safe_mode=False,
            custom_objects=custom_objects,
        )

    def _initialize_support_set(self):  # noqa: PLR0915
        """Pre-compute embeddings for the support set (with disk cache)."""
        logger.info("Initializing support set embeddings...")

        # Ensure we have the cache file (download if needed)
        self._ensure_file("blood_support_embeddings.npz")

        # Try fast-path cache load first to avoid recomputing on every boot
        if self.support_cache_path.exists():
            try:
                cache = np.load(self.support_cache_path)
                embeddings = cache["embeddings"]
                labels = cache["labels"].tolist()
                if embeddings.size and labels:
                    self.support_embeddings = embeddings
                    self.support_labels = labels
                    self.support_initialized = True
                    self.support_available = True
                    logger.info(
                        "✓ Loaded support set from cache (%d samples)",
                        embeddings.shape[0],
                    )
                    return
                logger.warning(
                    "Support cache at %s was empty; rebuilding from dataset",
                    self.support_cache_path,
                )
            except Exception as cache_err:
                logger.warning(
                    "Failed to load support cache at %s: %s",
                    self.support_cache_path,
                    cache_err,
                )

        dataset_path = self.models_path / "dataset" / "train"

        if not dataset_path.exists():
            logger.warning(f"Support set not found at {dataset_path}")
            self.support_available = False
            self.support_initialized = False
            return

        cv2 = get_cv2()

        embeddings: List[np.ndarray] = []
        labels: List[str] = []

        # Process each blood group folder
        for blood_type in ["A", "AB", "B", "O"]:
            folder = dataset_path / blood_type
            if not folder.exists():
                continue

            images = list(folder.glob("*.png")) + list(folder.glob("*.jpg"))

            for img_path in images:
                try:
                    # Load and preprocess image for Blood Group model (128x128, RGB)
                    img = cv2.imread(str(img_path))  # BGR
                    if img is None:
                        continue
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert to RGB
                    img = cv2.resize(img, (128, 128))
                    img = img.astype("float32") / 255.0
                    img = np.expand_dims(
                        img, axis=0
                    )  # Add batch dim -> (1, 128, 128, 3)

                    # Get embedding
                    embedding = self.blood_embedding_model.predict(img, verbose=0)[0]

                    embeddings.append(embedding)
                    labels.append(blood_type)

                except Exception as e:
                    logger.warning(f"Failed to process {img_path}: {e}")

        if embeddings:
            self.support_embeddings = np.array(embeddings, dtype=np.float32)
            self.support_labels = labels
            self.support_initialized = True
            self.support_available = True
            logger.info(
                "✓ Support set initialized with %d samples",
                self.support_embeddings.shape[0],
            )

            try:
                np.savez(
                    self.support_cache_path,
                    embeddings=self.support_embeddings,
                    labels=np.array(self.support_labels),
                )
                logger.info(
                    "💾 Cached support embeddings to %s",
                    self.support_cache_path,
                )
            except Exception as save_err:
                logger.warning(
                    "Failed to cache support embeddings to %s: %s",
                    self.support_cache_path,
                    save_err,
                )
        else:
            logger.warning(
                "Support set directory was present but no embeddings were created"
            )
            self.support_initialized = False
            self.support_available = False

    def predict_pattern(self, image_array: np.ndarray) -> str:
        """Predict fingerprint pattern (Arc/Whorl/Loop) - returns class name."""
        probs = self.predict_pattern_probabilities(image_array)
        patterns = ["Arc", "Loop", "Whorl"]
        return patterns[np.argmax(probs)]

    def predict_pattern_probabilities(self, image_array: np.ndarray) -> np.ndarray:
        """Extract fingerprint pattern probabilities using CNN with entropy gating.
        
        Returns:
            Array of 3 probabilities [arc_prob, loop_prob, whorl_prob]
            If entropy > 0.8 (uncertain/noisy input), returns uniform [1/3, 1/3, 1/3]
        """
        if self.pattern_cnn is None:
            raise RuntimeError("Pattern CNN not loaded")

        # Preprocess image for Pattern CNN (128x128, Grayscale)
        img = np.array(image_array)
        cv2 = get_cv2()

        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        img = cv2.resize(img, (128, 128))
        img = img.astype("float32") / 255.0
        img = np.expand_dims(img, axis=-1)  # Add channel dim -> (128, 128, 1)
        img = np.expand_dims(img, axis=0)  # Add batch dim -> (1, 128, 128, 1)

        # Predict
        predictions = self.pattern_cnn.predict(img, verbose=0)[0]
        
        # Entropy gating: If model is uncertain, use uniform distribution
        # Real fingerprints typically have entropy < 0.6
        # Noise/invalid images have entropy > 0.8
        ENTROPY_THRESHOLD = 0.8
        pattern_entropy = entropy(predictions)
        
        if pattern_entropy > ENTROPY_THRESHOLD:
            logger.warning(f"High entropy ({pattern_entropy:.2f}) - using uniform distribution")
            return np.array([1/3, 1/3, 1/3])
        
        return predictions

    def predict_diabetes_risk(
        self,
        age: int,
        weight_kg: float,
        height_cm: float,
        gender: str,
        fingerprint_images: List[np.ndarray],
    ) -> Dict:
        """Predict diabetes risk from demographics and fingerprints.
        
        Uses final_model_v3.pkl which expects features:
        [weight_kg, height_cm, gender_encoded, bmi, arc_prob, loop_prob, whorl_prob]
        """
        if self.diabetes_model is None:
            raise RuntimeError("Diabetes model not loaded")

        # Get pattern probabilities (averaged across all fingerprint images)
        all_probs = []
        pattern_counts = {"Arc": 0, "Whorl": 0, "Loop": 0}  # Keep for backward compat
        
        for img in fingerprint_images:
            probs = self.predict_pattern_probabilities(img)
            all_probs.append(probs)
            # Also count for legacy compatibility
            pattern_name = ["Arc", "Loop", "Whorl"][np.argmax(probs)]
            pattern_counts[pattern_name] += 1
        
        # Average probabilities across all fingerprints
        avg_probs = np.mean(all_probs, axis=0)  # [arc_prob, loop_prob, whorl_prob]
        arc_prob, loop_prob, whorl_prob = avg_probs

        # Calculate BMI
        height_m = height_cm / 100
        bmi = round(weight_kg / (height_m**2), 2)
        
        # Encode gender (0=female, 1=male)
        gender_encoded = 1 if gender.lower() in ["male", "m"] else 0

        # Prepare features in order expected by final_model_v3.pkl:
        # [weight_kg, height_cm, gender_encoded, bmi, arc_prob, loop_prob, whorl_prob]
        feature_array = np.array(
            [
                [
                    weight_kg,
                    height_cm,
                    gender_encoded,
                    bmi,
                    arc_prob,
                    loop_prob,
                    whorl_prob,
                ]
            ]
        )

        # Predict (preprocessing is embedded in final_model_v3.pkl)
        prediction = self.diabetes_model.predict_proba(feature_array)[0]
        diabetes_probability = float(prediction[1])  # Probability of diabetic class

        # Interpret risk using tri-level thresholds
        # < 0.35 = Low Risk, 0.35-0.65 = Moderate Risk, > 0.65 = High Risk
        if diabetes_probability > 0.65:
            risk_level = "High Risk"
            urgency = "Immediate"
            recommendation = "Schedule a screening within 1 month."
        elif diabetes_probability >= 0.35:
            risk_level = "Moderate Risk"
            urgency = "Enhanced"
            recommendation = "Schedule a screening within 6 months."
        else:
            risk_level = "Low Risk"
            urgency = "Routine"
            recommendation = "Routine check-up within 24 months."
        
        # Binary classification (>= 0.50 = At Risk)
        binary_classification = "At Risk" if diabetes_probability >= 0.50 else "Not At Risk"
        
        # Determine dominant pattern
        pattern_names = ["Arc", "Loop", "Whorl"]
        dominant_pattern = pattern_names[np.argmax(avg_probs)]

        return {
            "diabetes_probability": diabetes_probability,
            "diabetes_probability_percent": f"{diabetes_probability * 100:.1f}%",
            "risk_level": risk_level,
            "urgency": urgency,
            "recommendation": recommendation,
            "binary_classification": binary_classification,
            "risk_score": round(diabetes_probability * 100, 1),  # 0-100 scale
            "confidence": float(max(prediction)),
            "pattern_counts": pattern_counts,  # Legacy compatibility
            "pattern_probabilities": {
                "arc_probability": round(float(arc_prob), 4),
                "loop_probability": round(float(loop_prob), 4),
                "whorl_probability": round(float(whorl_prob), 4),
                "dominant_pattern": dominant_pattern,
            },
            "bmi": bmi,
        }

    def predict_blood_group(self, fingerprint_images: List[np.ndarray]) -> Dict:
        """Predict blood group from fingerprints using support set."""
        if self.blood_embedding_model is None:
            raise RuntimeError("Blood group model not loaded")

        support_count = (
            len(self.support_embeddings) if self.support_embeddings is not None else 0
        )

        if not self.support_available or support_count == 0:
            logger.warning(
                "Support set unavailable; returning default blood group 'Unknown'"
            )
            return {"blood_group": "Unknown", "confidence": 0.0, "distance": None}

        cv2 = get_cv2()

        # Get embeddings for all input images
        embeddings = []
        for img in fingerprint_images:
            # Preprocess for Blood Group Model (128x128, RGB)
            # Assuming input is BGR or RGB? workflow_api receives bytes and decodes with cv2.imdecode
            # cv2.imdecode returns BGR

            img_processed = img.copy()
            if len(img_processed.shape) == 2:  # Grayscale -> RGB
                img_processed = cv2.cvtColor(img_processed, cv2.COLOR_GRAY2RGB)
            elif len(img_processed.shape) == 3:  # BGR -> RGB
                img_processed = cv2.cvtColor(img_processed, cv2.COLOR_BGR2RGB)

            img_processed = cv2.resize(img_processed, (128, 128))
            img_processed = img_processed.astype("float32") / 255.0
            img_processed = np.expand_dims(img_processed, axis=0)  # (1, 128, 128, 3)

            # Get embedding
            embedding = self.blood_embedding_model.predict(img_processed, verbose=0)[0]
            embeddings.append(embedding)

        # Average embeddings (per-patient aggregation)
        avg_embedding = np.mean(embeddings, axis=0)

        # Ensure support embeddings are numpy array for vectorized distance calc
        support_embeddings = self.support_embeddings
        if isinstance(support_embeddings, list):
            support_embeddings = np.array(support_embeddings, dtype=np.float32)

        # Find nearest neighbor in support set
        distances = np.linalg.norm(support_embeddings - avg_embedding, axis=1)

        # Get closest match
        closest_idx = int(np.argmin(distances))
        predicted_blood_group = self.support_labels[closest_idx]

        # Calculate confidence (inverse of distance, normalized)
        min_distance = float(distances[closest_idx])
        confidence = 1.0 / (1.0 + min_distance)

        return {
            "blood_group": predicted_blood_group,
            "confidence": float(confidence),
            "distance": float(min_distance),
        }


def generate_patient_explanation(
    risk_level: str,
    diabetes_probability: float,
    bmi: float,
    dominant_pattern: str,
    blood_group: str = "Unknown",
    pattern_probabilities: dict = None,
) -> dict:
    """Generate patient-friendly explanation using templates (no AI).
    
    Uses clinical research on dermatoglyphics:
    - Loop patterns: Associated with increased diabetes risk (2.13× in studies)
    - Whorl patterns: Associated with protective effect (2.02× protective)
    - Arc patterns: Neutral/baseline association
    
    Returns a structured explanation with:
    - what_this_means: Interpretation of results
    - pattern_interpretation: Scientific explanation of fingerprint patterns
    - what_to_do_next: Actionable recommendations
    - about_this_model: Model disclaimer
    """
    
    # BMI category
    if bmi < 18.5:
        bmi_category = "Underweight"
    elif bmi < 25:
        bmi_category = "Normal"
    elif bmi < 30:
        bmi_category = "Overweight"
    else:
        bmi_category = "Obese"
    
    # Pattern-specific interpretations based on dermatoglyphic research
    pattern_explanations = {
        "Loop": {
            "description": "Loop patterns are the most common fingerprint type, found in about 60-65% of the population.",
            "clinical_context": (
                "Research in dermatoglyphics has observed that loop-dominant patterns appear more frequently "
                "in populations with Type 2 Diabetes. This is a statistical correlation observed at the population level."
            ),
            "reassurance": (
                "Having loop patterns does not cause diabetes — it is simply one of many biological markers "
                "that may reflect early developmental influences. Many people with loop patterns never develop diabetes."
            ),
        },
        "Whorl": {
            "description": "Whorl patterns are characterized by circular ridge formations, found in about 25-35% of the population.",
            "clinical_context": (
                "Studies suggest that whorl-dominant patterns may have a protective association against diabetes risk. "
                "This pattern is considered a favorable biological marker in screening models."
            ),
            "reassurance": (
                "Your whorl-dominant pattern is associated with lower diabetes risk in population studies. "
                "This is an encouraging finding, though it's just one factor in your overall health profile."
            ),
        },
        "Arc": {
            "description": "Arc patterns are the least common fingerprint type, found in about 5% of the population.",
            "clinical_context": (
                "Arc patterns show a neutral or baseline association with diabetes risk in most studies. "
                "They are neither strongly protective nor a risk factor."
            ),
            "reassurance": (
                "Your arc-dominant pattern is considered neutral in diabetes risk assessment. "
                "Other factors like BMI and lifestyle play a more significant role in your overall risk."
            ),
        },
    }
    
    # Get pattern explanation (default to Loop if unknown)
    pattern_info = pattern_explanations.get(dominant_pattern, pattern_explanations["Loop"])
    
    # Determine primary risk factor based on pattern and BMI
    if dominant_pattern == "Loop" and bmi >= 25:
        primary_risk_factor = f"Loop-dominant fingerprint pattern combined with elevated BMI ({bmi})"
    elif dominant_pattern == "Loop":
        primary_risk_factor = "Loop-dominant fingerprint pattern (associated with increased risk in studies)"
    elif bmi >= 30:
        primary_risk_factor = f"Elevated BMI ({bmi}, categorized as {bmi_category})"
    elif bmi >= 25:
        primary_risk_factor = f"BMI in overweight range ({bmi})"
    else:
        primary_risk_factor = "No single dominant risk factor identified"
    
    # Templates by risk level - personalized and reassuring
    probability_percent = f"{diabetes_probability:.1%}"
    
    templates = {
        "Low Risk": {
            "what_this_means": (
                f"Great news! Your screening results indicate a low likelihood of diabetes risk factors. "
                f"Your risk score is {probability_percent}, which is well within the healthy range. "
                f"Your BMI of {bmi} is categorized as {bmi_category}, and your {dominant_pattern.lower()}-dominant "
                f"fingerprint pattern has been factored into this assessment."
            ),
            "what_to_do_next": (
                "Continue your healthy habits! Maintain regular physical activity and a balanced diet. "
                "Schedule a routine health check-up within 24 months. "
                "If you have a family history of diabetes, you may consider earlier screening."
            ),
        },
        "Moderate Risk": {
            "what_this_means": (
                f"Your screening results suggest some factors that are worth monitoring. "
                f"Your risk score is {probability_percent}, placing you in a moderate-risk category. "
                f"This doesn't mean you have diabetes — it means some combination of your BMI ({bmi}, {bmi_category}) "
                f"and fingerprint patterns suggests you may benefit from proactive health monitoring."
            ),
            "what_to_do_next": (
                "Consider scheduling a follow-up health screening within 6 months. "
                "Small lifestyle adjustments can make a big difference: regular exercise, reducing sugar intake, "
                "and maintaining a healthy weight. Consult with a healthcare provider to discuss your results."
            ),
        },
        "High Risk": {
            "what_this_means": (
                f"Your screening has identified elevated risk factors that we recommend discussing with a healthcare provider. "
                f"Your risk score is {probability_percent}. This is based on a combination of factors including "
                f"your BMI ({bmi}, {bmi_category}) and fingerprint pattern analysis. "
                f"Remember: this is a screening tool, not a diagnosis. Many people with similar scores "
                f"do not have diabetes, and early awareness allows for proactive prevention."
            ),
            "what_to_do_next": (
                "We strongly recommend consulting with a healthcare provider within 1 month. "
                "They may suggest a fasting blood glucose test or HbA1c test for clinical confirmation. "
                "In the meantime, consider reducing sugar and refined carbohydrates, increasing physical activity, "
                "and monitoring your weight. Early intervention can significantly reduce actual diabetes risk."
            ),
        },
    }
    
    # Get template for risk level (default to Low Risk if unknown)
    template = templates.get(risk_level, templates["Low Risk"])
    
    # Confidence based on probability distance from decision boundaries
    if diabetes_probability < 0.25 or diabetes_probability > 0.85:
        confidence = "High"
    elif diabetes_probability < 0.40 or diabetes_probability > 0.70:
        confidence = "Medium"
    else:
        confidence = "Low"
    
    return {
        "what_this_means": template["what_this_means"],
        "pattern_interpretation": {
            "dominant_pattern": dominant_pattern,
            "description": pattern_info["description"],
            "clinical_context": pattern_info["clinical_context"],
            "reassurance": pattern_info["reassurance"],
        },
        "what_to_do_next": template["what_to_do_next"],
        "about_this_model": (
            "This assessment uses fingerprint pattern analysis (dermatoglyphics) combined with BMI and demographic data. "
            "The model is based on research showing statistical correlations between fingerprint patterns and metabolic conditions. "
            "Fingerprint patterns do not CAUSE diabetes — they are biological markers that may reflect developmental factors. "
            "This is a SCREENING tool designed to identify individuals who may benefit from clinical evaluation. "
            "It is NOT a medical diagnosis. Always consult a licensed healthcare professional for clinical advice."
        ),
        "clinical_interpretation": {
            "primary_risk_factor": primary_risk_factor,
            "bmi_category": bmi_category,
            "confidence": confidence,
        },
        "blood_group": blood_group,
    }


# Global instance
_ml_service = None


def get_ml_service() -> MLService:
    """Get or create the global ML service instance."""
    global _ml_service  # noqa: PLW0603
    if _ml_service is None:
        _ml_service = MLService()
    return _ml_service
