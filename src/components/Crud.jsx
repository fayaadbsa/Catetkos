// CRUD generik berbasis config. Dipakai semua entity. Validasi final di server, error ditampilkan sebagai toast.
import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, toast } from '../lib/api.js';
import { Button, Card, PageHeader, Input, Label, Modal, Select } from './ui.jsx';

// field: {key,label,type:text|number|date|bool|select,options:[{v,l}],hint}
// extra: render tambahan di bawah form. onChange(form): return patch otomatis (mis. harga). actions(row): tombol ekstra per baris.
export default function Crud({ resource, title, columns, fields, query = '', defaults = {}, canAdd = true, onChange, extra, actions, onSaved, empty = 'Belum ada data.', desc, emptyAction }) {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => api(`/${resource}${query}`).then(setRows).catch((e) => toast(e.message, true));
  useEffect(() => { setRows(null); load(); }, [resource, query]);

  const set = async (patch) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (onChange) { const extraPatch = await onChange(next, patch); if (extraPatch) setForm((f) => ({ ...f, ...extraPatch })); }
  };
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = Object.fromEntries(fields.map((f) => [f.key, form[f.key] ?? null]));
      if (form.id) await api(`/${resource}/${form.id}`, { method: 'PUT', body }); else await api('/' + resource, { body });
      toast('Tersimpan'); setForm(null); await load(); onSaved?.();
    } catch (err) { toast(err.message, true); } finally { setBusy(false); }
  };
  const del = async (r) => {
    if (!confirm('Hapus data ini?')) return;
    try { await api(`/${resource}/${r.id}`, { method: 'DELETE' }); toast('Terhapus'); load(); onSaved?.(); } catch (err) { toast(err.message, true); }
  };

  const input = (f) => {
    const v = form[f.key] ?? '';
    if (f.type === 'select') return <Select value={v} onChange={(e) => set({ [f.key]: e.target.value })} required={f.req}><option value="">-</option>{f.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</Select>;
    if (f.type === 'bool') return <input type="checkbox" className="size-5 accent-primary" checked={!!form[f.key]} onChange={(e) => set({ [f.key]: e.target.checked ? 1 : 0 })} />;
    return <Input type={f.type === 'number' ? 'number' : f.type || 'text'} inputMode={f.type === 'number' ? 'numeric' : undefined} value={v} required={f.req} min={f.type === 'number' ? 0 : undefined}
      onChange={(e) => set({ [f.key]: f.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value })} />;
  };

  return (
    <div className="space-y-4">
      <PageHeader title={title} desc={desc}>{canAdd && <Button onClick={() => setForm({ ...defaults })}><Plus size={16} /> Tambah</Button>}</PageHeader>
      {form && (
        <Modal title={`${form.id ? 'Edit' : 'Tambah'} ${title}`} onClose={() => setForm(null)}>
          <form onSubmit={save} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {fields.filter((f) => !f.hide?.(form)).map((f) => (
              <Label key={f.key}>{f.label}{!!f.req && ' *'}{input(f)}{f.hint?.(form) && <span className="mt-1 block text-xs font-normal text-mut">{f.hint(form)}</span>}</Label>
            ))}
            {extra?.(form, set)}
            <div className="col-span-full flex gap-2">
              <Button disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Batal</Button>
            </div>
          </form>
        </Modal>
      )}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-semibold uppercase tracking-wide text-mut"><tr>{columns.map((c) => <th key={c.key} className="whitespace-nowrap p-3">{c.label}</th>)}<th /></tr></thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-t border-line hover:bg-soft/60">
                {columns.map((c) => <td key={c.key} className="whitespace-nowrap p-3">{c.fmt ? c.fmt(r) : r[c.key] ?? '-'}</td>)}
                <td className="whitespace-nowrap p-3 text-right">
                  {actions?.(r, load)}
                  <Button variant="ghost" aria-label="Edit" title="Edit" onClick={() => setForm({ ...r })}><Pencil size={15} /></Button>
                  <Button variant="ghost" aria-label="Hapus" title="Hapus" className="text-danger" onClick={() => del(r)}><Trash2 size={15} /></Button>
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td className="p-8 text-center text-mut" colSpan={columns.length + 1}><p>{empty}</p>{emptyAction && <div className="mt-3">{emptyAction}</div>}</td></tr>}
            {!rows && <tr><td className="p-3 text-mut" colSpan={columns.length + 1}>Lagi muat...</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
