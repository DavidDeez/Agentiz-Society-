import React from 'react';

const AgentNetworkMap = ({ status, events }) => {
  // Determine active node based on the latest status/event
  let activeNodes = []; 

  const lastEvent = events && events.length > 0 ? events[events.length - 1] : null;

  if (!status) {
    activeNodes = [];
  } else if (status.includes('Initializing') || status.includes('Memory DB') || status.includes('delegating tasks')) {
    activeNodes = ['Lead'];
  } else if (status.includes('final decision')) {
    activeNodes = ['Lead'];
  } else if (status.includes('Complete')) {
    activeNodes = ['OSS', 'Lead'];
  } else if (lastEvent) {
    if (lastEvent.event === 'conflict_detected') {
      activeNodes = ['Lead', 'Tech', 'Finance', 'Risk'];
    } else if (lastEvent.event === 'final_decision') {
      activeNodes = ['Lead', 'OSS'];
    } else if (lastEvent.agent) {
      if (lastEvent.agent.includes('Tech')) activeNodes = ['Tech'];
      else if (lastEvent.agent.includes('Finance')) activeNodes = ['Finance'];
      else if (lastEvent.agent.includes('Risk')) activeNodes = ['Risk'];
      else if (lastEvent.agent.includes('Lead')) activeNodes = ['Lead'];
    }
  }

  const Node = ({ name, icon, id, color }) => {
    const isActive = activeNodes.includes(id);
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        opacity: isActive ? 1 : 0.4,
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.4s ease',
        background: isActive ? `${color}15` : 'transparent',
        padding: '6px 12px',
        borderRadius: '20px',
        border: `1px solid ${isActive ? color : 'transparent'}`
      }}>
        <i className={`fi ${icon}`} style={{ fontSize: '1.2em', color: isActive ? color : 'rgba(255,255,255,0.4)' }}></i>
        <span style={{ fontSize: '0.7em', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: isActive ? 'bold' : 'normal' }}>
          {name}
        </span>
      </div>
    );
  };

  return (
    <div style={{
      background: 'rgba(15, 15, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      zIndex: 40,
      width: '100%'
    }}>
      <Node name="Lead" id="Lead" icon="fi-rr-briefcase" color="#a78bfa" />
      <i className="fi fi-rr-arrow-right" style={{ color: 'rgba(255,255,255,0.2)' }}></i>
      <div style={{ display: 'flex', gap: '8px', padding: '0 10px', borderLeft: '1px dashed rgba(255,255,255,0.1)', borderRight: '1px dashed rgba(255,255,255,0.1)' }}>
        <Node name="Tech" id="Tech" icon="fi-rr-computer" color="#60a5fa" />
        <Node name="Finance" id="Finance" icon="fi-rr-chart-line-up" color="#34d399" />
        <Node name="Risk" id="Risk" icon="fi-rr-shield-exclamation" color="#f87171" />
      </div>
      <i className="fi fi-rr-arrow-right" style={{ color: 'rgba(255,255,255,0.2)' }}></i>
      <Node name="Cloud" id="OSS" icon="fi-rr-cloud-upload-alt" color="#10b981" />
    </div>
  );
};

export default AgentNetworkMap;
