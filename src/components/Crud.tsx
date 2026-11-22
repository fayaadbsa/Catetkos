// CRUD generik berbasis config. Dipakai semua entity. Validasi final di server, error ditampilkan sebagai toast.
import { useEffect, useState, type ReactNode } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, toast, errMsg } from '../lib/api';
import type { Row, Form } from '../lib/types';
import { Button, PageHeader, Input, Label, Modal, Select, Checkbox, DataTable, type Column } from './ui';

// field: {key,label,type:text|number|date|bool|select,options:[{v,l}],hint}
// extra: render tambahan di bawah form. onChange(form): return patch otomatis (mis. harga). actions(row): tombol ekstra per baris.
export interface Field {
  key: string; label: string; type?: 'text' | 'number' | 'date' | 'bool' | 'select'; req?: number | boolean;
  options?: { v: string | number; l: string }[]; hint?: (f: Form) => string | undefined; hide?: (f: Form) => boolean;
}
interface CrudProps {
  resource: string; title: string; columns: Column<Row>[]; fields: Field[]; query?: string; defaults?: Record<string, unknown>; canAdd?: boolean;
  onChange?: (next: Form, patch: Partial<Form>) => Promise<Partial<Form> | void> | Partial<Form> | void;
  extra?: (form: Form, set: (p: Partial<Form>) => void) => ReactNode; actions?: (r: Row, reload: () => void) => ReactNode; onSaved?: () => void;
  empty?: string; desc?: string; emptyAction?: ReactNode;
  table?: boolean; toolbar?: (rows: Row[]) => ReactNode; rowFilter?: (r: Row) => boolean; footer?: (rows: Row[]) => ReactNode;
}
export default function Crud({ resource, title, columns, fields, query = '', defaults = {}, canAdd = true, onChange, extra, actions, onSaved, empty = 'Belum ada data.', desc, emptyAction, table, toolbar, rowFilter, footer }: CrudProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api<Row[]>(`/${resource}${query}`).then(setRows).catch((e) => toast(errMsg(e), true));
  useEffect(() => { setRows(null); load(); }, [resource, query]);

  const set = async (patch: Partial<Form>) => {
    const next: Form = { ...form, ...patch };
    setForm(next);
    if (onChange) { const extraPatch = await onChange(next, patch); if (extraPatch) setForm((f) => ({ ...f!, ...extraPatch })); }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = Object.fromEntries(fields.map((f) => [f.key, form![f.key] ?? null]));
      if (form!.id) await api(`/${resource}/${form!.id}`, { method: 'PUT', body }); else await api('/' + resource, { body });
      toast('Tersimpan'); setForm(null); await load(); onSaved?.();
    } catch (err) { toast(errMsg(err), true); } finally { setBusy(false); }
  };
  const del = async (r: Row) => {
    if (!confirm('Hapus data ini?')) return;
    try { await api(`/${resource}/${r.id}`, { method: 'DELETE' }); toast('Terhapus'); load(); onSaved?.(); } catch (err) { toast(errMsg(err), true); }
  };

  const shown = rows && (rowFilter ? rows.filter(rowFilter) : rows);
  const input = (f: Field) => {
    const fm = form!;
    const v = fm[f.key] ?? '';
    if (f.type === 'select') return <Select value={v} onChange={(e) => set({ [f.key]: e.target.value })} required={!!f.req}><option value="">-</option>{f.options!.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</Select>;
    if (f.type === 'bool') return <Checkbox checked={!!fm[f.key]} onChange={(e) => set({ [f.key]: e.target.checked ? 1 : 0 })} />;
    return <Input type={f.type === 'number' ? 'number' : f.type || 'text'} inputMode={f.type === 'number' ? 'numeric' : undefined} value={v} required={!!f.req} min={f.type === 'number' ? 0 : undefined}
      onChange={(e) => set({ [f.key]: f.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value })} />;
  };

  return (
    <div className="space-y-4">
      <PageHeader title={title} desc={desc}>{canAdd && <Button onClick={() => setForm({ ...defaults })}><Plus size={16} /> Tambah</Button>}</PageHeader>
      {form && (
        <Modal title={`${form.id ? 'Edit' : 'Tambah'} ${title}`} onClose={() => setForm(null)}>
          <form onSubmit={save} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {fields.filter((f) => !f.hide?.(form!)).map((f) => (
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
      {rows && toolbar?.(rows)}
      <DataTable table={table} footer={shown && footer?.(shown)} rows={shown} columns={columns} rowKey={(r) => r.id} empty={<><p>{empty}</p>{emptyAction && <div className="mt-3">{emptyAction}</div>}</>}
        actions={(r) => (
          <>
            {actions?.(r, load)}
            <Button variant="ghost" aria-label="Edit" title="Edit" onClick={() => setForm({ ...r })}><Pencil size={15} /></Button>
            <Button variant="ghost" aria-label="Hapus" title="Hapus" className="text-danger" onClick={() => del(r)}><Trash2 size={15} /></Button>
          </>
        )} />
    </div>
  );
}
