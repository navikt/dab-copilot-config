#!/usr/bin/env node
/**
 * etterlevelse-broker
 *
 * Lokal credential-broker for GitHub Copilot CLI.
 * Tar imot skriveforslag fra agenten via POST /write, viser diff i terminalen,
 * og videresender til NAV-API-et med Bearer-token etter menneskelig godkjenning.
 *
 * Token hentes via OAuth2 device-code mot Entra (brukeren logger inn i nettleser).
 * Token holdes kun i minnet — aldri på disk.
 *
 * Bruk: BROKER_CLIENT_ID=<klient-id> node broker.js
 */

import http from 'http';
import readline from 'readline';
import { PublicClientApplication } from '@azure/msal-node';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── Konfigurasjon ─────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.BROKER_PORT || '9876');
const NAV_TENANT = '62366534-1ec3-4962-8869-9b5535279d0b';

const SCOPES = {
  etterlevelse:
    process.env.ETTERLEVELSE_SCOPE ||
    'api://prod-gcp.teamdatajegerne.etterlevelse-backend/.default',
  behandlingskatalog:
    process.env.BEHANDLINGSKATALOG_SCOPE ||
    'api://prod-gcp.teamkatalog.behandlingskatalog-backend/.default',
};

const ALLOWED_HOSTS = new Set([
  'etterlevelse-api.intern.nav.no',
  'behandlingskatalog-backend.intern.nav.no',
]);

const LOG_PATH = path.join(os.homedir(), '.copilot', 'etterlevelse-broker.jsonl');

// ─── MSAL ──────────────────────────────────────────────────────────────────────

const CLIENT_ID = process.env.BROKER_CLIENT_ID;

let pca = null;
if (CLIENT_ID) {
  pca = new PublicClientApplication({
    auth: {
      clientId: CLIENT_ID,
      authority: `https://login.microsoftonline.com/${NAV_TENANT}`,
    },
    system: { loggerOptions: { loggerCallback: () => {} } },
  });
}

// scope → { token, expiresOn }
const tokenCache = {};

async function getToken(scope) {
  if (!pca) {
    throw new Error(
      'BROKER_CLIENT_ID er ikke satt. Start brokeren med: BROKER_CLIENT_ID=<klient-id> node broker.js'
    );
  }
  const cached = tokenCache[scope];
  if (cached && Date.now() < cached.expiresOn - 60_000) return cached.token;

  console.log('\n🔐 Henter tilgangstoken via device-code...');
  const result = await pca.acquireTokenByDeviceCode({
    scopes: [scope],
    deviceCodeCallback: (r) => console.log('\n' + r.message),
  });
  tokenCache[scope] = { token: result.accessToken, expiresOn: result.expiresOn.getTime() };
  console.log(`✅ Autentisert som ${result.account?.username}\n`);
  return result.accessToken;
}

// ─── Changelog ─────────────────────────────────────────────────────────────────

function writeLog(entry) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* ikke kritisk */ }
}

// ─── Diff ──────────────────────────────────────────────────────────────────────

function truncate(s, n) {
  const str = typeof s === 'string' ? s : JSON.stringify(s) ?? '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function diffEtterlevelse(current, proposed) {
  const lines = [];
  const curSKs = Object.fromEntries(
    (current?.suksesskriterieBegrunnelser || []).map((s) => [s.suksesskriterieId, s])
  );
  for (const sk of proposed.suksesskriterieBegrunnelser || []) {
    const old = curSKs[sk.suksesskriterieId] || {};
    const statusChanged = old.suksesskriterieStatus !== sk.suksesskriterieStatus;
    const textChanged = (old.begrunnelse || '') !== (sk.begrunnelse || '');
    if (!statusChanged && !textChanged) continue;
    lines.push(`  SK ${sk.suksesskriterieId}:`);
    if (statusChanged)
      lines.push(`    Status:  ${old.suksesskriterieStatus ?? '(tom)'} → ${sk.suksesskriterieStatus}`);
    if (textChanged) {
      lines.push(`    Begrunnelse:`);
      lines.push(`    - ${truncate(old.begrunnelse || '(tom)', 200)}`);
      lines.push(`    + ${truncate(sk.begrunnelse || '', 200)}`);
    }
  }
  return lines.join('\n');
}

function diffGeneric(current, proposed) {
  const skip = new Set(['version', 'changeStamp', 'id']);
  return Object.keys(proposed)
    .filter((k) => !skip.has(k))
    .filter((k) => JSON.stringify(current?.[k]) !== JSON.stringify(proposed[k]))
    .map(
      (k) =>
        `  ${k}:\n` +
        `    - ${truncate(current?.[k] ?? '(tom)', 150)}\n` +
        `    + ${truncate(proposed[k], 150)}`
    )
    .join('\n');
}

// ─── Terminal-interaksjon ──────────────────────────────────────────────────────

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function promptMultiline(label) {
  console.log(`${label}`);
  console.log('(Avslutt med en linje som kun inneholder ".")');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const lines = [];
  return new Promise((resolve) => {
    rl.on('line', (line) => {
      if (line === '.') {
        rl.close();
        resolve(lines.join('\n'));
      } else {
        lines.push(line);
      }
    });
  });
}

