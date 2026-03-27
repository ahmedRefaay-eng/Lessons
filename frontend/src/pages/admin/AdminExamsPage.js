import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card, Alert, Spinner, Button, Input, Table } from '../../components/UI';

const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function AdminExamsPage() {
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', duration: '', is_active: false });
  const [examFile, setExamFile] = useState(null);
  const [assignExam, setAssignExam] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [questionsExam, setQuestionsExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qForm, setQForm] = useState({ question_text: '', question_type: 'text', options: '', correct_answer: '', sort_order: '0' });
  const [qSubmitting, setQSubmitting] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);

  const load = async () => {
    const [examsRes, usersRes] = await Promise.all([api.get('/exams'), api.get('/admin/users?role=student')]);
    setExams(examsRes.data.exams);
    setUsers(usersRes.data.users);
  };

  useEffect(() => { load().catch(() => setError('Failed to load.')).finally(() => setLoading(false)); }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (examFile) formData.append('file', examFile);
      await api.post('/exams', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Exam created!');
      setShowForm(false);
      setForm({ title: '', description: '', date: '', duration: '', is_active: false });
      setExamFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam.');
    }
  };

  const handleToggle = async (exam) => {
    try {
      await api.put(`/exams/${exam.id}`, { is_active: !exam.is_active });
      setSuccess(`Exam ${!exam.is_active ? 'activated' : 'deactivated'}`);
      load();
    } catch { setError('Failed to update.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      setSuccess('Deleted.');
      load();
    } catch { setError('Failed to delete.'); }
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) { setError('Select at least one student.'); return; }
    try {
      await api.post(`/exams/${assignExam.id}/assign`, { user_ids: selectedUsers });
      setSuccess(`Assigned ${selectedUsers.length} student(s).`);
      setAssignExam(null);
      setSelectedUsers([]);
    } catch (err) { setError(err.response?.data?.message || 'Failed to assign.'); }
  };

  const openQuestions = async (exam) => {
    setQuestionsExam(exam);
    setQForm({ question_text: '', question_type: 'text', options: '', correct_answer: '', sort_order: '0' });
    setEditQuestion(null);
    const r = await api.get(`/exams/${exam.id}/questions`);
    setQuestions(r.data.questions);
  };

  const handleQChange = (e) => setQForm({ ...qForm, [e.target.name]: e.target.value });

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setQSubmitting(true);
    try {
      const payload = {
        question_text: qForm.question_text,
        question_type: qForm.question_type,
        correct_answer: qForm.correct_answer || null,
        sort_order: parseInt(qForm.sort_order, 10) || 0,
      };
      if (qForm.question_type === 'mcq' && qForm.options) {
        payload.options = qForm.options.split('\n').map((o) => o.trim()).filter(Boolean);
      }
      if (editQuestion) {
        await api.put(`/exams/${questionsExam.id}/questions/${editQuestion.id}`, payload);
      } else {
        await api.post(`/exams/${questionsExam.id}/questions`, payload);
      }
      setQForm({ question_text: '', question_type: 'text', options: '', correct_answer: '', sort_order: '0' });
      setEditQuestion(null);
      const r = await api.get(`/exams/${questionsExam.id}/questions`);
      setQuestions(r.data.questions);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save question.'); }
    finally { setQSubmitting(false); }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    await api.delete(`/exams/${questionsExam.id}/questions/${qId}`);
    const r = await api.get(`/exams/${questionsExam.id}/questions`);
    setQuestions(r.data.questions);
  };

  const openEditQuestion = (q) => {
    setEditQuestion(q);
    setQForm({
      question_text: q.question_text,
      question_type: q.question_type,
      options: Array.isArray(q.options) ? q.options.join('\n') : (q.options || ''),
      correct_answer: q.correct_answer || '',
      sort_order: String(q.sort_order || 0),
    });
  };

  if (loading) return <Spinner />;

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleString() : '-' },
    { key: 'duration', label: 'Duration', render: (v) => `${v} min` },
    { key: 'file_name', label: 'Content File', render: (v) => v ? <span style={{ color: '#0891b2', fontSize: '0.85rem' }}>📎 {v}</span> : '—' },
    { key: 'is_active', label: 'Status', render: (v) => <span style={{ color: v ? '#16a34a' : '#6b7280', fontWeight: 600 }}>{v ? '🟢 Active' : '⚫ Inactive'}</span> },
    {
      key: 'id', label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Button variant={row.is_active ? 'secondary' : 'success'} onClick={() => handleToggle(row)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="outline" onClick={() => { setAssignExam(row); setSelectedUsers([]); }} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            Assign
          </Button>
          <Button variant="outline" onClick={() => openQuestions(row)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            ❓ Questions
          </Button>
          <Button variant="danger" onClick={() => handleDelete(id)} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#111827' }}>📝 Manage Exams</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ New Exam'}</Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {showForm && (
        <Card>
          <h2 style={{ marginBottom: '16px' }}>Create New Exam</h2>
          <form onSubmit={handleCreate}>
            <Input label="Title" name="title" value={form.title} onChange={handleChange} required />
            <Input label="Description (optional)" name="description" value={form.description} onChange={handleChange} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Date & Time" name="date" type="datetime-local" value={form.date} onChange={handleChange} required />
              <Input label="Duration (minutes)" name="duration" type="number" min="1" value={form.duration} onChange={handleChange} required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                Exam Content File (PDF, Word, PPT — optional)
              </label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={(e) => setExamFile(e.target.files[0])} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              <span>Active (students can access)</span>
            </label>
            <Button type="submit">Create Exam</Button>
          </form>
        </Card>
      )}

      <Card>
        <Table columns={columns} rows={exams} emptyMessage="No exams yet." />
      </Card>

      {/* Assign students modal */}
      {assignExam && (
        <div style={overlayStyle}>
          <Card style={{ maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '16px' }}>Assign Students to "{assignExam.title}"</h2>
            {users.map((u) => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(u.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                    else setSelectedUsers(selectedUsers.filter((id) => id !== u.id));
                  }}
                />
                <span>{u.first_name || ''} {u.last_name || ''} <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>({u.email})</span></span>
                <span style={{ marginLeft: 'auto', fontFamily: 'monospace', color: '#1e40af', fontSize: '0.8rem' }}>{u.student_id}</span>
              </label>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <Button onClick={handleAssign} style={{ flex: 1 }}>Assign Selected ({selectedUsers.length})</Button>
              <Button variant="secondary" onClick={() => setAssignExam(null)} style={{ flex: 1 }}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Questions modal */}
      {questionsExam && (
        <div style={overlayStyle}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>❓ Questions: {questionsExam.title}</h2>
              <Button variant="secondary" onClick={() => setQuestionsExam(null)}>✕ Close</Button>
            </div>

            <form onSubmit={handleSaveQuestion} style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>{editQuestion ? 'Edit Question' : 'Add Question'}</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Question Text</label>
                <textarea name="question_text" value={qForm.question_text} onChange={handleQChange} rows={3} required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select name="question_type" value={qForm.question_type} onChange={handleQChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem' }}>
                    <option value="text">Text / Open</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>
                <Input label="Order" name="sort_order" type="number" min="0" value={qForm.sort_order} onChange={handleQChange} />
              </div>
              {qForm.question_type === 'mcq' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Options (one per line)</label>
                  <textarea name="options" value={qForm.options} onChange={handleQChange} rows={4}
                    placeholder="Option A&#10;Option B&#10;Option C"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', boxSizing: 'border-box' }} />
                </div>
              )}
              <Input label="Correct Answer (optional)" name="correct_answer" value={qForm.correct_answer} onChange={handleQChange} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="submit" disabled={qSubmitting}>{qSubmitting ? 'Saving...' : (editQuestion ? 'Update' : 'Add Question')}</Button>
                {editQuestion && <Button type="button" variant="secondary" onClick={() => { setEditQuestion(null); setQForm({ question_text: '', question_type: 'text', options: '', correct_answer: '', sort_order: '0' }); }}>Cancel</Button>}
              </div>
            </form>

            {questions.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>No questions yet.</p>
            ) : (
              questions.map((q, i) => (
                <div key={q.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '10px', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#7c3aed' }}>Q{i + 1}</span>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px', color: '#6b7280' }}>{q.question_type}</span>
                      </div>
                      <p style={{ margin: 0, color: '#111827' }}>{q.question_text}</p>
                      {q.options && Array.isArray(q.options) && (
                        <ul style={{ margin: '8px 0 0 20px', padding: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                          {q.options.map((opt, j) => <li key={j}>{opt}</li>)}
                        </ul>
                      )}
                      {q.correct_answer && <p style={{ color: '#16a34a', fontSize: '0.85rem', margin: '6px 0 0' }}>✓ {q.correct_answer}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
                      <Button variant="outline" onClick={() => openEditQuestion(q)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Edit</Button>
                      <Button variant="danger" onClick={() => handleDeleteQuestion(q.id)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Del</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' };
const labelStyle = { display: 'block', marginBottom: '4px', fontWeight: 600, color: '#374151', fontSize: '0.875rem' };
