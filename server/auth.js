import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from './db.js';

const DAY = 86400000;
export const hashPw = (pw, salt = randomBytes(16).toString('hex')) =>
  ({ salt, hash: scryptSync(pw, salt, 64).toString('hex') });

export function createUser(username, password) {
  const { salt, hash } = hashPw(password);
  db.prepare('INSERT INTO users(username,hash,salt) VALUES(?,?,?)').run(username, hash, salt);
}
export function verify(username, password) {
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!u) return null;
  const a = Buffer.from(hashPw(password, u.salt).hash, 'hex');
  return timingSafeEqual(a, Buffer.from(u.hash, 'hex')) ? u : null;
}
export function newSession(userId) {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(token, userId, Date.now() + 7 * DAY);
  return token;
}
export function sessionUser(token) {
  if (!token) return null;
  db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
  return db.prepare('SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(token) || null;
}
export const dropSession = (token) => db.prepare('DELETE FROM sessions WHERE token=?').run(token);
