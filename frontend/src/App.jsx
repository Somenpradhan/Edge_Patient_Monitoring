import { useState, useEffect } from 'react';
import { 
  Activity, Database, HeartPulse, 
  Thermometer, Wind, AlertTriangle, CheckCircle, AlertCircle, Droplet
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [activeTab, setActiveTab] = useState('monitor');
  
  // Data for tables
  const [dashboardData, setDashboardData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  // Active Live Monitor State (Driven PURELY by user input)
  const [vitalsInput, setVitalsInput] = useState({
    heart_rate: '72',
    temperature: '36.8',
    spo2: '98',
    respiration_rate: '16',
    blood_pressure: '120',
    age: '45'
  });
  
  // Active Displays
  const [currentVitals, setCurrentVitals] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [realtimeChartData, setRealtimeChartData] = useState([]);

  // Fetch Table Data when tab changes
  useEffect(() => {
    if (activeTab === 'vitals' || activeTab === 'icu' || activeTab === 'heart-disease') {
      fetchTableData(activeTab);
    }
  }, [activeTab]);

  // Live EKG sweep effect based on current target vitals
  useEffect(() => {
    let interval;
    if (currentVitals) {
      interval = setInterval(() => {
        setRealtimeChartData(prev => {
          const baseHr = currentVitals.hr;
          const baseSpo2 = currentVitals.spo2;
          
          // EKG style variance: occasional jump, mostly stable
          const isBeat = Math.random() > 0.8;
          const hrTick = isBeat ? baseHr + (Math.random() > 0.5 ? 8 : -8) : baseHr + (Math.random() * 2 - 1);
          const spo2Tick = baseSpo2 + (Math.random() * 0.5 - 0.25);

          const newData = [...prev, {
              tick: Date.now(),
              hr: hrTick,
              spo2: spo2Tick
          }];
          if (newData.length > 40) newData.shift();
          return newData;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [currentVitals]);

  const fetchTableData = async (endpoint) => {
    setTableLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}?page_size=100`);
      const data = await res.json();
      setDashboardData(data.data || []);
      setTableLoading(false);
    } catch (error) {
      console.error(`Failed to fetch ${endpoint} data`, error);
      setTableLoading(false);
    }
  };

  const submitTelemetry = async (e) => {
    e.preventDefault();
    setPredicting(true);
    
    const hr = parseFloat(vitalsInput.heart_rate) || 0;
    const temp = parseFloat(vitalsInput.temperature) || 0;
    const spo2 = parseFloat(vitalsInput.spo2) || 0;
    const rr = parseFloat(vitalsInput.respiration_rate) || 0;
    const bp = parseFloat(vitalsInput.blood_pressure) || 0;
    const age = parseFloat(vitalsInput.age) || 0;

    // 1. Immediately update the bedside monitor displays
    setCurrentVitals({ hr, temp, spo2, rr });

    // 2. Request Diagnosis from ML model
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heart_rate: hr,
          temperature: temp,
          spo2: spo2,
          respiration_rate: rr,
          blood_pressure: bp,
          age: age,
        })
      });
      const data = await res.json();
      setPredictionResult(data.prediction);
      setPredicting(false);
    } catch (error) {
      console.error('Prediction failed', error);
      setPredictionResult('Error');
      setPredicting(false);
    }
  };

  const handleInputChange = (e) => {
    setVitalsInput({ ...vitalsInput, [e.target.name]: e.target.value });
  };

  const renderSidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Activity size={28} className="text-primary" />
        <h2>ICU Central</h2>
      </div>
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          <Activity size={20} /> Bedside Monitor
        </button>
        <button 
          className={`nav-item ${activeTab === 'vitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('vitals')}
        >
          <Database size={20} /> Vitals Log
        </button>
        <button 
          className={`nav-item ${activeTab === 'icu' ? 'active' : ''}`}
          onClick={() => setActiveTab('icu')}
        >
          <Database size={20} /> ICU Records
        </button>
      </nav>
    </aside>
  );

  const renderBedsideMonitor = () => {
    const isCritical = predictionResult === 'Critical';

    return (
      <>
        <div className="page-header">
          <h1 className="page-title">LIVE STATION: BED 01</h1>
          <div style={{color: isCritical ? 'var(--status-critical)' : 'var(--status-normal)', fontFamily: 'var(--font-mono)', fontSize: '1.2rem'}} className={isCritical ? 'animate-critical' : ''}>
            {isCritical ? 'CRITICAL ALERT' : 'STATUS NORMAL'}
          </div>
        </div>
        
        <div className="icu-monitor-grid">
          {/* Main Monitor Display */}
          <div className="monitor-panel">
            <div className="vitals-grid">
              
              {/* HR */}
              <div className="vital-box">
                <div className="vital-label-area text-hr">
                  <span className="vital-name"><HeartPulse size={18} style={{display:'inline', marginBottom:'-3px'}}/> Heart Rate</span>
                  <span className="vital-unit">BPM</span>
                </div>
                <div className={`vital-value text-hr ${currentVitals?.hr > 100 || currentVitals?.hr < 50 ? 'animate-critical' : ''}`}>
                  {currentVitals ? Math.round(currentVitals.hr) : '--'}
                </div>
              </div>

              {/* SpO2 */}
              <div className="vital-box">
                <div className="vital-label-area text-spo2">
                  <span className="vital-name"><Wind size={18} style={{display:'inline', marginBottom:'-3px'}}/> SpO2</span>
                  <span className="vital-unit">%</span>
                </div>
                <div className={`vital-value text-spo2 ${currentVitals?.spo2 < 92 ? 'animate-critical' : ''}`}>
                  {currentVitals ? Math.round(currentVitals.spo2) : '--'}
                </div>
              </div>

              {/* Temp */}
              <div className="vital-box">
                <div className="vital-label-area text-temp">
                  <span className="vital-name"><Thermometer size={18} style={{display:'inline', marginBottom:'-3px'}}/> Temp</span>
                  <span className="vital-unit">°C</span>
                </div>
                <div className={`vital-value text-temp ${currentVitals?.temp > 38 ? 'animate-critical' : ''}`}>
                  {currentVitals ? Number(currentVitals.temp).toFixed(1) : '--'}
                </div>
              </div>

              {/* Resp */}
              <div className="vital-box">
                <div className="vital-label-area text-resp">
                  <span className="vital-name"><Droplet size={18} style={{display:'inline', marginBottom:'-3px'}}/> Resp</span>
                  <span className="vital-unit">RPM</span>
                </div>
                <div className="vital-value text-resp">
                  {currentVitals ? Math.round(currentVitals.rr) : '--'}
                </div>
              </div>
            </div>

            {/* Sweep EKG Chart Area */}
            <div className="monitor-chart-area">
              {realtimeChartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={realtimeChartData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                     <CartesianGrid strokeDasharray="2 2" stroke="#222" vertical={true} horizontal={true}/>
                     <XAxis dataKey="tick" hide={true}/>
                     <YAxis yAxisId="hr" stroke="var(--hr-color)" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false}/>
                     <YAxis yAxisId="spo2" orientation="right" stroke="var(--spo2-color)" fontSize={10} domain={[80, 100]} axisLine={false} tickLine={false}/>
                     <Line yAxisId="hr" type="monotone" dataKey="hr" stroke="var(--hr-color)" strokeWidth={2} dot={false} isAnimationActive={false}/>
                     <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="var(--spo2-color)" strokeWidth={2} dot={false} isAnimationActive={false}/>
                   </LineChart>
                 </ResponsiveContainer>
              ) : (
                <div style={{color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', padding: '2rem'}}>AWAITING SIGNAL...</div>
              )}
            </div>
            
            {/* Diagnosis Banner */}
            {predictionResult && (
              <div className={`diagnosis-banner ${['Critical', 'Abnormal', 'Fever'].includes(predictionResult) ? (predictionResult === 'Critical' ? 'Critical' : 'Warning') : 'Normal'}`}>
                {predictionResult === 'Critical' ? <AlertTriangle size={36} /> : predictionResult === 'Normal' ? <CheckCircle size={36} /> : <AlertCircle size={36} />}
                <div>
                  <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700}}>EDGE AI DIAGNOSIS</div>
                  <h3>{predictionResult}</h3>
                </div>
              </div>
            )}
          </div>

          {/* User Input / Edge Data Simulator */}
          <div className="control-panel">
            <div className="panel-title">
              <Activity size={20} className="text-primary"/> Telemetry Input
            </div>
            <form onSubmit={submitTelemetry}>
              <div className="input-grid">
                <div className="input-block">
                  <label>Heart Rate (BPM)</label>
                  <input required type="number" step="0.1" name="heart_rate" value={vitalsInput.heart_rate} onChange={handleInputChange}/>
                </div>
                <div className="input-block">
                  <label>SpO2 (%)</label>
                  <input required type="number" step="0.1" name="spo2" value={vitalsInput.spo2} onChange={handleInputChange}/>
                </div>
                <div className="input-block">
                  <label>Temperature (°C)</label>
                  <input required type="number" step="0.1" name="temperature" value={vitalsInput.temperature} onChange={handleInputChange}/>
                </div>
                <div className="input-block">
                  <label>Resp Rate (RPM)</label>
                  <input required type="number" step="0.1" name="respiration_rate" value={vitalsInput.respiration_rate} onChange={handleInputChange}/>
                </div>
                <div className="input-block">
                  <label>Blood Pressure (Sys)</label>
                  <input required type="number" step="0.1" name="blood_pressure" value={vitalsInput.blood_pressure} onChange={handleInputChange}/>
                </div>
                <div className="input-block">
                  <label>Patient Age</label>
                  <input required type="number" step="1" name="age" value={vitalsInput.age} onChange={handleInputChange}/>
                </div>
              </div>
              <button type="submit" className="btn-transmit" disabled={predicting}>
                {predicting ? 'TRANSMITTING...' : 'TRANSMIT SIGNAL'}
              </button>
            </form>
          </div>

        </div>
      </>
    );
  };

  const renderTable = () => {
    let headers = [];
    if (dashboardData.length > 0) {
      headers = Object.keys(dashboardData[0]).filter(k => k !== 'Unnamed: 0').slice(0, 7);
    }
    
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">{activeTab.replace('-', ' ')} DATA</h1>
        </div>
        <div className="data-table-wrapper">
          {tableLoading ? (
             <div className="loader-container">DB_CONNECTING...</div>
          ) : dashboardData.length > 0 ? (
             <table className="data-table">
               <thead>
                 <tr>
                   {headers.map(h => <th key={h}>{h.replace(/_/g, ' ')}</th>)}
                 </tr>
               </thead>
               <tbody>
                 {dashboardData.map((row, i) => (
                   <tr key={i}>
                     {headers.map(h => {
                        let val = row[h];
                        if (typeof val === 'number') val = val.toFixed(2);
                        return <td key={h}>{val !== null && val !== undefined ? val : '-'}</td>
                     })}
                   </tr>
                 ))}
               </tbody>
             </table>
          ) : (
             <div style={{padding: '5rem', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)'}}>NO_RECORDS_FOUND</div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="dashboard-layout">
      {renderSidebar()}
      <main className="main-content">
        {activeTab === 'monitor' && renderBedsideMonitor()}
        {(activeTab === 'vitals' || activeTab === 'icu' || activeTab === 'heart-disease') && renderTable()}
      </main>
    </div>
  );
}

export default App;
