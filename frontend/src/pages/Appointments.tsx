import { FormEvent, useEffect, useState } from 'react';
import api from '../config/api';

type AppointmentListResponse = AppointmentRow[] | { data?: AppointmentRow[] };

interface AppointmentRow {
  id: string;
  appointmentType: string;
  status: string;
  scheduledStart: string;
  roomNumber?: string;
  reason?: string;
}

function Appointments() {
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<AppointmentRow>>({});
  const [createForm, setCreateForm] = useState({
    clientId: '',
    petId: '',
    appointmentType: 'consultation',
    scheduledStart: '',
    scheduledEnd: '',
    roomNumber: '',
    reason: '',
  });
  const [error, setError] = useState('');

  const toIsoStringOrUndefined = (value: string) => {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  };

  const token = localStorage.getItem('token');
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.fetch<AppointmentListResponse>('/api/appointments');
        const data = Array.isArray(response) ? response : response.data;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load appointments');
      }
    };
    load();
  }, []);

  const createAppointment = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.fetch<AppointmentRow>('/api/appointments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...createForm,
          scheduledStart: toIsoStringOrUndefined(createForm.scheduledStart),
          scheduledEnd: toIsoStringOrUndefined(createForm.scheduledEnd),
        }),
      });
      setRows((prev) => [created, ...prev]);
      setCreateForm({ clientId: '', petId: '', appointmentType: 'consultation', scheduledStart: '', scheduledEnd: '', roomNumber: '', reason: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment');
    }
  };

  const startEdit = (row: AppointmentRow) => {
    setEditingId(row.id);
    setDraft({ status: row.status, roomNumber: row.roomNumber, reason: row.reason });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updated = await api.fetch<Partial<AppointmentRow>>(`/api/appointments/${editingId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(draft),
      });
      setRows((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item)));
      setEditingId(null);
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save appointment');
    }
  };

  const removeRow = async (id: string) => {
    try {
      await api.fetch<void>(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Appointments</h1>
      <p className="text-sm text-gray-500 mb-4">Create, edit & delete appointment list.</p>
      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={createAppointment} className="bg-white rounded-lg border p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Client ID (uuid)" value={createForm.clientId} onChange={(e) => setCreateForm((v) => ({ ...v, clientId: e.target.value }))} required />
        <input className="border rounded px-2 py-1" placeholder="Pet ID (uuid)" value={createForm.petId} onChange={(e) => setCreateForm((v) => ({ ...v, petId: e.target.value }))} required />
        <select className="border rounded px-2 py-1" value={createForm.appointmentType} onChange={(e) => setCreateForm((v) => ({ ...v, appointmentType: e.target.value }))}>
          <option value="consultation">consultation</option><option value="surgery">surgery</option><option value="vaccination">vaccination</option><option value="follow_up">follow_up</option><option value="emergency">emergency</option><option value="grooming">grooming</option>
        </select>
        <input className="border rounded px-2 py-1" type="datetime-local" value={createForm.scheduledStart} onChange={(e) => setCreateForm((v) => ({ ...v, scheduledStart: e.target.value }))} required />
        <input className="border rounded px-2 py-1" type="datetime-local" value={createForm.scheduledEnd} onChange={(e) => setCreateForm((v) => ({ ...v, scheduledEnd: e.target.value }))} required />
        <input className="border rounded px-2 py-1" placeholder="Room" value={createForm.roomNumber} onChange={(e) => setCreateForm((v) => ({ ...v, roomNumber: e.target.value }))} />
        <input className="border rounded px-2 py-1" placeholder="Reason" value={createForm.reason} onChange={(e) => setCreateForm((v) => ({ ...v, reason: e.target.value }))} />
        <button className="px-3 py-1 bg-green-600 text-white rounded" type="submit">Add Appointment</button>
      </form>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2 text-left">Type</th><th className="p-2 text-left">Start</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Room</th><th className="p-2 text-left">Reason</th><th className="p-2 text-left">Actions</th></tr></thead><tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="p-2">{row.appointmentType}</td><td className="p-2">{row.scheduledStart ? new Date(row.scheduledStart).toLocaleString() : '-'}</td>
              <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.status ?? ''} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} /> : row.status}</td>
              <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.roomNumber ?? ''} onChange={(e) => setDraft((d) => ({ ...d, roomNumber: e.target.value }))} /> : row.roomNumber || '-'}</td>
              <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.reason ?? ''} onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))} /> : row.reason || '-'}</td>
              <td className="p-2 flex gap-2">{editingId === row.id ? <><button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded">Save</button><button onClick={() => setEditingId(null)} className="px-2 py-1 border rounded">Cancel</button></> : <><button onClick={() => startEdit(row)} className="px-2 py-1 bg-blue-600 text-white rounded">Edit</button><button onClick={() => removeRow(row.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button></>}</td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}

export default Appointments;
