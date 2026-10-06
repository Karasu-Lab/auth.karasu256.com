import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MOCK_OAUTH_PORT ?? 3099);

const state = {
  mode: 'redirect',
  profile: { email: 'mock@example.test', name: 'Mock User' },
};

const codes = new Map();
const tokens = new Map();

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function callbackUrl(url, code, returnedState) {
  const target = new URL(url.searchParams.get('redirect_uri'));
  target.searchParams.set('code', code);
  if (returnedState !== null) target.searchParams.set('state', returnedState);
  return target.toString();
}

function authorize(res, provider, url) {
  const code = randomUUID();
  codes.set(code, { provider, profile: { ...state.profile } });

  const originalState = url.searchParams.get('state');
  const returnedState = state.mode === 'tamper-state' ? `${originalState}-tampered` : originalState;
  res.writeHead(302, { Location: callbackUrl(url, code, returnedState) });
  res.end();
}

async function token(req, res) {
  const params = new URLSearchParams(await readBody(req));
  const entry = codes.get(params.get('code'));
  if (!entry) return json(res, 400, { error: 'invalid_grant' });
  codes.delete(params.get('code'));

  const accessToken = randomUUID();
  tokens.set(accessToken, entry);
  json(res, 200, { access_token: accessToken, token_type: 'Bearer', expires_in: 3600, scope: 'openid email profile' });
}

function userinfo(req, res, provider) {
  const accessToken = req.headers.authorization?.replace(/^Bearer /, '');
  const entry = accessToken ? tokens.get(accessToken) : undefined;
  if (!entry || entry.provider !== provider) return json(res, 401, { error: 'invalid_token' });
  json(res, 200, {
    sub: `${provider}-${entry.profile.email}`,
    email: entry.profile.email,
    email_verified: true,
    name: entry.profile.name,
    picture: null,
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const [, first, second] = url.pathname.split('/');

  if (url.pathname === '/health') return json(res, 200, { ok: true });

  if (url.pathname === '/control' && req.method === 'POST') {
    Object.assign(state, JSON.parse(await readBody(req)));
    return json(res, 200, state);
  }

  if (first === 'client' && second === 'callback') {
    return json(res, 200, Object.fromEntries(url.searchParams));
  }

  if (first === 'google' || first === 'github') {
    if (second === 'authorize') return authorize(res, first, url);
    if (second === 'token' && req.method === 'POST') return token(req, res);
    if (second === 'userinfo') return userinfo(req, res, first);
  }

  json(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => console.log(`mock OAuth server listening on ${PORT}`));
