import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

export default function ExamsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // For the student_id modal
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [startError, setStartError] = useState('');
  const [startLoading, setStartLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get('/exams').then((r) => setExams(r.data.exams)).catch(() => setError('Failed to load exams.')).finally(() => setLoading(false));
  }, []);

  const handleStartClick = (exam) => {
    setSelectedExam(exam);
    setStudentIdInput('');
    setStartError('');
    setSuccessMsg('');
  };

  const handleStartExam = async (e) => {
    e.preventDefault();
    if (!studentIdInput.trim()) {
      setStartError('Please enter your Student ID.');
      return;
    }
    setStartLoading(true);
    setStartError('');
    try {
      const res = await api.post(`/exams/${selectedExam.id}/start`, { student_id: studentIdInput.trim() });
      setSuccessMsg(`✅ ${res.data.message}! Redirecting to exam...`);
      setSelectedExam(null);
      // Navigate to exam-taking page
      setTimeout(() => navigate(`/exams/${selectedExam.id}/take`), 800);
    } catch (err) {
      setStartError(err.response?.data?.message || 'Failed to start exam.');
    } finally {
      setStartLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleString() : '-' },
    { key: 'duration', label: 'Duration', render: (v) => `${v} min` },
    {
      key: 'is_active', label: 'Status',
      render: (v) => (
        <span style={{ color: v ? '#16a34a' : '#6b7280', fontWeight: 600 }}>
          {v ? '🟢 Active' : '⚫ Inactive'}
        </span>
      ),
    },
    {
      key: 'id', label: 'Action',
      render: (id, row) => (
        <Button
          variant={row.is_active ? 'primary' : 'secondary'}
          disabled={!row.is_active}
          onClick={() => row.is_active && handleStartClick(row)}
          style={{ padding: '6px 14px', fontSize: '0.85rem' }}
        >
          {row.is_active ? 'Start Exam' : 'Not Active'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '8px' }}>📝 Exams</h1>
      <Alert type="warning">
        ⚠️ You must enter your <strong>Student ID</strong> to access any exam. Your Student ID is: <strong style={{ fontFamily: 'monospace' }}>{user.student_id}</strong>
      </Alert>
      {error && <Alert type="error">{error}</Alert>}
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <Card>
        <Table columns={columns} rows={exams} emptyMessage="No exams available." />
      </Card>

      {/* Student ID Modal */}
      {selectedExam && (
        <div style={overlayStyle}>
          <Card style={{ maxWidth: '460px', width: '100%' }}>
            <h2 style={{ marginBottom: '8px' }}>🔑 Enter Student ID</h2>
            <p style={{ color: '#374151', marginBottom: '16px' }}>
              To start <strong>"{selectedExam.title}"</strong>, please enter your unique Student ID.
            </p>
            {startError && <Alert type="error">{startError}</Alert>}
            <form onSubmit={handleStartExam}>
              <Input
                label="Your Student ID"
                id="student_id"
                name="student_id"
                type="text"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="e.g. STU-A1B2C3D4"
                required
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button type="submit" disabled={startLoading} style={{ flex: 1 }}>
                  {startLoading ? 'Verifying...' : 'Start Exam'}
                </Button>
                <Button variant="secondary" onClick={() => setSelectedExam(null)} style={{ flex: 1 }}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200, padding: '24px',
};
