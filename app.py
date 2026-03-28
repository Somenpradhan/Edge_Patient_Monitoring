import streamlit as st
import pandas as pd
import pickle
import time

# Page configuration
st.set_page_config(
    page_title="Patient Monitoring System",
    page_icon="🩺",
    layout="wide"
)

# Load model
model = pickle.load(open("model.pkl", "rb"))

# Load dataset
data = pd.read_csv("merged_dataset.csv")

# Title
st.title("🩺 Edge-Based Real-Time Patient Monitoring System")
st.markdown("### 📊 AI-powered ICU Vital Signs Monitoring Dashboard")

st.markdown("---")

# Sidebar
st.sidebar.header("⚙️ Control Panel")

rows_to_show = st.sidebar.slider("Select number of patients",1,50,10)

st.sidebar.markdown("### ℹ️ System Info")
st.sidebar.write("AI Model: Random Forest")
st.sidebar.write("Monitoring: Vital Signs")

# Display patient data
sample_data = data.sample(rows_to_show)

# Layout columns
col1, col2, col3 = st.columns(3)

heart_rate = int(sample_data['heart_rate'].iloc[0])
temperature = float(sample_data['temperature'].iloc[0])
spo2 = int(sample_data['spo2'].iloc[0])

# Vital signs cards
with col1:
    st.metric("❤️ Heart Rate (bpm)", heart_rate)

with col2:
    st.metric("🌡️ Temperature (°C)", temperature)

with col3:
    st.metric("🫁 SpO₂ (%)", spo2)

st.markdown("---")

# Model prediction
prediction = model.predict([[heart_rate,temperature,spo2,
                             sample_data['respiration_rate'].iloc[0],
                             sample_data['blood_pressure'].iloc[0],
                             sample_data['age'].iloc[0]]])

st.subheader("🧠 AI Health Prediction")

condition = prediction[0]

# Alert messages
if condition == "Critical":
    st.error("🚨 CRITICAL CONDITION DETECTED! Immediate medical attention required.")

elif condition == "Abnormal":
    st.warning("⚠️ Abnormal Vital Signs Detected.")

elif condition == "Fever":
    st.warning("🌡️ Patient has Fever.")

else:
    st.success("✅ Patient Condition Normal.")

st.markdown("---")

# Charts
st.subheader("📈 Vital Signs Trends")

chart_data = data[['heart_rate','temperature','spo2']].head(50)

st.line_chart(chart_data)

st.markdown("---")

# Dataset preview
st.subheader("📋 Patient Records")

st.dataframe(sample_data)

st.markdown("---")

# Real-time simulation
st.subheader("⏱️ Real-Time Monitoring Simulation")

run = st.button("▶️ Start Monitoring")

if run:
    placeholder = st.empty()

    for i in range(10):

        row = data.sample(1)

        heart_rate = int(row['heart_rate'])
        temperature = float(row['temperature'])
        spo2 = int(row['spo2'])

        placeholder.metric("❤️ Heart Rate", heart_rate)

        time.sleep(1)

st.markdown("---")

st.caption("🏥 AI-Based ICU Patient Monitoring System | Streamlit Dashboard")