// ─── Skriv-håndtering ──────────────────────────────────────────────────────────

async function handleWrite({ url, method, body }) {
  const urlObj = new URL(url);

  // Hent gjeldende tilstand for diff (GET er åpent, ingen auth)
  let current = null;
  if (method.toUpperCase() === 'PUT') {
    try {
      const r = await fetch(url);
      if (r.ok) current = await r.json();
    } catch { /* ikke kritisk — diff vises uten "gammel" side */ }
  }

  // Velg diff-funksjon basert på objekttype
  const isEtterlevelse = Array.isArray(body.suksesskriterieBegrunnelser);
  const getDiff = () =>
    isEtterlevelse ? diffEtterlevelse(current, body) : diffGeneric(current, body);

  let diff = getDiff();
  console.log('\n' + '─'.repeat(60));
  console.log(`📝 ${method.toUpperCase()} ${url}`);

  if (!diff) {
    console.log('  (ingen endringer detektert)\n');
    writeLog({ url, method, action: 'skipped', reason: 'no-diff' });
    return { action: 'skipped', reason: 'no-diff' };
  }

  console.log('\nEndringer:\n' + diff);

  // Godkjenningsloop
  while (true) {
    const ans = (await prompt('\n[G]odkjenn / [H]opp over / [R]ediger begrunnelse: '))
      .toUpperCase()
      .charAt(0);

    if (ans === 'H') {
      writeLog({ url, method, action: 'skipped' });
      console.log('⏭  Hoppet over\n');
      return { action: 'skipped' };
    }

    if (ans === 'R') {
      if (!isEtterlevelse) {
        console.log('ℹ️  Rediger støttes kun for etterlevelse-objekter. Velg G eller H.\n');
        continue;
      }
      const skIds = (body.suksesskriterieBegrunnelser || [])
        .map((s) => s.suksesskriterieId)
        .join(', ');
      const skInput = await prompt(`Skriv SK-id som skal redigeres (${skIds}): `);
      const skId = parseInt(skInput);
      const sk = body.suksesskriterieBegrunnelser?.find((s) => s.suksesskriterieId === skId);
      if (!sk) {
        console.log('Ugyldig SK-id, prøv igjen.\n');
        continue;
      }
      sk.begrunnelse = await promptMultiline(`\nNy begrunnelse for SK ${skId}:`);
      diff = getDiff();
      console.log('\nOppdatert diff:\n' + diff);
      continue;
    }

    if (ans === 'G') {
      const scope = urlObj.hostname.includes('behandlingskatalog')
        ? SCOPES.behandlingskatalog
        : SCOPES.etterlevelse;

      const token = await getToken(scope);
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      writeLog({ url, method, action: 'approved', status: res.status, diff });

      if (!res.ok) {
        console.log(`❌ ${res.status}: ${text.slice(0, 300)}\n`);
        return { status: res.status, error: text };
      }

      console.log(`✅ Oppdatert (${res.status})\n`);
      try {
        return { status: res.status, body: JSON.parse(text) };
      } catch {
        return { status: res.status, body: text };
      }
    }

    console.log('Ugyldig valg. Skriv G, H eller R.\n');
  }
}

// ─── Kø for å unngå samtidige readline-prompter ────────────────────────────────

let busy = false;
const queue = [];

function enqueue(reqBody) {
  return new Promise((resolve, reject) => {
    queue.push({ reqBody, resolve, reject });
    drainQueue();
  });
}

function drainQueue() {
  if (busy || queue.length === 0) return;
  busy = true;
  const { reqBody, resolve, reject } = queue.shift();
  handleWrite(reqBody)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      busy = false;
      drainQueue();
    });
}

// ─── HTTP-server ───────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // Helsesjekk
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT, clientId: CLIENT_ID ? '(satt)' : '(mangler)' }));
    return;
  }

  if (req.method !== 'POST' || req.url !== '/write') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bruk POST /write eller GET /health' }));
    return;
  }

  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', async () => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ugyldig JSON i request body' }));
      return;
    }

    const { url, method, body } = parsed;

    if (!url || !method || !body) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'url, method og body er påkrevd' }));
      return;
    }

    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Ugyldig URL: ${url}` }));
      return;
    }

    if (!ALLOWED_HOSTS.has(urlObj.hostname)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `${urlObj.hostname} er ikke i allowlisten` }));
      return;
    }

    if (!['PUT', 'POST'].includes(method.toUpperCase())) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `${method} er ikke tillatt (kun PUT og POST)` }));
      return;
    }

    try {
      const result = await enqueue(parsed);
      res.writeHead(result.status || 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('Feil:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🚀 etterlevelse-broker v0.1`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Logg: ${LOG_PATH}`);
  if (!CLIENT_ID) {
    console.warn('\n⚠️  BROKER_CLIENT_ID er ikke satt.');
    console.warn('   Skriveoperasjoner vil feile inntil klient-ID er konfigurert.');
    console.warn('   Start med: BROKER_CLIENT_ID=<klient-id> node broker.js\n');
  } else {
    console.log(`   Klient: ${CLIENT_ID}\n`);
  }
  console.log('   Ctrl+C for å avslutte\n');
});
