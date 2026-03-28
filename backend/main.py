from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import math
import pickle
from pydantic import BaseModel
app = FastAPI(title="Edge Patient Monitoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths to the datasets
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, '..', 'dataset')

VITAL_SIGNS_PATH = os.path.join(DATASET_DIR, 'vital_signs.csv')
ICU_DATASET_PATH = os.path.join(DATASET_DIR, 'icu_dataset.csv')
HEART_DISEASE_PATH = os.path.join(DATASET_DIR, 'heart_disease.csv')
MODEL_PATH = os.path.join(BASE_DIR, '..', 'model.pkl')
MERGED_DATASET_PATH = os.path.join(BASE_DIR, '..', 'merged_dataset.csv')

class VitalSignsInput(BaseModel):
    heart_rate: float
    temperature: float
    spo2: float
    respiration_rate: float
    blood_pressure: float
    age: float

# Load data into memory (Pandas dataframes) sparingly or load selectively.
# For vital signs, since it's 7.8MB, it's safe to load into memory for a simple demo but let's cache it.
_db = {
    'vital_signs': None,
    'icu': None,
    'heart_disease': None,
    'merged': None
}

ml_model = None

def load_data():
    if _db['vital_signs'] is None and os.path.exists(VITAL_SIGNS_PATH):
        _db['vital_signs'] = pd.read_csv(VITAL_SIGNS_PATH)
    if _db['icu'] is None and os.path.exists(ICU_DATASET_PATH):
        _db['icu'] = pd.read_csv(ICU_DATASET_PATH)
    if _db['heart_disease'] is None and os.path.exists(HEART_DISEASE_PATH):
        _db['heart_disease'] = pd.read_csv(HEART_DISEASE_PATH)
    if _db['merged'] is None and os.path.exists(MERGED_DATASET_PATH):
        _db['merged'] = pd.read_csv(MERGED_DATASET_PATH)
    
    global ml_model
    if os.path.exists(MODEL_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                ml_model = pickle.load(f)
        except Exception as e:
            print(f"Error loading model: {e}")
            ml_model = None
    else:
        ml_model = None

@app.on_event("startup")
async def startup_event():
    load_data()
    print("Data and model loaded successfully.")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Edge Patient Monitoring API is running."}

@app.get("/api/vitals")
def get_vitals(page: int = 1, page_size: int = 100):
    df = _db['vital_signs']
    if df is None:
        raise HTTPException(status_code=404, detail="Vital signs data not found")
    
    # We send only a slice of the data so we don't overwhelm the browser
    # Replace NaN with None so FastAPI can serialize to JSON null
    df_clean = df.replace({float('nan'): None})
    total = len(df_clean)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    data = df_clean.iloc[start_idx:end_idx].to_dict(orient="records")
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": math.ceil(total / page_size),
        "data": data
    }

@app.get("/api/icu")
def get_icu(page: int = 1, page_size: int = 100):
    df = _db['icu']
    if df is None:
        raise HTTPException(status_code=404, detail="ICU data not found")
        
    df_clean = df.replace({float('nan'): None})
    total = len(df_clean)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    data = df_clean.iloc[start_idx:end_idx].to_dict(orient="records")
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": math.ceil(total / page_size),
        "data": data
    }

@app.get("/api/heart-disease")
def get_heart_disease(page: int = 1, page_size: int = 100):
    df = _db['heart_disease']
    if df is None:
        raise HTTPException(status_code=404, detail="Heart disease data not found")
        
    df_clean = df.replace({float('nan'): None})
    total = len(df_clean)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    data = df_clean.iloc[start_idx:end_idx].to_dict(orient="records")
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": math.ceil(total / page_size),
        "data": data
    }

@app.get("/api/telemetry")
def get_telemetry(page: int = 1, page_size: int = 100):
    df = _db['merged']
    if df is None:
        raise HTTPException(status_code=404, detail="Merged dataset not found")
        
    df_clean = df.replace({float('nan'): None})
    total = len(df_clean)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    
    data = df_clean.iloc[start_idx:end_idx].to_dict(orient="records")
    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": math.ceil(total / page_size),
        "data": data
    }

@app.get("/api/summary")
def get_summary():
    """Returns high-level summary statistics of the datasets"""
    vitals_df = _db['vital_signs']
    icu_df = _db['icu']
    hd_df = _db['heart_disease']
    
    summary = {}
    if vitals_df is not None:
        summary["vitals"] = {
            "total_records": len(vitals_df),
            "avg_heart_rate": vitals_df["heart_rate"].mean() if "heart_rate" in vitals_df else None,
            "avg_temperature_c": vitals_df["temperature_c"].mean() if "temperature_c" in vitals_df else None,
            "avg_respiratory_rate": vitals_df["respiratory_rate"].mean() if "respiratory_rate" in vitals_df else None,
        }
    if icu_df is not None:
        summary["icu"] = {
            "total_records": len(icu_df),
            "avg_bp_mean": icu_df["bp_mean"].mean() if "bp_mean" in icu_df else None,
            "avg_spo2": icu_df["spo2"].mean() if "spo2" in icu_df else None,
        }
    if hd_df is not None:
         summary["heart_disease"] = {
            "total_records": len(hd_df),
            "avg_age": hd_df["age"].mean() if "age" in hd_df else None,
            "avg_resting_blood_pressure": hd_df["resting_blood_pressure"].mean() if "resting_blood_pressure" in hd_df else None,
            "avg_heart_rate": hd_df["heart_rate"].mean() if "heart_rate" in hd_df else None,
        }
         
    # Convert numerical types to standard Python scalars so FastAPI can serialize to JSON
    # Dealing with potential NaNs
    def clean_dict(d):
        for k, v in d.items():
            if isinstance(v, dict):
                clean_dict(v)
            elif isinstance(v, float) and math.isnan(v):
                d[k] = None
        return d
        
    return clean_dict(summary)

@app.post("/api/predict")
def predict_condition(vitals: VitalSignsInput):
    """Predicts the patient's condition using the trained Random Forest model"""
    if ml_model is None:
        raise HTTPException(status_code=500, detail="Machine learning model not found or failed to load")
    
    try:
        features = [[
            vitals.respiration_rate,
            vitals.blood_pressure,
            vitals.age
        ]]
        
        prediction = ml_model.predict(features)
        condition = prediction[0]
        
        return {
            "prediction": condition,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
