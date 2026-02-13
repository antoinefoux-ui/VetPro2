import { FormEvent, useEffect, useState } from 'react';
import api from '../config/api';

type ClientListResponse = ClientRow[] | { data?: ClientRow[] };

interface ClientRow {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phonePrimary: string;
}

function Clients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ClientRow>>({});
  const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', phonePrimary: '' });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const loadClients = async () => {
    try {
      const response = await api.fetch<ClientListResponse>('/api/clients');
      const rows = Array.isArray(response) ? response : response.data;
      setClients(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const createClient = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.fetch<ClientRow>('/api/clients', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          email: createForm.email || null,
          phonePrimary: createForm.phonePrimary,
        }),
      });
      setClients((prev) => [created, ...prev]);
      setCreateForm({ firstName: '', lastName: '', email: '', phonePrimary: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  const startEdit = (row: ClientRow) => {
    setEditingId(row.id);
    setDraft({ ...row });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updated = await api.fetch<Partial<ClientRow>>(`/api/clients/${editingId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(draft),
      });
      setClients((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item)));
      setEditingId(null);
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client');
    }
  };

  const removeClient = async (id: string) => {
    try {
      await api.fetch<void>(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      setClients((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Clients</h1>
      <p className="text-sm text-gray-500 mb-4">Create, edit & delete clients.</p>
      {!token && <p className="mb-4 text-amber-600 text-sm">Login token missing: write actions may be unauthorized.</p>}
      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={createClient} className="bg-white rounded-lg border p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input className="border rounded px-2 py-1" placeholder="First name" value={createForm.firstName} onChange={(e) => setCreateForm((v) => ({ ...v, firstName: e.target.value }))} required />
        <input className="border rounded px-2 py-1" placeholder="Last name" value={createForm.lastName} onChange={(e) => setCreateForm((v) => ({ ...v, lastName: e.target.value }))} required />
        <input className="border rounded px-2 py-1" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((v) => ({ ...v, email: e.target.value }))} />
        <input className="border rounded px-2 py-1" placeholder="Phone" value={createForm.phonePrimary} onChange={(e) => setCreateForm((v) => ({ ...v, phonePrimary: e.target.value }))} required />
        <button className="px-3 py-1 bg-green-600 text-white rounded" type="submit">Add Client</button>
      </form>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{editingId === row.id ? <div className="flex gap-2"><input className="border rounded px-2 py-1" value={draft.firstName ?? ''} onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))} /><input className="border rounded px-2 py-1" value={draft.lastName ?? ''} onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))} /></div> : `${row.firstName} ${row.lastName}`}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.email ?? ''} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} /> : row.email || '-'}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.phonePrimary ?? ''} onChange={(e) => setDraft((d) => ({ ...d, phonePrimary: e.target.value }))} /> : row.phonePrimary}</td>
                <td className="p-2 flex gap-2">{editingId === row.id ? <><button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded">Save</button><button onClick={() => setEditingId(null)} className="px-2 py-1 border rounded">Cancel</button></> : <><button onClick={() => startEdit(row)} className="px-2 py-1 bg-blue-600 text-white rounded">Edit</button><button onClick={() => removeClient(row.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button></>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Clients;
