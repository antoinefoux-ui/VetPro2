import { FormEvent, useEffect, useState } from 'react';
import api from '../config/api';

type InvoiceListResponse = InvoiceRow[] | { data?: InvoiceRow[] };

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  balanceDue: number;
  notes?: string;
  dueDate?: string;
}

function Invoices() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<InvoiceRow>>({});
  const [createForm, setCreateForm] = useState({
    clientId: '',
    petId: '',
    notes: '',
    itemDescription: 'Consultation',
    itemType: 'service',
    quantity: 1,
    unitPrice: 40,
    taxRate: 20,
    discountPercentage: 0,
  });
  const [error, setError] = useState('');

  const formatCurrency = (value: unknown) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
  };

  const token = localStorage.getItem('token');
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.fetch<InvoiceListResponse>('/api/invoices');
        const data = Array.isArray(response) ? response : response.data;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      }
    };
    load();
  }, []);

  const createInvoice = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.fetch<InvoiceRow>('/api/invoices', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          clientId: createForm.clientId,
          petId: createForm.petId || undefined,
          notes: createForm.notes || undefined,
          items: [
            {
              itemType: createForm.itemType,
              description: createForm.itemDescription,
              quantity: createForm.quantity,
              unitPrice: createForm.unitPrice,
              taxRate: createForm.taxRate,
              discountPercentage: createForm.discountPercentage,
            },
          ],
        }),
      });
      setRows((prev) => [created, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  };

  const startEdit = (row: InvoiceRow) => {
    setEditingId(row.id);
    setDraft({ status: row.status, notes: row.notes, dueDate: row.dueDate });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updated = await api.fetch<Partial<InvoiceRow>>(`/api/invoices/${editingId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(draft),
      });
      setRows((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...updated } : item)));
      setEditingId(null);
      setDraft({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice');
    }
  };

  const removeRow = async (id: string) => {
    try {
      await api.fetch<void>(`/api/invoices/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Invoices</h1>
      <p className="text-sm text-gray-500 mb-4">Create, edit & delete invoices.</p>
      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={createInvoice} className="bg-white rounded-lg border p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
        <input className="border rounded px-2 py-1" placeholder="Client ID (uuid)" value={createForm.clientId} onChange={(e) => setCreateForm((v) => ({ ...v, clientId: e.target.value }))} required />
        <input className="border rounded px-2 py-1" placeholder="Pet ID (uuid, optional)" value={createForm.petId} onChange={(e) => setCreateForm((v) => ({ ...v, petId: e.target.value }))} />
        <input className="border rounded px-2 py-1" placeholder="Item description" value={createForm.itemDescription} onChange={(e) => setCreateForm((v) => ({ ...v, itemDescription: e.target.value }))} required />
        <input className="border rounded px-2 py-1" type="number" placeholder="Price" value={createForm.unitPrice} onChange={(e) => setCreateForm((v) => ({ ...v, unitPrice: Number(e.target.value) }))} />
        <button className="px-3 py-1 bg-green-600 text-white rounded" type="submit">Add Invoice</button>
      </form>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Invoice #</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Total</th><th className="p-2 text-left">Balance</th><th className="p-2 text-left">Due Date</th><th className="p-2 text-left">Notes</th><th className="p-2 text-left">Actions</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.invoiceNumber}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.status ?? ''} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} /> : row.status}</td>
                <td className="p-2">€{formatCurrency(row.totalAmount)}</td>
                <td className="p-2">€{formatCurrency(row.balanceDue)}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" type="date" value={draft.dueDate ? String(draft.dueDate).slice(0, 10) : ''} onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))} /> : row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}</td>
                <td className="p-2">{editingId === row.id ? <input className="border rounded px-2 py-1" value={draft.notes ?? ''} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} /> : row.notes || '-'}</td>
                <td className="p-2 flex gap-2">{editingId === row.id ? <><button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded">Save</button><button onClick={() => setEditingId(null)} className="px-2 py-1 border rounded">Cancel</button></> : <><button onClick={() => startEdit(row)} className="px-2 py-1 bg-blue-600 text-white rounded">Edit</button><button onClick={() => removeRow(row.id)} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button></>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Invoices;
