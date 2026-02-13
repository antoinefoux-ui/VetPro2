import { FormEvent, useEffect, useState } from 'react';
import api from '../config/api';

type InventoryListResponse = InventoryRow[] | { data?: InventoryRow[] };

interface InventoryRow {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  location?: string;
  sellingPrice?: number;
}

function Inventory() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<InventoryRow>>({});
  const [createForm, setCreateForm] = useState({ name: '', currentStock: 0, minimumStock: 0, location: '', sellingPrice: 0 });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.fetch<InventoryListResponse>('/api/inventory');
        const data = Array.isArray(response) ? response : response.data;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      }
    };
    load();
  }, []);

  const createItem = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.fetch<InventoryRow>('/api/inventory', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(createForm),
      });
      setRows((prev) => [created, ...prev]);
      setCreateForm({ name: '', currentStock: 0, minimumStock: 0, location: '', sellingPrice: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  const startEdit = (row: InventoryRow) => {
    setEditingId(row.id);
    setDraft({
      name: row.name,
      currentStock: row.currentStock,
      minimumStock: row.minimumStock,
      location: row.location,
      sellingPrice: row.sellingPrice,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updated = await api.fetch<Partial<InventoryRow>>(`/api/inventory/${editingId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(draft),
      });
      setRows((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item)));
      setEditingId(null);
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  const removeRow = async (id: string) => {
    try {
      await api.fetch<void>(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Inventory</h1>
      <p className="text-sm text-gray-500 mb-4">Create, edit & delete inventory items.</p>
      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={createItem} className="bg-white rounded-lg border p-4 mb-4 grid grid-cols-1 md:grid-cols-6 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm((v) => ({ ...v, name: e.target.value }))} required />
        <input className="border rounded px-2 py-1" type="number" placeholder="Current" value={createForm.currentStock} onChange={(e) => setCreateForm((v) => ({ ...v, currentStock: Number(e.target.value) }))} />
        <input className="border rounded px-2 py-1" type="number" placeholder="Minimum" value={createForm.minimumStock} onChange={(e) => setCreateForm((v) => ({ ...v, minimumStock: Number(e.target.value) }))} />
        <input className="border rounded px-2 py-1" placeholder="Location" value={createForm.location} onChange={(e) => setCreateForm((v) => ({ ...v, location: e.target.value }))} />
        <input className="border rounded px-2 py-1" type="number" placeholder="Price" value={createForm.sellingPrice} onChange={(e) => setCreateForm((v) => ({ ...v, sellingPrice: Number(e.target.value) }))} />
        <button className="px-3 py-1 bg-green-600 text-white rounded" type="submit">Add Item</button>
      </form>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Current</th><th className="p-2 text-left">Minimum</th><th className="p-2 text-left">Location</th><th className="p-2 text-left">Price</th><th className="p-2 text-left">Actions</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.name ?? ''} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} /> : row.name}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" type="number" value={draft.currentStock ?? 0} onChange={(e) => setDraft((d) => ({ ...d, currentStock: Number(e.target.value) }))} /> : row.currentStock}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" type="number" value={draft.minimumStock ?? 0} onChange={(e) => setDraft((d) => ({ ...d, minimumStock: Number(e.target.value) }))} /> : row.minimumStock}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.location ?? ''} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} /> : row.location || '-'}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" type="number" value={draft.sellingPrice ?? 0} onChange={(e) => setDraft((d) => ({ ...d, sellingPrice: Number(e.target.value) }))} /> : row.sellingPrice ?? '-'}</td>
                <td className="p-2 flex gap-2">{editingId === row.id ? <><button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded">Save</button><button onClick={() => setEditingId(null)} className="px-2 py-1 border rounded">Cancel</button></> : <><button onClick={() => startEdit(row)} className="px-2 py-1 bg-blue-600 text-white rounded">Edit</button><button onClick={() => removeRow(row.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button></>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Inventory;
