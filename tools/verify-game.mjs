/** Semantic end-to-end release gate for the photographic desktop game. */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';

const supplied = process.argv.find(a => /^https?:/.test(a));
// Axe inspects stylesheets with XHR. Serve the exact production files over HTTP for
// this gate; the separate filecheck and package self-check enforce file:// support.
const dist = path.resolve('dist');
const server = supplied ? null : createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(dist, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(dist + path.sep)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json' }[path.extname(file)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = supplied ?? 'http://127.0.0.1:' + server.address().port;
const output = path.resolve('docs/screenshots-release');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { url, generated: new Date().toISOString(), runs: [], utilities: [], accessibility: [], issues: [] };
const viewports = process.argv.includes('--matrix')
  ? [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1440, height: 1024 }, { width: 1920, height: 1080 }, { width: 720, height: 450 }]
  : [{ width: 1440, height: 900 }];
const audited = new Set();
const onlyPolicy = process.argv.find(a => a.startsWith('--policy='))?.split('=')[1];
const utilitiesOnly = process.argv.includes('--utilities-only');
const waitForState = async page => page.locator('.gpl-game').waitFor();
const read = page => page.locator('.gpl-game').evaluate(el => ({ screen: el.dataset.screen, node: el.dataset.node, phase: el.dataset.phase }));
const key = s => [s.screen, s.node, s.phase].join(':');
/* Scenes are performed one line at a time (D-081). Play through the lines the way a player
   does — with the primary action — before acting on the screen. */
