"""ML Service for Diabetes Risk and Blood Group Prediction."""

import logging
import pickle
from pathlib import Path
from typing import Dict, List

import numpy as np

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

        # Diabetes models
        self.diabetes_model = None
        self.diabetes_scaler = None
        self.diabetes_imputer = None
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
            # Load diabetes prediction models
            logger.info(f"Loading diabetes models from {self.models_path}")
            
            model_path = self._ensure_file("final_no_age_model.pkl")
            scaler_path = self._ensure_file("final_no_age_scaler.pkl")
            imputer_path = self._ensure_file("final_no_age_imputer.pkl")

            with open(model_path, "rb") as f:
                self.diabetes_model = pickle.load(f)
            with open(scaler_path, "rb") as f:
                self.diabetes_scaler = pickle.load(f)
            with open(imputer_path, "rb") as f:
                self.diabetes_imputer = pickle.load(f)

            logger.info("✓ Diabetes models loaded")

            # Load pattern recognition CNN
            logger.info("Loading Pattern CNN...")
            tf = get_tensorflow()
            keras = tf.keras

            pattern_cnn_path = str(
                self._ensure_file("improved_pattern_cnn_model_retrained.h5")
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
                self.diabetes_scaler is None,
                self.diabetes_imputer is None,
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
        """Predict fingerprint pattern (Arc/Whorl/Loop)."""
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
        pattern_idx = np.argmax(predictions)

        # Map to pattern name
        patterns = ["Arc", "Loop", "Whorl"]
        return patterns[pattern_idx]

    def predict_diabetes_risk(
        self,
        age: int,
        weight_kg: float,
        height_cm: float,
        gender: str,
        fingerprint_images: List[np.ndarray],
    ) -> Dict:
        """Predict diabetes risk from demographics and fingerprints."""
        if self.diabetes_model is None:
            raise RuntimeError("Diabetes model not loaded")

        # Count patterns
        pattern_counts = {"Arc": 0, "Whorl": 0, "Loop": 0}

        for img in fingerprint_images:
            pattern = self.predict_pattern(img)
            pattern_counts[pattern] += 1

        # Calculate BMI for return value
        height_m = height_cm / 100
        bmi = round(weight_kg / (height_m**2), 2)

        # Prepare features in exact order expected by model:
        # 1. height (cm)
        # 2. pat_2 (Whorl_Count)
        # 3. pat_1 (Loop_Count)
        # 4. pat_0 (Arc_Count)
        # 5. weight (kg)
        # 6. gender_code
        feature_array = np.array(
            [
                [
                    height_cm,
                    pattern_counts["Whorl"],
                    pattern_counts["Loop"],
                    pattern_counts["Arc"],
                    weight_kg,
                    1 if gender.lower() == "male" else 0,
                ]
            ]
        )

        # Apply preprocessing
        feature_array = self.diabetes_imputer.transform(feature_array)
        feature_array = self.diabetes_scaler.transform(feature_array)

        # Predict
        prediction = self.diabetes_model.predict_proba(feature_array)[0]
        risk_score = float(prediction[1])  # Probability of diabetic class

        # Interpret risk
        if risk_score >= 0.6:
            risk_level = "High"
        elif risk_score >= 0.4:
            risk_level = "Moderate"
        else:
            risk_level = "Low"

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": float(max(prediction)),
            "pattern_counts": pattern_counts,
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


# Global instance
_ml_service = None


def get_ml_service() -> MLService:
    """Get or create the global ML service instance."""
    global _ml_service  # noqa: PLW0603
    if _ml_service is None:
        _ml_service = MLService()
    return _ml_service
