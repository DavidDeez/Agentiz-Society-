import React from 'react';
import { marked } from 'marked';

const parseMarkdown = (text) => {
  if (!text) return { __html: '' };
  let cleaned = text
    .replace(/✅/g, '<i class="fi fi-rr-check-circle" style="color:#34d399; margin-right:5px;"></i>')
    .replace(/❌/g, '<i class="fi fi-rr-cross-circle" style="color:#f87171; margin-right:5px;"></i>')
    .replace(/🔍/g, '<i class="fi fi-rr-search" style="color:#60a5fa; margin-right:5px;"></i>')
    .replace(/📌/g, '<i class="fi fi-rr-thumbtack" style="color:#fbbf24; margin-right:5px;"></i>')
    .replace(/⚠️/g, '<i class="fi fi-rr-triangle-warning" style="color:#fbbf24; margin-right:5px;"></i>');
  return { __html: marked.parse(cleaned) };
};

const AgentSocietyView = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '60px 0', fontSize: '1.2em' }}>
        No activity yet. Enter a pitch and start the simulation.
      </div>
    );
  }

  return (
    <div className="society-view">
      {events.map((ev, index) => {
        if (ev.event === 'memory_retrieved') {
          return (
            <div key={index} className="message-item agent-node agent-Lead" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <h3 style={{ color: '#a78bfa' }}><i className="fi fi-rr-briefcase"></i> Lead Investor (Querying Memory)</h3>
              <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>Recalling past investments from Vector Database...</p>
              <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }} dangerouslySetInnerHTML={parseMarkdown(ev.content)} />
            </div>
          );
        }

        if (ev.event === 'tool_call') {
          const agentClass = ev.agent.split(' ')[0];
          const icons = { Tech: 'fi-rr-computer', Finance: 'fi-rr-chart-line-up', Risk: 'fi-rr-shield-exclamation' };
          let formattedArgs = ev.args;
          try {
            const parsed = JSON.parse(ev.args);
            if (parsed.query) formattedArgs = `Searching for: "${parsed.query}"`;
          } catch(e) {}
          
          return (
            <div key={index} className={`message-item agent-node agent-${agentClass}`} style={{ opacity: 0.85, padding: '10px 20px' }}>
              <h3 style={{ fontSize: '1.0em', color: 'rgba(255,255,255,0.7)', marginBottom: '5px' }}>
                <i className={`fi ${icons[agentClass] || 'fi-rr-robot'}`}></i> {ev.agent} (Action)
              </h3>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', color: '#60a5fa', fontSize: '0.85em', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fi fi-rr-search"></i> {formattedArgs}
              </div>
            </div>
          );
        }

        if (ev.event === 'task_delegation') {
          return (
            <div key={index} className="message-item agent-node agent-Lead">
              <h3 style={{ color: '#a78bfa' }}><i className="fi fi-rr-briefcase"></i> Lead Investor</h3>
              <p style={{ lineHeight: '1.6' }}>Delegating tasks to the committee: <strong>{ev.tasks.join(', ')}</strong></p>
            </div>
          );
        }

        if (ev.event === 'agent_report') {
          const agentClass = ev.agent.split(' ')[0];
          const colors = { Tech: '#60a5fa', Finance: '#34d399', Risk: '#f87171' };
          const icons = { Tech: 'fi-rr-computer', Finance: 'fi-rr-chart-line-up', Risk: 'fi-rr-shield-exclamation' };
          return (
            <div key={index} className={`message-item agent-node agent-${agentClass}`}>
              <h3 style={{ color: colors[agentClass] }}><i className={`fi ${icons[agentClass] || 'fi-rr-robot'}`}></i> {ev.agent}</h3>
              <div style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap', lineHeight: '1.5' }} dangerouslySetInnerHTML={parseMarkdown(ev.content)} />
            </div>
          );
        }

        if (ev.event === 'conflict_detected') {
          return (
            <div key={index} className="message-item agent-node agent-Lead" style={{ borderLeftColor: '#fbbf24', background: 'rgba(251, 191, 36, 0.05)' }}>
              <h3 style={{ color: '#fbbf24' }}><i className="fi fi-rr-comments"></i> Lead Investor (Debate Initiated)</h3>
              <div style={{ fontSize: '0.85em', whiteSpace: 'pre-wrap', lineHeight: '1.5' }} dangerouslySetInnerHTML={parseMarkdown(ev.content)} />
            </div>
          );
        }

        if (ev.event === 'final_decision') {
          return (
            <div key={index} className="message-item agent-node agent-Lead" style={{ borderLeftColor: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <h3 style={{ color: '#34d399' }}><i className="fi fi-rr-check-circle"></i> Final Investment Decision</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.9em' }} dangerouslySetInnerHTML={parseMarkdown(ev.content)} />
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '0.9em', color: '#6ee7b7' }}><i className="fi fi-rr-cloud-upload-alt"></i> Alibaba OSS Upload: {ev.oss_upload}</p>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default AgentSocietyView;
