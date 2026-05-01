import { useState, useEffect, useCallback } from 'react';
import * as api from './api';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];
const isOverdue = (t) => t.status !== 'Done' && t.dueDate && t.dueDate < today;

const STATUS_META = {
  Todo: { color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  'In Progress': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Done: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};
const PRIORITY_META = {
  High: '#ef4444', Medium: '#f59e0b', Low: '#6b7280',
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const S = {
  root: { fontFamily: "'DM Mono','Courier New',monospace", background: '#080c14', minHeight: '100vh', color: '#e2e8f0' },
  authWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(56,189,248,0.08) 0%, transparent 70%), #080c14' },
  authCard: { width: 400, background: '#0f1623', border: '1px solid #1e2d45', borderRadius: 16, padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' },
  authLogo: { fontSize: 13, letterSpacing: 4, color: '#38bdf8', marginBottom: 8, textTransform: 'uppercase' },
  authTitle: { fontSize: 28, fontWeight: 700, color: '#f0f6ff', marginBottom: 6 },
  authSub: { fontSize: 13, color: '#64748b', marginBottom: 32 },
  label: { display: 'block', fontSize: 11, letterSpacing: 1.5, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  input: { width: '100%', background: '#0a1220', border: '1px solid #1e2d45', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  select: { width: '100%', background: '#0a1220', border: '1px solid #1e2d45', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', appearance: 'none' },
  btnPrimary: { width: '100%', background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', border: 'none', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5 },
  btnSecondary: { background: 'none', border: '1px solid #1e2d45', borderRadius: 8, padding: '10px 18px', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 12px', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 240, minHeight: '100vh', background: '#0a1220', borderRight: '1px solid #1e2d45', display: 'flex', flexDirection: 'column', padding: '28px 0', flexShrink: 0 },
  sidebarLogo: { padding: '0 24px 28px', borderBottom: '1px solid #1e2d45', fontSize: 11, letterSpacing: 3, color: '#38bdf8', textTransform: 'uppercase' },
  navSection: { padding: '20px 12px 8px', fontSize: 10, color: '#334155', letterSpacing: 2, textTransform: 'uppercase' },
  navItem: (a) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', margin: '2px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', background: a ? 'rgba(56,189,248,0.1)' : 'transparent', color: a ? '#38bdf8' : '#64748b', border: 'none', width: 'calc(100% - 16px)', textAlign: 'left' }),
  main: { flex: 1, overflow: 'auto', padding: '32px 40px' },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#f0f6ff', marginBottom: 4 },
  pageSub: { fontSize: 13, color: '#475569', marginBottom: 32 },
  card: { background: '#0f1623', border: '1px solid #1e2d45', borderRadius: 12, padding: '20px 24px', marginBottom: 16 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 },
  statCard: (accent) => ({ background: '#0f1623', border: '1px solid #1e2d45', borderRadius: 12, padding: '20px 24px', borderLeft: `3px solid ${accent}` }),
  statNum: { fontSize: 32, fontWeight: 700, color: '#f0f6ff', lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 6 },
  taskCard: (over) => ({ background: over ? 'rgba(239,68,68,0.04)' : '#0f1623', border: `1px solid ${over ? 'rgba(239,68,68,0.25)' : '#1e2d45'}`, borderRadius: 10, padding: '14px 20px', marginBottom: 8 }),
  badge: (color, bg) => ({ display: 'inline-flex', alignItems: 'center', background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, letterSpacing: 0.5 }),
  avatar: (size = 32) => ({ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }),
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#0f1623', border: '1px solid #1e2d45', borderRadius: 16, padding: 32, width: 480, maxWidth: '90vw', boxShadow: '0 32px 100px rgba(0,0,0,0.8)' },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f0f6ff', marginBottom: 24 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0 28px' },
  roleChip: (role) => ({ display: 'inline-flex', alignItems: 'center', background: role === 'Admin' ? 'rgba(56,189,248,0.1)' : 'rgba(167,139,250,0.1)', color: role === 'Admin' ? '#38bdf8' : '#a78bfa', border: `1px solid ${role === 'Admin' ? 'rgba(56,189,248,0.2)' : 'rgba(167,139,250,0.2)'}`, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: 0.5 }),
  divider: { height: 1, background: '#1e2d45', margin: '16px 0' },
  col3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 },
  errBox: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Chip({ status }) {
  const m = STATUS_META[status] || STATUS_META.Todo;
  return <span style={S.badge(m.color, m.bg)}>{status}</span>;
}

function PriorityDot({ priority }) {
  const c = PRIORITY_META[priority] || '#6b7280';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: c }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />
      {priority}
    </span>
  );
}

function Avatar({ user, size = 32 }) {
  return <div style={S.avatar(size)}>{user?.avatar || '?'}</div>;
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 16 }}><label style={S.label}>{label}</label>{children}</div>;
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080c14', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #1e2d45', borderTop: '3px solid #38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 12, color: '#334155', letterSpacing: 2 }}>LOADING</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
function TaskModal({ task, projects, users, currentUser, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    projectId: task?.projectId || projects[0]?.id || '',
    status: task?.status || 'Todo',
    priority: task?.priority || 'Medium',
    assigneeId: task?.assigneeId || currentUser.id,
    dueDate: task?.dueDate || '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const members = users.filter((u) => {
    const proj = projects.find((p) => p.id === form.projectId);
    return proj ? proj.memberIds.includes(u.id) : true;
  });

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalTitle}>{task ? 'Edit Task' : 'New Task'}</div>
        <Field label="Title">
          <input style={S.input} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Task name…" />
        </Field>
        <Field label="Description">
          <textarea style={{ ...S.input, resize: 'vertical', minHeight: 70 }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Project">
            <select style={S.select} value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Assignee">
            <select style={S.select} value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
              {members.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select style={S.select} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {['Todo', 'In Progress', 'Done'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select style={S.select} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Due Date">
          <input style={S.input} type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button style={S.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            style={{ ...S.btnPrimary, width: 'auto', padding: '10px 24px', opacity: saving ? 0.6 : 1 }}
            onClick={() => form.title.trim() && onSave(form)}
            disabled={saving}
          >
            {saving ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT MODAL ────────────────────────────────────────────────────────────
function ProjectModal({ users, currentUser, onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: '', description: '', memberIds: [currentUser.id] });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (uid) => {
    if (uid === currentUser.id) return;
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(uid) ? f.memberIds.filter((id) => id !== uid) : [...f.memberIds, uid],
    }));
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalTitle}>New Project</div>
        <Field label="Project Name">
          <input style={S.input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Website Redesign" />
        </Field>
        <Field label="Description">
          <textarea style={{ ...S.input, resize: 'vertical', minHeight: 60 }} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Team Members">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((u) => (
              <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: u.id === currentUser.id ? 'default' : 'pointer' }}>
                <input type="checkbox" checked={form.memberIds.includes(u.id)} disabled={u.id === currentUser.id}
                  onChange={() => toggle(u.id)} style={{ accentColor: '#38bdf8' }} />
                <Avatar user={u} size={26} />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{u.name}</span>
                <span style={S.roleChip(u.role)}>{u.role}</span>
              </label>
            ))}
          </div>
        </Field>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button style={S.btnSecondary} onClick={onClose} disabled={saving}>Cancel</button>
          <button
            style={{ ...S.btnPrimary, width: 'auto', padding: '10px 24px', opacity: saving ? 0.6 : 1 }}
            onClick={() => form.name.trim() && onSave(form)}
            disabled={saving}
          >
            {saving ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function Dashboard({ tasks, projects, users, currentUser }) {
  const myTasks = tasks.filter((t) => t.assigneeId === currentUser.id);
  const overdue = tasks.filter(isOverdue);

  return (
    <div>
      <div style={S.statGrid}>
        {[
          { label: 'Total Tasks', value: tasks.length, accent: '#38bdf8' },
          { label: 'In Progress', value: tasks.filter((t) => t.status === 'In Progress').length, accent: '#f59e0b' },
          { label: 'Completed', value: tasks.filter((t) => t.status === 'Done').length, accent: '#10b981' },
          { label: 'Overdue', value: overdue.length, accent: '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={S.statCard(s.accent)}>
            <div style={S.statNum}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Tasks */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
            My Tasks ({myTasks.length})
          </div>
          {myTasks.length === 0 && <div style={{ color: '#334155', fontSize: 13 }}>No tasks assigned to you.</div>}
          {myTasks.slice(0, 6).map((task) => {
            const proj = projects.find((p) => p.id === task.projectId);
            const over = isOverdue(task);
            return (
              <div key={task.id} style={S.taskCard(over)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: over ? '#fca5a5' : '#e2e8f0' }}>{task.title}</span>
                  <Chip status={task.status} />
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <PriorityDot priority={task.priority} />
                  <span style={{ fontSize: 11, color: '#334155' }}>{proj?.name}</span>
                  {task.dueDate && <span style={{ fontSize: 11, color: over ? '#ef4444' : '#475569' }}>Due {task.dueDate}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
            Overdue ({overdue.length})
          </div>
          {overdue.length === 0 && <div style={{ color: '#334155', fontSize: 13 }}>🎉 No overdue tasks!</div>}
          {overdue.map((task) => {
            const assignee = users.find((u) => u.id === task.assigneeId);
            const proj = projects.find((p) => p.id === task.projectId);
            return (
              <div key={task.id} style={{ ...S.taskCard(true), display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar user={assignee} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{assignee?.name} · {proj?.name}</div>
                </div>
                <span style={{ fontSize: 11, color: '#ef4444' }}>{task.dueDate}</span>
              </div>
            );
          })}

          <div style={{ ...S.divider, marginTop: 24 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
            Projects ({projects.length})
          </div>
          {projects.map((p) => {
            const pt = tasks.filter((t) => t.projectId === p.id);
            const done = pt.filter((t) => t.status === 'Done').length;
            const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
            return (
              <div key={p.id} style={{ ...S.card, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#38bdf8' }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: '#1e2d45', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>{done}/{pt.length} tasks done</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PROJECTS PAGE ────────────────────────────────────────────────────────────
function ProjectsPage({ projects, tasks, users, currentUser, onCreateProject, onDeleteProject }) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAdmin = currentUser.role === 'Admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={S.pageTitle}>Projects</div>
          <div style={S.pageSub}>{projects.length} active projects</div>
        </div>
        {isAdmin && (
          <button style={{ ...S.btnPrimary, width: 'auto', padding: '10px 22px' }} onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      {projects.map((proj) => {
        const members = users.filter((u) => proj.memberIds.includes(u.id));
        const pt = tasks.filter((t) => t.projectId === proj.id);
        const done = pt.filter((t) => t.status === 'Done').length;
        const overdueCount = pt.filter(isOverdue).length;
        const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
        const owner = users.find((u) => u.id === proj.ownerId);
        return (
          <div key={proj.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f6ff', marginBottom: 4 }}>{proj.name}</div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>{proj.description}</div>
              </div>
              {isAdmin && proj.ownerId === currentUser.id && (
                <button style={S.btnDanger} onClick={() => onDeleteProject(proj.id)}>Delete</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
              {[{ l: 'Tasks', v: pt.length, c: '#38bdf8' }, { l: 'Done', v: done, c: '#10b981' }, { l: 'Overdue', v: overdueCount, c: '#ef4444' }].map((s) => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 4, background: '#1e2d45', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#334155' }}>Team:</span>
                {members.slice(0, 4).map((m) => (
                  <div key={m.id} title={m.name} style={{ ...S.avatar(24), marginLeft: -4, border: '2px solid #0a1220' }}>{m.avatar}</div>
                ))}
                <span style={{ fontSize: 11, color: '#475569' }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>
              <span style={{ fontSize: 11, color: '#334155' }}>Owner: {owner?.name}</span>
            </div>
          </div>
        );
      })}

      {showModal && (
        <ProjectModal
          users={users} currentUser={currentUser} saving={saving}
          onClose={() => setShowModal(false)}
          onSave={async (form) => {
            setSaving(true);
            await onCreateProject(form);
            setSaving(false);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── TASKS PAGE ───────────────────────────────────────────────────────────────
function TasksPage({ tasks, projects, users, currentUser, onCreateTask, onUpdateTask, onDeleteTask }) {
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fProject, setFProject] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fAssignee, setFAssignee] = useState('all');
  const isAdmin = currentUser.role === 'Admin';

  let filtered = tasks.filter((t) => {
    if (fProject !== 'all' && t.projectId !== fProject) return false;
    if (fStatus !== 'all' && t.status !== fStatus) return false;
    if (fAssignee !== 'all' && t.assigneeId !== fAssignee) return false;
    return true;
  });

  const canEdit = (task) => isAdmin || task.assigneeId === currentUser.id;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={S.pageTitle}>Tasks</div>
          <div style={S.pageSub}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        {isAdmin && (
          <button style={{ ...S.btnPrimary, width: 'auto', padding: '10px 22px' }}
            onClick={() => { setEditTask(null); setShowModal(true); }}>
            + New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={{ ...S.select, width: 'auto', fontSize: 12 }} value={fProject} onChange={(e) => setFProject(e.target.value)}>
          <option value="all">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select style={{ ...S.select, width: 'auto', fontSize: 12 }} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {['Todo', 'In Progress', 'Done'].map((s) => <option key={s}>{s}</option>)}
        </select>
        {isAdmin && (
          <select style={{ ...S.select, width: 'auto', fontSize: 12 }} value={fAssignee} onChange={(e) => setFAssignee(e.target.value)}>
            <option value="all">All Assignees</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 && (
        <div style={{ ...S.card, textAlign: 'center', color: '#334155', padding: 40 }}>No tasks found.</div>
      )}

      {filtered.map((task) => {
        const assignee = users.find((u) => u.id === task.assigneeId);
        const proj = projects.find((p) => p.id === task.projectId);
        const over = isOverdue(task);
        return (
          <div key={task.id} style={{ ...S.taskCard(over), display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar user={assignee} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: over ? '#fca5a5' : '#e2e8f0' }}>{task.title}</span>
                <Chip status={task.status} />
                {over && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>OVERDUE</span>}
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                <PriorityDot priority={task.priority} />
                <span style={{ fontSize: 11, color: '#475569' }}>{proj?.name}</span>
                <span style={{ fontSize: 11, color: '#334155' }}>→ {assignee?.name}</span>
                {task.dueDate && <span style={{ fontSize: 11, color: over ? '#ef4444' : '#475569' }}>Due {task.dueDate}</span>}
              </div>
              {task.description && <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>{task.description}</div>}
            </div>
            {canEdit(task) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {!isAdmin && (
                  <select style={{ ...S.select, width: 'auto', fontSize: 11, padding: '4px 8px' }}
                    value={task.status}
                    onChange={(e) => onUpdateTask(task.id, { status: e.target.value })}>
                    {['Todo', 'In Progress', 'Done'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                )}
                {isAdmin && (
                  <>
                    <button style={{ ...S.btnSecondary, padding: '5px 12px', fontSize: 11 }}
                      onClick={() => { setEditTask(task); setShowModal(true); }}>Edit</button>
                    <button style={S.btnDanger} onClick={() => onDeleteTask(task.id)}>Del</button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showModal && (
        <TaskModal
          task={editTask} projects={projects} users={users} currentUser={currentUser}
          saving={saving}
          onClose={() => setShowModal(false)}
          onSave={async (form) => {
            setSaving(true);
            if (editTask) await onUpdateTask(editTask.id, form);
            else await onCreateTask(form);
            setSaving(false);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── TEAM PAGE ────────────────────────────────────────────────────────────────
function TeamPage({ users, tasks, currentUser }) {
  return (
    <div>
      <div style={S.pageTitle}>Team</div>
      <div style={{ ...S.pageSub }}>{users.length} members in workspace</div>
      <div style={S.col3}>
        {users.map((u) => {
          const ut = tasks.filter((t) => t.assigneeId === u.id);
          const done = ut.filter((t) => t.status === 'Done').length;
          const over = ut.filter(isOverdue).length;
          return (
            <div key={u.id} style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar user={u} size={44} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f6ff' }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>{u.email}</div>
                </div>
              </div>
              <span style={S.roleChip(u.role)}>{u.role}</span>
              <div style={S.divider} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                {[{ l: 'Tasks', v: ut.length, c: '#38bdf8' }, { l: 'Done', v: done, c: '#10b981' }, { l: 'Overdue', v: over, c: '#ef4444' }].map((s) => (
                  <div key={s.l}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {u.id === currentUser.id && <div style={{ marginTop: 10, fontSize: 11, color: '#38bdf8', textAlign: 'center' }}>← You</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await api.auth.login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        result = await api.auth.register(form.name, form.email, form.password, form.role);
      }
      api.token.set(result.token);
      onSuccess(result.token, result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div style={S.authWrap}>
      <div style={S.authCard}>
        <div style={S.authLogo}>◈ TaskFlow</div>
        <div style={S.authTitle}>{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
        <div style={S.authSub}>{mode === 'login' ? 'Sign in to your workspace' : 'Join your team workspace'}</div>

        {mode === 'signup' && (
          <Field label="Full Name">
            <input style={S.input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Alex Rivera" onKeyDown={onKey} />
          </Field>
        )}
        <Field label="Email">
          <input style={S.input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@company.com" onKeyDown={onKey} />
        </Field>
        <Field label="Password">
          <input style={S.input} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" onKeyDown={onKey} />
        </Field>
        {mode === 'signup' && (
          <Field label="Role">
            <select style={S.select} value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option>Member</option>
              <option>Admin</option>
            </select>
          </Field>
        )}

        {error && <div style={S.errBox}>{error}</div>}

        <button style={{ ...S.btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={submit} disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#475569' }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => { setMode('signup'); setError(''); }}>Sign up</span>
            </>
          ) : (
            <>Already have an account?{' '}
              <span style={{ color: '#38bdf8', cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); }}>Sign in</span>
            </>
          )}
        </div>

        {mode === 'login' && (
          <div style={{ marginTop: 20, padding: 14, background: '#0a1220', borderRadius: 8, border: '1px solid #1e2d45' }}>
            <div style={{ fontSize: 10, color: '#334155', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Demo Credentials</div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.8 }}>
              <strong style={{ color: '#38bdf8' }}>Admin:</strong> admin@demo.com / admin123<br />
              <strong style={{ color: '#a78bfa' }}>Member:</strong> member@demo.com / member123
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [initDone, setInitDone] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [page, setPage] = useState('dashboard');
  const [globalErr, setGlobalErr] = useState('');

  // ── Load all data ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [me, allUsers, allProjects, allTasks] = await Promise.all([
        api.users.me(),
        api.users.getAll(),
        api.projects.getAll(),
        api.tasks.getAll(),
      ]);
      setCurrentUser(me);
      setUsers(allUsers);
      setProjects(allProjects);
      setTaskList(allTasks);
    } catch {
      // Token invalid — log out
      handleLogout();
    } finally {
      setInitDone(true);
    }
  }, []);

  // ── Boot: check for saved token ──────────────────────────────────────────────
  useEffect(() => {
    if (api.token.get()) {
      loadAll();
    } else {
      setInitDone(true);
    }
  }, [loadAll]);

  const handleAuthSuccess = (tok) => {
    // token already stored by AuthScreen
    loadAll();
  };

  const handleLogout = () => {
    api.token.clear();
    setCurrentUser(null);
    setUsers([]);
    setProjects([]);
    setTaskList([]);
    setInitDone(true);
  };

  const withErr = async (fn) => {
    setGlobalErr('');
    try { await fn(); }
    catch (err) { setGlobalErr(err.message); setTimeout(() => setGlobalErr(''), 4000); }
  };

  // ── Derived data (scope to user's projects) ──────────────────────────────────
  const myProjects = projects;  // API already filters by member
  const myTasks = taskList;     // API already filters by project membership

  if (!initDone) return <Spinner />;

  if (!currentUser) {
    return (
      <div style={S.root}>
        <AuthScreen onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  const NAV = [
    { id: 'dashboard', icon: '◈', label: 'Dashboard' },
    { id: 'projects', icon: '⬡', label: 'Projects' },
    { id: 'tasks', icon: '◻', label: 'Tasks' },
    { id: 'team', icon: '◉', label: 'Team' },
  ];

  return (
    <div style={{ ...S.root, ...S.layout }}>
      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <nav style={S.sidebar}>
        <div style={S.sidebarLogo}>◈ TaskFlow</div>
        <div style={S.navSection}>Navigation</div>
        {NAV.map((item) => (
          <button key={item.id} style={S.navItem(page === item.id)} onClick={() => setPage(item.id)}>
            <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={S.divider} />
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar user={currentUser} size={32} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{currentUser.name}</div>
              <span style={S.roleChip(currentUser.role)}>{currentUser.role}</span>
            </div>
          </div>
          <button style={{ ...S.btnSecondary, width: '100%', fontSize: 12 }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={S.pageTitle}>{NAV.find((n) => n.id === page)?.label}</div>
            <div style={S.pageSub}>
              {page === 'dashboard' && `Welcome back, ${currentUser.name.split(' ')[0]}`}
              {page === 'projects' && `${myProjects.length} projects`}
              {page === 'tasks' && `Across all your projects`}
              {page === 'team' && `${users.length} members`}
            </div>
          </div>
        </div>

        {globalErr && <div style={S.errBox}>{globalErr}</div>}

        {page === 'dashboard' && (
          <Dashboard tasks={myTasks} projects={myProjects} users={users} currentUser={currentUser} />
        )}

        {page === 'projects' && (
          <ProjectsPage
            projects={myProjects} tasks={myTasks} users={users} currentUser={currentUser}
            onCreateProject={async (form) => {
              await withErr(async () => {
                const proj = await api.projects.create(form);
                setProjects((p) => [proj, ...p]);
              });
            }}
            onDeleteProject={async (id) => {
              await withErr(async () => {
                await api.projects.delete(id);
                setProjects((p) => p.filter((proj) => proj.id !== id));
                setTaskList((t) => t.filter((task) => task.projectId !== id));
              });
            }}
          />
        )}

        {page === 'tasks' && (
          <TasksPage
            tasks={myTasks} projects={myProjects} users={users} currentUser={currentUser}
            onCreateTask={async (form) => {
              await withErr(async () => {
                const task = await api.tasks.create(form);
                setTaskList((t) => [task, ...t]);
              });
            }}
            onUpdateTask={async (id, changes) => {
              await withErr(async () => {
                const updated = await api.tasks.update(id, changes);
                setTaskList((t) => t.map((task) => task.id === id ? updated : task));
              });
            }}
            onDeleteTask={async (id) => {
              await withErr(async () => {
                await api.tasks.delete(id);
                setTaskList((t) => t.filter((task) => task.id !== id));
              });
            }}
          />
        )}

        {page === 'team' && (
          <TeamPage users={users} tasks={myTasks} currentUser={currentUser} />
        )}
      </main>
    </div>
  );
}
