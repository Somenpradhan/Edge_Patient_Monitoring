import pandas as pd

# Load datasets
data1 = pd.read_csv("C:/Users/SOMEN/OneDrive/Desktop/Edge Patient Monitoring/dataset/heart_disease.csv")
data2 = pd.read_csv("C:/Users/SOMEN/OneDrive/Desktop/Edge Patient Monitoring/dataset/icu_dataset.csv")
data3 = pd.read_csv("C:/Users/SOMEN/OneDrive/Desktop/Edge Patient Monitoring/dataset/vital_signs.csv")

print(data1.head())
print(data2.head())
print(data3.head())