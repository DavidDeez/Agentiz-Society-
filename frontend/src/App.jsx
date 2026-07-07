import { useState, useEffect } from 'react';
import AgentSocietyView from './components/AgentSocietyView';
import AgentNetworkMap from './components/AgentNetworkMap';

function App() {
  const [pitch, setPitch] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('agentiz_qwen_key') || '');
  const [aliAccessKey, setAliAccessKey] = useState(() => localStorage.getItem('agentiz_ali_access') || '');
  const [aliSecretKey, setAliSecretKey] = useState(() => localStorage.getItem('agentiz_ali_secret') || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('');
  const [showInputPanel, setShowInputPanel] = useState(true);

  const getProgressFromStatus = (st) => {
    if (!st) return 0;
    if (st.includes('Initializing')) return 10;
    if (st.includes('Memory DB')) return 20;
    if (st.includes('delegating')) return 30;
    if (st.includes('debating (Round 1)')) return 50;
    if (st.includes('debating (Round 2)')) return 75;
    if (st.includes('final decision')) return 90;
    if (st.includes('Complete')) return 100;
    return 10;
  };

  useEffect(() => {
    localStorage.setItem('agentiz_qwen_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('agentiz_ali_access', aliAccessKey);
  }, [aliAccessKey]);

  useEffect(() => {
    localStorage.setItem('agentiz_ali_secret', aliSecretKey);
  }, [aliSecretKey]);

  const generatePitch = async () => {
    if (!companyName.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/generate_pitch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': (apiKey || 'sk-dummy-key').trim()
        },
        body: JSON.stringify({ company_name: companyName }),
      });
      const data = await response.json();
      if (data.pitch) {
        setPitch(data.pitch);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Failed to generate pitch", error);
      alert("Failed to connect to backend for pitch generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExample1 = () => setPitch("Startup Name: QuantumPet\nPitch: We are building quantum-powered AI smart collars for pets. Our collar translates dog barks into human speech using a proprietary LLM running on edge TPUs. We are seeking $5M for a 10% stake. We have no revenue yet but expect $100M ARR in year 3. Competitors are basic GPS collars.");
  const loadExample2 = () => setPitch("Startup Name: SolarChain\nPitch: SolarChain is a decentralized blockchain for peer-to-energy trading. Neighbors can sell excess solar panel energy directly to each other using smart contracts. We need a $2M seed round to scale our current 500-user pilot in Texas to nationwide.");

  const startSimulation = async () => {
    setShowInputPanel(false);
    setIsSimulating(true);
    setEvents([]);
    setStatus('Initializing Autonomous Agents...');

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': (apiKey || 'sk-dummy-key').trim(),
          'X-Ali-Access-Key': aliAccessKey.trim(),
          'X-Ali-Secret-Key': aliSecretKey.trim()
        },
        body: JSON.stringify({ pitch }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.event === 'status') {
                setStatus(data.message);
              } else {
                setEvents(prev => [...prev, data]);
              }
            } catch (e) {
              console.error('Failed to parse SSE line', line);
            }
          }
        }
      }
      setStatus('Simulation Complete.');
    } catch (error) {
      console.error(error);
      setStatus('Error connecting to backend.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="container">
      <header className="header" style={{ position: 'relative' }}>
        <h1>Agentiz Society</h1>
        <p>Autonomous AI Due Diligence Powered by Qwen Cloud</p>
        
        {!showInputPanel && status && (
          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
               fontSize: '0.85em', 
               color: 'var(--accent)',
               background: 'rgba(0, 255, 204, 0.05)',
               padding: '6px 20px',
               borderRadius: '20px',
               border: '1px solid rgba(0, 255, 204, 0.2)',
               display: 'flex',
               alignItems: 'center',
               gap: '10px',
               boxShadow: 'var(--accent-glow)'
            }}>
              {isSimulating && <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>}
              {status}
            </div>
          </div>
        )}
      </header>

      <div className="layout-grid" style={{ gridTemplateColumns: '1fr' }}>
        {showInputPanel ? (
          <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>Startup Pitch</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
             <button className="btn" style={{ padding: '8px 12px', fontSize: '0.8em' }} onClick={loadExample1}>🐶 AI Pets</button>
             <button className="btn" style={{ padding: '8px 12px', fontSize: '0.8em' }} onClick={loadExample2}>🌞 SolarChain</button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              type="text"
              className="textarea-input"
              style={{ minHeight: 'auto', padding: '10px', fontSize: '0.9em', flex: 1 }}
              placeholder="Type a company name (e.g. AstroBurger)..."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isGenerating || isSimulating}
            />
            <button 
              className="btn btn-primary" 
              style={{ padding: '10px 15px', fontSize: '0.9em', whiteSpace: 'nowrap' }}
              onClick={generatePitch} 
              disabled={isGenerating || isSimulating || !companyName.trim()}
            >
              {isGenerating ? 'Generating...' : pitch.trim() ? 'Refix / Regenerate' : 'Generate Pitch'}
            </button>
          </div>
          
          <textarea
            className="textarea-input"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            disabled={isSimulating}
            placeholder="Type or paste a startup pitch here... Or use the generator above!"
            style={{ flex: 1, minHeight: '150px', fontSize: '0.9em', padding: '15px' }}
          />
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '15px', marginBottom: '25px', padding: '12px', fontSize: '1em' }}
            onClick={startSimulation} 
            disabled={isSimulating || !pitch.trim()}
          >
            {isSimulating ? 'Agents are analyzing...' : 'Start Due Diligence'}
          </button>

          {/* Configuration Section */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            <h2 style={{ fontSize: '1.0em', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>Configuration</h2>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', color: 'rgba(255,255,255,0.5)', fontSize: '0.7em' }}>
                Qwen API Key
              </label>
              <input 
                type="password"
                className="textarea-input"
                style={{ minHeight: 'auto', padding: '6px', fontSize: '0.75em' }}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '3px', color: 'rgba(255,255,255,0.5)', fontSize: '0.7em' }}>
                  OSS AccessKey
                </label>
                <input 
                  type="text"
                  className="textarea-input"
                  style={{ minHeight: 'auto', padding: '6px', fontSize: '0.75em' }}
                  placeholder="LTAI5t..."
                  value={aliAccessKey}
                  onChange={(e) => setAliAccessKey(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '3px', color: 'rgba(255,255,255,0.5)', fontSize: '0.7em' }}>
                  OSS SecretKey
                </label>
                <input 
                  type="password"
                  className="textarea-input"
                  style={{ minHeight: 'auto', padding: '6px', fontSize: '0.75em' }}
                  placeholder="secret..."
                  value={aliSecretKey}
                  onChange={(e) => setAliSecretKey(e.target.value)}
                />
              </div>
            </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ position: 'relative', padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {status && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '4px',
              background: 'rgba(255,255,255,0.05)',
              zIndex: 50,
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${getProgressFromStatus(status)}%`,
                background: 'var(--accent)',
                boxShadow: 'var(--accent-glow)',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
          )}
          {!showInputPanel && (
            <button 
              className="btn" 
              style={{ position: 'absolute', top: '15px', left: '20px', zIndex: 50, padding: '6px 12px', fontSize: '0.85em', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => {
                setShowInputPanel(true);
                setEvents([]);
                setStatus('');
              }}
            >
              <i className="fi fi-rr-arrow-left"></i> Back to Pitch
            </button>
          )}
          {status && <AgentNetworkMap status={status} events={events} />}
          
          <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
            <AgentSocietyView events={events} />
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
