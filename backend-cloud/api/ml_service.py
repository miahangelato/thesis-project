"""ML Service for Diabetes Risk and Blood Group Prediction."""
import os
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

# Lazy imports for ML libraries
_tf = None
_cv2 = None

def get_tensorflow():
    global _tf
    if _tf is None:
        import tensorflow as tf
        _tf = tf
    return _tf

def get_cv2():
    global _cv2
    if _cv2 is None:
        import cv2
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
        
        # Diabetes models
        self.diabetes_model = None
        self.diabetes_scaler = None
        self.diabetes_imputer = None
        self.pattern_cnn = None
        
        # Blood group models
        self.blood_embedding_model = None
        self.support_embeddings = []
        self.support_labels = []
        
        self._initialized = True
        logger.info("MLService initialized (models not loaded yet)")
    
    def load_models(self):
        """Load all ML models into memory."""
        logger.info("Loading ML models...")
        
        try:
            # Load diabetes prediction models
            logger.info(f"Loading diabetes models from {self.models_path}")
            with open(self.models_path / "final_no_age_model.pkl", 'rb') as f:
                self.diabetes_model = pickle.load(f)
            with open(self.models_path / "final_no_age_scaler.pkl", 'rb') as f:
                self.diabetes_scaler = pickle.load(f)
            with open(self.models_path / "final_no_age_imputer.pkl", 'rb') as f:
                self.diabetes_imputer = pickle.load(f)
            
            logger.info("✓ Diabetes models loaded")
            
            # Load pattern recognition CNN
            logger.info("Loading Pattern CNN...")
            # Use native Keras 3
            import keras
            import tensorflow as tf
            
            pattern_cnn_path = str(self.models_path / "improved_pattern_cnn_model_retrained.h5")
            logger.info(f"Pattern CNN path: {pattern_cnn_path}")
            
            self.pattern_cnn = keras.models.load_model(
                pattern_cnn_path, 
                compile=False,
                safe_mode=False
            )
            logger.info("✓ Pattern CNN loaded")
            
            # Load blood group embedding model  
            # Build architecture fresh, then load weights (avoids serialization issues)
            logger.info("Loading Blood Group model...")
            blood_model_path = str(self.models_path / "blood_type_triplet_embedding.h5")
            logger.info(f"Blood Group model path: {blood_model_path}")
            
            # Build embedding model architecture (128x128 RGB input, 64-dim output)
            inputs = keras.layers.Input(shape=(128, 128, 3))
            x = keras.layers.Conv2D(32, (3, 3), activation='relu')(inputs)
            x = keras.layers.MaxPooling2D((2, 2))(x)
            x = keras.layers.BatchNormalization()(x)
            x = keras.layers.Conv2D(64, (3, 3), activation='relu')(x)
            x = keras.layers.MaxPooling2D((2, 2))(x)
            x = keras.layers.BatchNormalization()(x)
            x = keras.layers.Conv2D(128, (3, 3), activation='relu')(x)
            x = keras.layers.MaxPooling2D((2, 2))(x)
            x = keras.layers.BatchNormalization()(x)
            x = keras.layers.GlobalAveragePooling2D()(x)
            x = keras.layers.Dense(128, activation='relu')(x)
            x = keras.layers.Dense(64)(x)
            x = keras.layers.Lambda(lambda v: tf.math.l2_normalize(v, axis=1))(x)
            
            self.blood_embedding_model = keras.Model(inputs, x)
            self.blood_embedding_model.load_weights(blood_model_path)
            logger.info("✓ Blood group embedding model loaded")
            
            # Initialize support set
            self._initialize_support_set()
            
            logger.info("All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}", exc_info=True)
            raise
    
    def _initialize_support_set(self):
        """Pre-compute embeddings for the support set."""
        logger.info("Initializing support set embeddings...")
        
        dataset_path = self.models_path / "dataset" / "train"
        
        if not dataset_path.exists():
            logger.warning(f"Support set not found at {dataset_path}")
            return
        
        cv2 = get_cv2()
        
        # Process each blood group folder
        for blood_type in ['A', 'AB', 'B', 'O']:
            folder = dataset_path / blood_type
            if not folder.exists():
                continue
            
            images = list(folder.glob("*.png")) + list(folder.glob("*.jpg"))
            
            for img_path in images:
                try:
                    # Load and preprocess image for Blood Group model (128x128, RGB)
                    img = cv2.imread(str(img_path)) # BGR
                    if img is None:
                        continue
                    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # Convert to RGB
                    img = cv2.resize(img, (128, 128))
                    img = img.astype('float32') / 255.0
                    img = np.expand_dims(img, axis=0) # Add batch dim -> (1, 128, 128, 3)
                    
                    # Get embedding
                    embedding = self.blood_embedding_model.predict(img, verbose=0)[0]
                    
                    self.support_embeddings.append(embedding)
                    self.support_labels.append(blood_type)
                    
                except Exception as e:
                    logger.warning(f"Failed to process {img_path}: {e}")
        
        logger.info(f"✓ Support set initialized with {len(self.support_embeddings)} samples")
    
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
        img = img.astype('float32') / 255.0
        img = np.expand_dims(img, axis=-1) # Add channel dim -> (128, 128, 1)
        img = np.expand_dims(img, axis=0)  # Add batch dim -> (1, 128, 128, 1)
        
        # Predict
        predictions = self.pattern_cnn.predict(img, verbose=0)[0]
        pattern_idx = np.argmax(predictions)
        
        # Map to pattern name
        patterns = ['Arc', 'Loop', 'Whorl']
        return patterns[pattern_idx]

    def predict_diabetes_risk(
        self,
        age: int,
        weight_kg: float,
        height_cm: float,
        gender: str,
        fingerprint_images: List[np.ndarray]
    ) -> Dict:
        """Predict diabetes risk from demographics and fingerprints."""
        if self.diabetes_model is None:
            raise RuntimeError("Diabetes model not loaded")
        
        # Count patterns
        pattern_counts = {'Arc': 0, 'Whorl': 0, 'Loop': 0}
        
        for img in fingerprint_images:
            pattern = self.predict_pattern(img)
            pattern_counts[pattern] += 1
        
        # Calculate BMI for return value
        height_m = height_cm / 100
        bmi = round(weight_kg / (height_m ** 2), 2)
        
        # Prepare features in exact order expected by model:
        # 1. height (cm)
        # 2. pat_2 (Whorl_Count)
        # 3. pat_1 (Loop_Count)
        # 4. pat_0 (Arc_Count)
        # 5. weight (kg)
        # 6. gender_code
        feature_array = np.array([[
            height_cm,
            pattern_counts['Whorl'],
            pattern_counts['Loop'],
            pattern_counts['Arc'],
            weight_kg,
            1 if gender.lower() == 'male' else 0
        ]])
        
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
            'risk_score': risk_score,
            'risk_level': risk_level,
            'confidence': float(max(prediction)),
            'pattern_counts': pattern_counts,
            'bmi': bmi
        }

    def predict_blood_group(self, fingerprint_images: List[np.ndarray]) -> Dict:
        """Predict blood group from fingerprints using support set."""
        if self.blood_embedding_model is None:
            raise RuntimeError("Blood group model not loaded")
        
        if len(self.support_embeddings) == 0:
            raise RuntimeError("Support set not initialized")
        
        cv2 = get_cv2()
        
        # Get embeddings for all input images
        embeddings = []
        for img in fingerprint_images:
            # Preprocess for Blood Group Model (128x128, RGB)
            # Assuming input is BGR or RGB? workflow_api receives bytes and decodes with cv2.imdecode
            # cv2.imdecode returns BGR
            
            img_processed = img.copy()
            if len(img_processed.shape) == 2: # Grayscale -> RGB
                 img_processed = cv2.cvtColor(img_processed, cv2.COLOR_GRAY2RGB)
            elif len(img_processed.shape) == 3: # BGR -> RGB
                 img_processed = cv2.cvtColor(img_processed, cv2.COLOR_BGR2RGB)
                 
            img_processed = cv2.resize(img_processed, (128, 128))
            img_processed = img_processed.astype('float32') / 255.0
            img_processed = np.expand_dims(img_processed, axis=0) # (1, 128, 128, 3)
            
            # Get embedding
            embedding = self.blood_embedding_model.predict(img_processed, verbose=0)[0]
            embeddings.append(embedding)
        
        # Average embeddings (per-patient aggregation)
        avg_embedding = np.mean(embeddings, axis=0)
        
        # Find nearest neighbor in support set
        distances = []
        for support_emb in self.support_embeddings:
            dist = np.linalg.norm(avg_embedding - support_emb)
            distances.append(dist)
        
        # Get closest match
        closest_idx = np.argmin(distances)
        predicted_blood_group = self.support_labels[closest_idx]
        
        # Calculate confidence (inverse of distance, normalized)
        min_distance = distances[closest_idx]
        confidence = 1.0 / (1.0 + min_distance)
        
        return {
            'blood_group': predicted_blood_group,
            'confidence': float(confidence),
            'distance': float(min_distance)
        }


# Global instance
_ml_service = None

def get_ml_service() -> MLService:
    """Get or create the global ML service instance."""
    global _ml_service
    if _ml_service is None:
        _ml_service = MLService()
    return _ml_service
