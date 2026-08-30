import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const e = readFileSync(join(here, '..', '.env'), 'utf8');
const nip = (e.match(/BACKEND_TEST_NIP=(.*)/) || [])[1].trim();
const pass = (e.match(/BACKEND_TEST_PASS=(.*)/) || [])[1].trim();

const B = 'http://localhost:3000/api';

// Login + simpan cookie
const login = await fetch(B + '/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nip, password: pass }),
});
const setCookie = login.headers.get('set-cookie') || '';
const cookie = setCookie.split(';')[0]; // refreshToken=...
const lj = await login.json();
console.log('login =>', login.status, '| token OK:', !!lj.accessToken, '| cookie:', cookie.startsWith('refreshToken='));

// Refresh dengan cookie (body KOSONG — server baca cookie)
const rf = await fetch(B + '/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookie },
});
console.log('refresh (cookie) =>', rf.status, (await rf.text()).slice(0, 60));

// Logout
const h = { Authorization: 'Bearer ' + lj.accessToken, 'Content-Type': 'application/json' };
const lo = await fetch(B + '/auth/logout', { method: 'POST', headers: h, body: '{}' });
console.log('logout =>', lo.status);
