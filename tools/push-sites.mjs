/** One-shot source push. Credential arrives on stdin and is never written to disk. */
import { createInterface } from 'node:readline';
import { spawn } from 'node:child_process';
const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
input.once('line', line => {
  input.close(); process.stdin.pause();
  let credential;
  try { credential = JSON.parse(line); } catch { console.error('Invalid credential input'); process.exit(1); }
  if (credential.auth_mode !== 'http_extra_header' || !credential.token || !credential.remote_url?.startsWith('https://') || !/^[a-zA-Z0-9._/-]+$/.test(credential.branch)) {
    console.error('Unsupported source credential'); process.exit(1);
  }
  const child = spawn('git', ['push', credential.remote_url, 'HEAD:refs/heads/' + credential.branch], {
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.extraHeader', GIT_CONFIG_VALUE_0: 'Authorization: Bearer ' + credential.token },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let output = '';
  child.stdout.on('data', data => { output += data; });
  child.stderr.on('data', data => { output += data; });
  child.on('error', () => { console.error('Could not start Git'); process.exitCode = 1; });
  child.on('close', code => { console.log(output.replaceAll(credential.token, '[REDACTED]').trim()); process.exitCode = code ?? 1; });
});
