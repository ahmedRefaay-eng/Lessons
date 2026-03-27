import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Alert, Spinner, Table } from '../../components/UI';

export default function GradesPage() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/grades/${user.id}`)
      .then((r) => setGrades(r.data.grades))
      .catch(() => setError('Failed to load grades.'))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <Spinner />;

  const avgGrade = grades.length > 0
    ? (grades.reduce((s, g) => s + parseFloat(g.grade), 0) / grades.length).toFixed(1)
    : null;

  const columns = [
    { key: 'exam_title', label: 'Exam' },
    { key: 'exam_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'grade', label: 'Grade',
      render: (v) => (
        <span style={{ fontWeight: 700, color: parseFloat(v) >= 50 ? '#16a34a' : '#dc2626' }}>
          {parseFloat(v).toFixed(1)}%
        </span>
      ),
    },
    { key: 'feedback', label: 'Feedback' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', color: '#111827', marginBottom: '24px' }}>📊 My Grades</h1>
      {error && <Alert type="error">{error}</Alert>}

      {avgGrade && (
        <Card style={{ textAlign: 'center', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
          <p style={{ color: '#6b7280', marginBottom: '4px' }}>Overall Average</p>
          <p style={{ fontSize: '3rem', fontWeight: 800, color: parseFloat(avgGrade) >= 50 ? '#16a34a' : '#dc2626' }}>
            {avgGrade}%
          </p>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={grades} emptyMessage="No grades recorded yet." />
      </Card>
    </div>
  );
}