async function drain(page, keyboard) {
  for (let i = 0; i < 60; i++) {
    const next = page.locator('main [data-line-next]').first();
    if (!(await next.count())) return;
    if (keyboard) { await next.focus(); await page.keyboard.press('Enter'); } else await next.click();
  }
  throw new Error('Lines never ended');
}
async function verify(page, current, tag, screenshots) {
  await page.evaluate(() => document.fonts.ready);
  const failures = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 2,
    broken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')),
    headings: document.querySelectorAll('main h1').length,
  }));
  assert.equal(failures.overflow, false, tag + ' has horizontal overflow');
  assert.deepEqual(failures.broken, [], tag + ' broken images');
  assert.equal(failures.headings, 1, tag + ' needs one primary heading');
  /* Scoped to single text blocks. Matched against any element, the whole ending tripped it:
     "Which" in the verdict, the three indicators in the final position, and "move" in a
     timeline headline, three sections apart. A prediction question lives in one block. */
  assert.equal(await page.locator('main :is(p, h1, h2, h3, legend, label, button, li, summary)').filter({ hasText: /which.*(winability|winnability|profitability|deliverability).*move/i }).count(), 0, 'Prediction question returned');
  if (screenshots) {
    await page.evaluate(() => Promise.all([...document.images].map(i => i.decode?.().catch(() => {}))));
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(output, tag + '.png'), fullPage: true, animations: 'disabled' });
  }
  if (!audited.has(current.screen)) {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    report.accessibility.push({ screen: current.screen, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.map(n => ({ target: n.target, failure: n.failureSummary })) })) });
    audited.add(current.screen);
  }
}
async function run(viewport, policy) {
  const keyboard = policy === 'middle' || policy === 'walk';
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const prefix = viewport.width + 'x' + viewport.height + '-' + policy;
  const seen = []; const committed = []; const reloads = new Set();
  await page.goto(url); await waitForState(page);
  await verify(page, await read(page), prefix + '-welcome', viewport.width === 1440 && policy === 'first');
  await page.getByRole('button', { name: /^Begin your engagement/ }).click();
  for (let step = 0; step < 150; step++) {
    const current = await read(page); const currentKey = key(current);
    seen.push(currentKey);
    await verify(page, current, prefix + '-' + String(step).padStart(2, '0') + '-' + current.node + '-' + current.screen, viewport.width === 1440 && viewport.height === 900 && policy === 'first');
    if (current.phase === 'ending' && current.screen !== 'journey') {
      const count = await page.locator('.ending-hero').innerText();
      assert.match(count, /decisions made/);
      if (policy === 'first' && viewport.width === 1440 && viewport.height === 900) {
        const notes = ['Ask who owns the exception.', 'At the next discovery conversation.', 'An agreed owner and follow-up.'];
        const labels = ['One thing I will do differently', 'When I will try it', 'How I will know it helped'];
        for (let i = 0; i < labels.length; i++) await page.getByLabel(labels[i], { exact: true }).fill(notes[i]);
        assert(await page.locator('.reflection-record article').count() > 0, 'Saved reflections missing from debrief');
        await page.reload(); await waitForState(page);
        await page.getByRole('button', { name: /^Continue your engagement/ }).click();
        for (let i = 0; i < labels.length; i++) assert.equal(await page.getByLabel(labels[i], { exact: true }).inputValue(), notes[i], 'Plan did not survive reload');
        const downloadEvent = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download your debrief', exact: true }).click();
        const download = await downloadEvent;
        assert.equal(download.suggestedFilename(), 'gpl-engagement-debrief.txt');
        const text = await readFile(await download.path(), 'utf8');
        for (const note of notes) assert(text.includes(note), 'Export omitted plan note');
        assert(text.includes(await page.locator('.reflection-record article p').first().innerText()), 'Export omitted reflection');
        await page.locator('.action-plan').screenshot({ path: path.join(output, 'personal-action-plan.png') });
        await page.getByRole('button', { name: /^Save or restore a run/ }).first().click();
        const code = await page.getByLabel('Your current run code').inputValue();
        const before = await page.evaluate(() => localStorage.getItem('gpl.save'));
        await page.getByLabel('Enter a run code').fill(code);
        await page.getByRole('button', { name: 'Restore engagement', exact: true }).click();
        assert.equal(await page.evaluate(() => localStorage.getItem('gpl.save')), before, 'Preview changed the saved engagement');
        await verify(page, { screen: 'restore-confirmation' }, 'restore-confirmation', true);
        await page.getByRole('button', { name: 'Keep current engagement', exact: true }).click();
        assert.equal(await page.evaluate(() => localStorage.getItem('gpl.save')), before, 'Cancel changed the saved engagement');
        await page.getByRole('button', { name: 'Restore engagement', exact: true }).click();
        await page.getByRole('button', { name: 'Replace and restore', exact: true }).click();
        assert.equal(await page.locator('dialog').count(), 0, 'Successful restore left dialog open');
        assert.equal(await page.getByLabel(labels[0], { exact: true }).inputValue(), '', 'Run code unexpectedly carried private notes');
        assert.equal(await page.locator('.reflection-record article').count(), 0, 'Run code unexpectedly carried reflections');
        report.utilities.push('Plan reload/export and reflection export passed; restore preview/cancel preserve exact save; confirmed restore excludes notes');
      }
      break;
    }
    await drain(page, keyboard);
    const primary = page.locator('main [data-action="primary"]').first();
    if (current.phase === 'setup') {
      const options = page.locator('main [data-choice]');
      const option = options.nth(policy === 'last' ? (await options.count()) - 1 : policy === 'middle' ? 1 : 0);
      if (keyboard) { await option.focus(); await page.keyboard.press('Space'); } else await option.click();
    } else if (current.phase === 'decide') {
      const choices = page.locator('main [data-choice]:not(:disabled)');
      const count = await choices.count();
      const indexes = Array.from({ length: count }, (_, i) => i);
      if (policy === 'last' || (policy === 'walk' && current.node === 'm9b')) indexes.reverse();
      if (policy === 'middle') indexes.push(indexes.shift());
      for (const index of indexes) {
        if (await primary.isEnabled()) break;
        if (keyboard) { await choices.nth(index).focus(); await page.keyboard.press('Space'); } else await choices.nth(index).click();
      }
      assert.equal(await primary.isEnabled(), true, currentKey + ' cannot commit');
      // Inspecting the file and returning must leave the draft untouched.
      if (!reloads.has('drawer') && policy === 'first') {
        const selection = await page.locator('main [data-choice][aria-pressed=true]').evaluateAll(es => es.map(e => e.dataset.choice));
        await page.getByRole('button', { name: /^Review the brief/ }).click();
        assert.equal(await page.locator('dialog').evaluate(e => e.open), true);
        await page.keyboard.press('Escape');
        assert.deepEqual(await page.locator('main [data-choice][aria-pressed=true]').evaluateAll(es => es.map(e => e.dataset.choice)), selection);
        reloads.add('drawer');
      }
      committed.push(current.node);
    } else if (current.screen === 'chapter-debrief') {
      /* Reflections are asked at the act break (D-080): answer the first option of each. */
      const groups = await page.locator('main button[data-reflect]').evaluateAll(es => [...new Set(es.map(e => e.dataset.reflect))]);
      for (const id of groups) {
        const answer = page.locator('main button[data-reflect="' + id + '"]').first();
        if (keyboard) { await answer.focus(); await page.keyboard.press('Space'); } else await answer.click();
      }
    }
    // Restore every distinct lifecycle state once; the new home is deliberate.
    const reloadKey = current.screen;
    if (policy === 'first' && viewport.width === 1440 && viewport.height === 900 && !reloads.has(reloadKey)) {
      const draft = await page.locator('main [data-choice][aria-pressed=true]').evaluateAll(es => es.map(e => e.dataset.choice));
      await page.reload(); await waitForState(page);
      await page.getByRole('button', { name: /^Continue your engagement/ }).click();
      assert.equal(key(await read(page)), currentKey, 'Reload moved the player from ' + currentKey);
      assert.deepEqual(await page.locator('main [data-choice][aria-pressed=true]').evaluateAll(es => es.map(e => e.dataset.choice)), draft);
      reloads.add(reloadKey);
    }
    await drain(page, keyboard);
    if (keyboard) { await primary.focus(); await page.keyboard.press('Enter'); }
    else if (policy === 'first' && current.screen === 'chapter-open' && current.node === 'int-1') {
      await primary.dblclick();
      /* The brief and the decision are one scene now (D-080): a double-click must land on
         decision 1 and go no further. */
      await page.waitForFunction(() => document.querySelector('.gpl-game').dataset.node === 'm1');
      const landed = await read(page);
      assert.equal(landed.node + ':' + landed.phase, 'm1:decide', 'Rapid Continue skipped past the first decision');
    } else await primary.click().catch(async error => {
      const failedState = await read(page);
      console.error('Action failed at', prefix, failedState);
      await page.screenshot({ path: path.join(output, prefix + '-failure.png'), fullPage: true });
      throw error;
    });
    await page.waitForFunction(previous => { const el = document.querySelector('.gpl-game'); return [el.dataset.screen, el.dataset.node, el.dataset.phase].join(':') !== previous; }, currentKey);
    if (step === 149) throw new Error('No ending after 150 actions: ' + prefix);
  }
  assert.deepEqual(errors, [], prefix + ' browser errors');
  const final = await read(page); assert.equal(final.phase, 'ending');
  const result = { viewport, policy, input: keyboard ? 'keyboard activation' : 'pointer', screens: seen, committed, reloads: [...reloads], ending: await page.locator('main h1').innerText(), errors };
  report.runs.push(result); console.log(prefix + ': ' + committed.length + ' decisions; ' + result.ending);
  await context.close();
}
async function utilities() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url); await waitForState(page);
  for (const [name, screen] of [['How to play', 'help'], ['Preferences', 'settings'], ['Save or restore a run', 'run-code']]) {
    const trigger = page.getByRole('button', { name: new RegExp('^' + name) }).first();
    await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.locator('dialog');
    assert(await dialog.evaluate(e => e.open), screen + ' did not open');
    for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); assert(await page.evaluate(() => !!document.activeElement.closest('dialog')), 'Focus escaped ' + screen); }
    await verify(page, { screen }, 'utility-' + screen, true);
    if (screen === 'settings') {
      await page.getByRole('checkbox', { name: /Reduce motion/ }).check();
      await page.getByRole('checkbox', { name: /Larger reading text/ }).check();
    }
    if (screen === 'run-code') {
      await page.getByLabel('Enter a run code').fill('not-a-valid-code');
      await page.getByRole('button', { name: 'Restore engagement' }).click();
      assert((await dialog.locator('[role=status]').innerText()).length > 0, 'Invalid code produced no feedback');
    }
    await page.keyboard.press('Escape');
    assert.equal(await dialog.count(), 0);
    assert(await trigger.evaluate(e => e === document.activeElement), 'Focus not restored for ' + screen);
    report.utilities.push(screen + ': keyboard focus/escape/return and accessibility passed');
  }
  await page.reload(); await waitForState(page);
  assert(await page.locator('.large-reading.reduce-motion').count(), 'Preferences did not persist');
  await page.evaluate(() => localStorage.setItem('gpl.save', '{invalid'));
  await page.reload(); await waitForState(page);
  assert(await page.locator('.notice').count(), 'Corrupt save was silently ignored');
  report.utilities.push('Corrupt save disclosed; preferences persisted');
  await context.close();
  const denied = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await denied.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Unavailable', 'SecurityError'); } }));
  const offline = await denied.newPage(); await offline.goto(url); await waitForState(offline);
  await offline.getByRole('button', { name: /^Begin your engagement/ }).click();
  assert(await offline.locator('.save-warning').count(), 'Storage denial was hidden');
  await offline.locator('[data-choice]').first().click();
  await offline.locator('main [data-action=primary]').click();
  /* Without reduced motion the change runs through a view transition, which applies the new
     screen a frame later. Wait for it rather than reading the DOM in the same tick. */
  await offline.waitForFunction(() => document.querySelector('.gpl-game')?.dataset.screen === 'chapter-open', null, { timeout: 5000 }).catch(() => {});
  assert.equal((await read(offline)).screen, 'chapter-open', 'Storage denial blocked play');
  report.utilities.push('Unavailable storage visibly warned; game remains playable');
  await denied.close();
  const noImages = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await noImages.route('**/art/**', route => route.abort());
  const fallback = await noImages.newPage(); await fallback.goto(url); await waitForState(fallback);
  assert(await fallback.getByRole('heading', { name: 'Every promise has a future.' }).isVisible());
  await fallback.getByRole('button', { name: /^Begin your engagement/ }).click();
  await fallback.locator('[data-choice]').first().click();
  await fallback.locator('main [data-action=primary]').click();
  await fallback.waitForFunction(() => document.querySelector('.gpl-game')?.dataset.screen === 'chapter-open', null, { timeout: 5000 }).catch(() => {});
  assert.equal((await read(fallback)).screen, 'chapter-open');
  report.utilities.push('Image-failure fallback keeps live text and controls usable');
  await noImages.close();
}
try {
  if (!utilitiesOnly) for (let i = 0; i < viewports.length; i++) for (const policy of onlyPolicy ? [onlyPolicy] : i === 0 ? ['first', 'last', 'middle', 'walk'] : ['first']) await run(viewports[i], policy);
  await utilities();
  if (!onlyPolicy && !utilitiesOnly) assert(report.runs.some(r => r.committed.length === 18), 'No complete 18-decision run');
  const violations = report.accessibility.flatMap(a => a.violations.map(v => ({ screen: a.screen, ...v })));
  report.issues = violations;
  await writeFile(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  assert.equal(violations.length, 0, 'Accessibility violations: ' + JSON.stringify(violations, null, 2));
  console.log('Complete browser gate passed; ' + audited.size + ' screen types audited.');
} finally {
  await writeFile(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  await browser.close();
  server?.close();
}
