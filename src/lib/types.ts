// ponytail: Row longgar (kolom dinamis dari server). Upgrade: tipe per entity / generate dari skema.
export type Row = { id: number } & Record<string, any>;
export type Form = Record<string, any>;
export interface Me { id: number; username: string }
