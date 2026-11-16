// Tabel CRUD generik: rooms, bookings, expenses, capital.
import { useEffect, useState } from 'react';
import { api, rp } from '../lib/api.js';
import { Button, Card, Input, Label } from './ui.jsx';

export default function Crud({ table, title, fields, columns, rooms }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const load = () => api('/' + table).then(setRows);
  useEffect(() => { load(); }, [table]);
  const save = async () => {
    const body = Object.fromEntries(fields.map((f) => [f.key, f.type === 'number' ? +form[f.key] || 0 : form[f.key] || null]));
    if (form.id) await api(`/${table}/${form.id}`, { method: 'PUT', body }); else await api('/' + table, { body });
    setForm(null); load();
  };
  const del = async (id) => { if (confirm('Hapus data ini?')) { await api(`/${table}/${id}`, { method: 'DELETE' }); load(); } };
  const opts = fields.map((f) => f.key === 'room_id' ? { ...f, options: rooms.map((r) => ({ v: r.id, l: `${r.number} - ${r.type}` })) } : f);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button onClick={() => setForm({})}>+ Tambah</Button>
      </div>
      {form && (
        <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {opts.map((f) => (
            <Label key={f.key}>{f.label}
              {f.options ? (
                <select className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm" value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  <option value="">-</option>
                  {f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              ) : f.type === 'bool' ? (
                <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked ? 1 : 0 })} />
              ) : (
                <Input type={f.type || 'text'} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              )}
            </Label>
          ))}
          <div className="col-span-full flex gap-2">
            <Button onClick={save}>Simpan</Button>
            <Button variant="ghost" onClick={() => setForm(null)}>Batal</Button>
          </div>
        </Card>
      )}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-400">
            <tr>{columns.map((c) => <th key={c.key} className="p-3">{c.label}</th>)}<th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-800">
                {columns.map((c) => <td key={c.key} className="p-3">{c.fmt ? c.fmt(r, rooms) : r[c.key] ?? '-'}</td>)}
                <td className="p-3 text-right whitespace-nowrap">
                  <Button variant="ghost" onClick={() => setForm({ ...r })}>Edit</Button>
                  <Button variant="danger" onClick={() => del(r.id)}>Hapus</Button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-3 text-zinc-500" colSpan={columns.length + 1}>Belum ada data.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
export { rp };
