import React, { useState, useEffect } from 'react';

function App() {
  const [candidates, setCandidates] = useState([]);
  const [candidateName, setCandidateName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null); // For Detail Modal

  const fetchCandidates = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/candidates');
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleClearPipeline = async () => {
    if (!window.confirm("Are you sure you want to clear all candidate records?")) return;
    try {
      const res = await fetch('http://localhost:5000/api/candidates', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setCandidates([]);
    } catch (err) {
      console.error("Error clearing pipeline:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!candidateName || !jobRole || !resumeFile) {
      setErrorMessage("Please fill in the candidate name, target role, and upload a resume.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('candidateName', candidateName);
    formData.append('jobRole', jobRole);
    formData.append('jobDescriptionText', jobDescriptionText);
    if (jdFile) formData.append('jdFile', jdFile);
    if (resumeFile) formData.append('resumeFile', resumeFile);

    try {
      const res = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setCandidates([data.data, ...candidates]);
        setCandidateName('');
        setJobRole('');
        setJobDescriptionText('');
        setJdFile(null);
        setResumeFile(null);
        e.target.reset();
      } else {
        setErrorMessage(data.error || "An error occurred during evaluation.");
      }
    } catch (err) {
      console.error("Error:", err);
      setErrorMessage("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Export Candidate Evaluation as Text Report
  const handleDownloadReport = (c, e) => {
    e.stopPropagation(); // Prevent opening modal
    const reportContent = `
========================================
HIRELENS AI - CANDIDATE EVALUATION REPORT
========================================
Candidate Name: ${c.candidate_name}
Target Role:    ${c.job_role}
Match Score:    ${c.match_score} / 100
Evaluation Date:${c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}

----------------------------------------
AI RECRUITMENT REVIEW:
----------------------------------------
${c.ai_feedback ? c.ai_feedback.replace(/Questions:[\s\S]*/i, '').trim() : 'N/A'}

----------------------------------------
TAILORED TECHNICAL INTERVIEW QUESTIONS:
----------------------------------------
${c.interview_questions || 'N/A'}
========================================
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${c.candidate_name.replace(/\s+/g, '_')}_Evaluation_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredCandidates = candidates.filter(c => 
    c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.job_role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ fontFamily: '"Inter", sans-serif', background: '#0b0f19', minHeight: '100vh', padding: '40px 20px', color: '#f8fafc' }}>
      <div style={{ maxWidth: '1350px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.8rem', fontWeight: '800', color: '#ffffff' }}>HireLens AI 🎯</h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Enterprise recruitment intelligence platform with dynamic AI resume evaluation and custom interview question generation.
          </p>
        </header>

        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '14px 20px', borderRadius: '10px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage('')} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1.1rem' }}>&times;</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '35px', alignItems: 'start' }}>
          
          {/* Form */}
          <div style={{ background: '#131c2e', padding: '30px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>
              📥 Screen New Candidate
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>CANDIDATE FULL NAME</label>
                <input type="text" placeholder="e.g. Rahul Sharma" value={candidateName} onChange={e => setCandidateName(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#090d16', color: 'white', boxSizing: 'border-box' }} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>TARGET POSITION</label>
                <input type="text" placeholder="e.g. Full Stack Developer" value={jobRole} onChange={e => setJobRole(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#090d16', color: 'white', boxSizing: 'border-box' }} required />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>JOB DESCRIPTION (TEXT / FILE)</label>
                <textarea placeholder="Paste requirements..." value={jobDescriptionText} onChange={e => setJobDescriptionText(e.target.value)} rows="3" style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#090d16', color: 'white', boxSizing: 'border-box', marginBottom: '6px', resize: 'vertical' }} />
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setJdFile(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#94a3b8' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>UPLOAD RESUME (PDF, DOCX) *</label>
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e => setResumeFile(e.target.files[0])} style={{ width: '100%', color: '#94a3b8', fontSize: '0.85rem' }} required />
              </div>

              <button type="submit" disabled={loading} style={{ background: '#38bdf8', color: '#0b0f19', border: 'none', padding: '13px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? '⏳ Analyzing Candidate...' : 'Run AI Evaluation'}
              </button>
            </form>
          </div>

          {/* Pipeline */}
          <div style={{ background: '#131c2e', padding: '30px', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 15px 35px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>
                📊 Candidate Pipeline ({candidates.length})
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#090d16', color: 'white', fontSize: '0.85rem', width: '180px' }} />
                {candidates.length > 0 && (
                  <button onClick={handleClearPipeline} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ maxHeight: '650px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '5px' }}>
              {filteredCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <p>No candidates evaluated yet.</p>
                </div>
              ) : (
                filteredCandidates.map(c => {
                  const score = c.match_score || 0;
                  const isHighMatch = score >= 70;
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCandidate(c)}
                      style={{ background: '#090d16', padding: '20px', borderRadius: '12px', borderLeft: `5px solid ${isHighMatch ? '#22c55e' : '#f59e0b'}`, border: '1px solid #1e293b', marginBottom: '15px', cursor: 'pointer', transition: 'transform 0.1s ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' }}>{c.candidate_name}</span>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ fontSize: '0.7rem', background: isHighMatch ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isHighMatch ? '#4ade80' : '#fbbf24', padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>
                              {isHighMatch ? '✓ Recommended for Interview' : '⚡ Moderate Match'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            onClick={(e) => handleDownloadReport(c, e)} 
                            title="Download Report"
                            style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                          >
                            📥 Report
                          </button>
                          <div style={{ background: '#131c2e', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '700' }}>SCORE</div>
                            <div style={{ fontSize: '1rem', fontWeight: '800', color: isHighMatch ? '#4ade80' : '#fbbf24' }}>{score}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600', marginBottom: '10px' }}>
                        Role: {c.job_role}
                      </div>

                      <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', background: '#131c2e', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                        <strong>AI Review:</strong> {c.ai_feedback ? c.ai_feedback.replace(/Questions:[\s\S]*/i, '').trim() : "Candidate evaluation completed."}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', background: 'rgba(56, 189, 248, 0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed rgba(56, 189, 248, 0.3)' }}>
                        <div style={{ fontWeight: '700', color: '#38bdf8', marginBottom: '4px' }}>💡 Tailored Technical Interview Questions:</div>
                        <div style={{ whiteSpace: 'pre-line', color: '#94a3b8' }}>
                          {c.interview_questions || "1. Walk through a complex technical challenge.\n2. How do you handle performance bottlenecks?\n3. Explain your stack expertise."}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#131c2e', border: '1px solid #334155', borderRadius: '16px', maxWidth: '700px', width: '100%', padding: '30px', maxHeight: '85vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <button 
              onClick={() => setSelectedCandidate(null)} 
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              &times;
            </button>

            <h2 style={{ marginTop: 0, color: '#ffffff', fontSize: '1.8rem', marginBottom: '5px' }}>{selectedCandidate.candidate_name}</h2>
            <div style={{ color: '#38bdf8', fontWeight: '700', marginBottom: '20px', fontSize: '1.05rem' }}>Role: {selectedCandidate.job_role}</div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#090d16', padding: '12px 20px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>MATCH SCORE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: selectedCandidate.match_score >= 70 ? '#4ade80' : '#fbbf24' }}>
                  {selectedCandidate.match_score} / 100
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#f1f5f9', fontSize: '1.1rem', marginBottom: '8px' }}>📋 Comprehensive AI Evaluation</h3>
              <div style={{ background: '#090d16', padding: '15px', borderRadius: '10px', color: '#cbd5f1', lineHeight: '1.6', border: '1px solid #1e293b' }}>
                {selectedCandidate.ai_feedback ? selectedCandidate.ai_feedback.replace(/Questions:[\s\S]*/i, '').trim() : "No review text available."}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#38bdf8', fontSize: '1.1rem', marginBottom: '8px' }}>💡 Technical Interview Guide</h3>
              <div style={{ background: '#090d16', padding: '15px', borderRadius: '10px', color: '#e2e8f0', whiteSpace: 'pre-line', lineHeight: '1.6', border: '1px solid #1e293b' }}>
                {selectedCandidate.interview_questions || "No questions recorded."}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={(e) => handleDownloadReport(selectedCandidate, e)}
                style={{ background: '#38bdf8', color: '#0b0f19', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
              >
                📥 Download Report File
              </button>
              <button 
                onClick={() => setSelectedCandidate(null)}
                style={{ background: '#334155', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;