import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, Alert, Spinner, Button } from '../../components/UI';

export default function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const load = useCallback(async () => {
    try {
      const [examsRes, questionsRes] = await Promise.all([
        api.get('/exams'),
        api.get(`/exams/${examId}/questions`),
      ]);
      const found = examsRes.data.exams.find((e) => String(e.id) === String(examId));
      if (!found) {
        setError('Exam not found.');
        return;
      }
      setExam(found);
      setQuestions(questionsRes.data.questions || []);

      // Compute remaining time from exam date + duration
      const examEnd = new Date(found.date).getTime() + found.duration * 60 * 1000;
      const remaining = Math.max(0, Math.floor((examEnd - Date.now()) / 1000));
      setTimeLeft(remaining);
    } catch {
      setError('Failed to load exam. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    load();
  }, [load]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('Submit your exam? You cannot change answers after submission.')) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      }));
      const res = await api.post(`/exams/${examId}/submit`, { answers: payload });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  // Results view
  if (result) {
    const passed = result.score !== null && result.score >= 50;
    return (
      <div style={pageStyle}>
        <Card style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: '8px' }}>{result.autoGraded ? (passed ? '🎉' : '📝') : '📬'}</div>
          <h1 style={{ color: '#111827', marginBottom: '8px' }}>
            {result.autoGraded ? 'Exam Submitted & Graded' : 'Exam Submitted'}
          </h1>
          {result.autoGraded ? (
            <>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: passed ? '#16a34a' : '#dc2626', margin: '16px 0' }}>
                {result.score}%
              </div>
              <p style={{ color: '#374151', marginBottom: '4px' }}>
                {result.correct} / {result.total} correct
              </p>
              <p style={{ color: passed ? '#16a34a' : '#dc2626', fontWeight: 700, fontSize: '1.1rem' }}>
                {passed ? '✅ Passed' : '❌ Not Passed'}
              </p>
            </>
          ) : (
            <p style={{ color: '#6b7280' }}>Your answers have been submitted. Results will be posted by your instructor.</p>
          )}
          <Button onClick={() => navigate('/exams')} style={{ marginTop: '24px', width: '100%' }}>
            ← Back to Exams
          </Button>
        </Card>
      </div>
    );
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerColor = timeLeft !== null && timeLeft < 300 ? '#dc2626' : '#16a34a';

  return (
    <div style={pageStyle}>
      {/* Sticky header */}
      <div style={headerBar}>
        <div>
          <h2 style={{ margin: 0, color: '#111827', fontSize: '1.1rem' }}>{exam?.title}</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {timeLeft !== null && (
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: timerColor, fontFamily: 'monospace' }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
          {timeLeft === 0 && !result && (
            <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0 }}>Time's up — please submit now</p>
          )}
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {questions.length === 0 ? (
        <Card>
          <p style={{ color: '#6b7280', textAlign: 'center' }}>
            This exam has no questions yet. Contact your instructor.
          </p>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Button variant="secondary" onClick={() => navigate('/exams')}>← Back to Exams</Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          {questions.map((q, index) => (
            <Card key={q.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={qBadge}>{index + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 14px', color: '#111827', fontWeight: 600, fontSize: '1rem', lineHeight: 1.6 }}>
                    {q.question_text}
                  </p>
                  {q.question_type === 'mcq' && Array.isArray(q.options) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt, i) => (
                        <label key={i} style={optionLabel(answers[q.id] === opt)}>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswer(q.id, opt)}
                            style={{ marginRight: '10px' }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : q.question_type === 'true_false' ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['True', 'False'].map((val) => (
                        <label key={val} style={optionLabel(answers[q.id] === val)}>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={val}
                            checked={answers[q.id] === val}
                            onChange={() => handleAnswer(q.id, val)}
                            style={{ marginRight: '8px' }}
                          />
                          {val}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                      placeholder="Type your answer here..."
                      rows={4}
                      style={textareaStyle}
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <Button variant="secondary" type="button" onClick={() => navigate('/exams')}>
              ← Back
            </Button>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {Object.keys(answers).filter((k) => answers[k]).length} / {questions.length} answered
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : '✅ Submit Exam'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

const pageStyle = { padding: '24px', maxWidth: '900px', margin: '0 auto' };

const headerBar = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#fff',
  borderRadius: '12px',
  padding: '16px 20px',
  marginBottom: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: '68px',
  zIndex: 50,
};

const qBadge = {
  background: '#7c3aed',
  color: '#fff',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '0.9rem',
  flexShrink: 0,
};

const optionLabel = (selected) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px',
  borderRadius: '8px',
  border: `2px solid ${selected ? '#7c3aed' : '#e5e7eb'}`,
  background: selected ? '#f5f3ff' : '#fff',
  cursor: 'pointer',
  fontWeight: selected ? 600 : 400,
  color: selected ? '#7c3aed' : '#374151',
  transition: 'all 0.15s',
});

const textareaStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1.5px solid #d1d5db',
  fontSize: '0.95rem',
  resize: 'vertical',
  boxSizing: 'border-box',
  minHeight: '100px',
};
