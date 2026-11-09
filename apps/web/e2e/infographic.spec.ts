import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function generate(page: Page, niche: string, topic: string) {
  await page.goto('/generate');
  await page.getByRole('button', { name: niche, exact: false }).click();
  await page.getByRole('button', { name: 'Next: Choose Topic', exact: false }).click();
  await page.getByRole('button', { name: topic, exact: true }).click();
  await page.getByRole('button', { name: 'Start Generation', exact: false }).click();
  await expect(page.getByRole('checkbox', { name: 'Animation', exact: true })).toBeVisible({ timeout: 25000 });
}

test('freeform canvas connects cards and restores the edited document', async ({ page }) => {
  const topic = 'GitOps vs Traditional CI/CD';
  await generate(page, 'DevOps', topic);
  await page.getByRole('tab', { name: 'Freeform canvas' }).click();
  await expect(page.locator('article[data-node-id]')).toHaveCount(3);
  const gitopsCard = page.locator('article[data-node-id="gitops"]');
  await expect(gitopsCard).toContainText('🌿');
  await expect(gitopsCard).toHaveCSS('border-color', 'rgb(34, 197, 94)');
  await gitopsCard.click();
  await page.getByLabel('Card icon').fill('🚀');
  await page.getByLabel('Card color').fill('#ef4444');
  await expect(gitopsCard).toContainText('🚀');
  await expect(gitopsCard.locator('span span').first()).toHaveCSS('color', 'rgb(239, 68, 68)');
  await page.getByRole('button', { name: 'Add card' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Added node');

  const source = page.getByRole('button', { name: 'Connect from GitOps right' });
  const target = page.getByRole('button', { name: 'Connect from Traditional CI/CD left' });
  await source.scrollIntoViewIfNeeded();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox!.x + targetBox!.width / 2, targetBox!.y + targetBox!.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-edge-id]')).toHaveCount(3);

  const svgWaiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export SVG', exact: true }).click();
  const svgDownload = await svgWaiting;
  const svg = await readFile((await svgDownload.path())!);
  expect(svg.toString()).toContain('<svg');
  expect(svg.toString()).toContain('GitOps');
  expect(svg.toString()).toContain('🚀');
  expect(svg.toString()).toContain('#ef4444');

  const pngWaiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PNG', exact: true }).click();
  const pngDownload = await pngWaiting;
  const png = await readFile((await pngDownload.path())!);
  expect(png.subarray(1, 4).toString()).toBe('PNG');

  const gifWaiting = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Export GIF', exact: true }).click();
  const gifDownload = await gifWaiting;
  const gif = await readFile((await gifDownload.path())!);
  expect(gif.subarray(0, 6).toString()).toBe('GIF89a');
  expect(gif.readUInt16LE(6)).toBeGreaterThan(0);
  expect(gif.readUInt16LE(8)).toBeGreaterThan(0);

  await page.reload();
  await generate(page, 'DevOps', topic);
  await page.getByRole('tab', { name: 'Freeform canvas' }).click();
  await expect(page.getByText('Added node', { exact: true })).toBeVisible();
  await expect(page.locator('article[data-node-id="gitops"]')).toContainText('🚀');
  await expect(page.locator('article[data-node-id="gitops"]')).toHaveCSS('border-color', 'rgb(239, 68, 68)');
  await expect(page.locator('[data-edge-id]')).toHaveCount(3);
});

test('uploads persist and static and animated exports contain real content', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/settings');
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 96;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, 256, 96);
    context.fillStyle = '#0891b2'; context.fillRect(12, 12, 54, 72);
    context.fillStyle = '#0f172a'; context.font = 'bold 28px sans-serif'; context.fillText('ACME', 82, 58);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const file = { name: 'acme.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') };
  await page.getByLabel('Upload logo', { exact: true }).setInputFiles(file);
  await expect(page.getByAltText('Uploaded brand logo')).toBeVisible();
  await page.getByLabel('Upload image', { exact: true }).setInputFiles({ ...file, name: 'diagram.png' });
  await expect(page.getByAltText('Uploaded infographic image')).toBeVisible();
  await page.reload();
  await expect(page.getByAltText('Uploaded brand logo')).toBeVisible();
  await generate(page, 'DevOps', 'GitOps vs Traditional CI/CD');
  await expect(page.getByAltText('Brand logo', { exact: true })).toBeVisible();
  await expect(page.locator('[data-node-id="uploaded-image"] img')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Animation', exact: true })).not.toBeChecked();
  await expect(page.getByRole('button', { name: 'Export GIF', exact: true })).toBeDisabled();
  await page.getByLabel('Export resolution', { exact: true }).selectOption('720');
  for (const format of ['PNG', 'SVG']) {
    const waiting = page.waitForEvent('download', { timeout: 60000 });
    await page.getByRole('button', { name: `Download ${format}`, exact: true }).click();
    const download = await waiting;
    await download.saveAs(testInfo.outputPath(`static.${format.toLowerCase()}`));
    const bytes = await readFile((await download.path())!);
    if (format === 'PNG') {
      expect(bytes.subarray(1, 4).toString()).toBe('PNG');
      expect(bytes.readUInt32BE(16)).toBe(720);
    } else {
      expect(bytes.toString()).toContain('<svg');
      expect(bytes.toString()).toContain('GitOps vs Traditional CI/CD');
      expect(bytes.toString()).toContain('data:image/');
      expect(bytes.toString()).toContain('width="720"');
    }
  }
  await page.getByRole('checkbox', { name: 'Animation', exact: true }).check();
  await page.getByLabel('Animation preset', { exact: true }).selectOption('network');
  await expect(page.locator('[data-connector-id]')).toHaveCount(4);
  await expect.poll(async () => page.locator('[data-connector-id]').first().getAttribute('stroke-dashoffset')).not.toBe('1');
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  const before = await page.locator('[data-particle-id]').evaluateAll(elements => elements.map(element => [element.getAttribute('cx'), element.getAttribute('cy')]));
  await page.getByLabel('Speed', { exact: true }).selectOption('2');
  const after = await page.locator('[data-particle-id]').evaluateAll(elements => elements.map(element => [element.getAttribute('cx'), element.getAttribute('cy')]));
  expect(after).toEqual(before);
  await page.getByRole('button', { name: 'Play animation', exact: true }).click();
  await page.getByRole('button', { name: 'Replay animation', exact: true }).click();
  await page.getByLabel('Animation preset', { exact: true }).selectOption('flow');
  await page.getByLabel('Moving particles', { exact: true }).check();
  await page.getByLabel('Duration (s)', { exact: true }).fill('2');
  await page.getByLabel('GIF frame rate', { exact: true }).selectOption('10');
  const waiting = page.waitForEvent('download', { timeout: 90000 });
  await page.getByRole('button', { name: 'Export GIF', exact: true }).click();
  const download = await waiting;
  await download.saveAs(testInfo.outputPath('animated.gif'));
  const gif = await readFile((await download.path())!);
  expect(gif.subarray(0, 6).toString()).toBe('GIF89a');
  expect(gif.readUInt16LE(6)).toBe(720);
  const decoded = await page.evaluate(async data => {
    const decoder = new (globalThis as any).ImageDecoder({ data: new Uint8Array(data), type: 'image/gif' });
    await decoder.tracks.ready;
    await decoder.completed;
    const track = decoder.tracks.selectedTrack;
    async function hash(index: number) {
      const { image } = await decoder.decode({ frameIndex: index });
      const canvas = new OffscreenCanvas(image.displayWidth, image.displayHeight);
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      if (index === Math.floor(track.frameCount / 2)) {
        const preview = document.createElement('canvas');
        preview.id = 'decoded-gif-frame'; preview.width = canvas.width; preview.height = canvas.height;
        preview.getContext('2d')!.drawImage(image, 0, 0);
        document.body.appendChild(preview);
      }
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let checksum = 0;
      for (let offset = 0; offset < pixels.length; offset += 1) checksum = (checksum * 31 + pixels[offset]) >>> 0;
      image.close();
      return checksum;
    }
    const result = { frames: track.frameCount, infinite: !Number.isFinite(track.repetitionCount), first: await hash(0), middle: await hash(Math.floor(track.frameCount / 2)), last: await hash(track.frameCount - 1) };
    decoder.close();
    return result;
  }, Array.from(gif));
  expect(decoded.frames).toBe(10);
  expect(decoded.infinite).toBe(true);
  expect(decoded.first).not.toBe(decoded.middle);
  expect(decoded.first).toBe(decoded.last);
  await page.locator('#decoded-gif-frame').screenshot({ path: testInfo.outputPath('gif-frame.png') });
  await page.locator('#decoded-gif-frame').evaluate(element => element.remove());
  await page.locator('[data-infographic-canvas]').screenshot({ path: testInfo.outputPath('desktop-preview.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('[data-infographic-canvas]').screenshot({ path: testInfo.outputPath('mobile-preview.png') });
  expect(errors).toEqual([]);
});

test('templates share geometry, reduced motion and finite playback', async ({ page }) => {
  for (const sample of [
    { niche: 'DevOps', topic: 'Kubernetes Cost Optimization', nodes: 7 },
    { niche: 'Cloud (AWS/Azure)', topic: 'AWS vs Azure vs GCP 2026', nodes: 4 },
    { niche: 'AI Agents', topic: 'OpenAI Agents SDK Deep Dive', nodes: 7 },
  ]) {
    await generate(page, sample.niche, sample.topic);
    await expect(page.locator('[data-node-id]')).toHaveCount(sample.nodes);
    await page.getByRole('checkbox', { name: 'Animation', exact: true }).check();
    await page.getByLabel('Animation preset', { exact: true }).selectOption('presentation');
    await expect(page.locator('[data-connector-id]')).toHaveCount(sample.nodes - 1);
    await page.getByLabel('Duration (s)', { exact: true }).fill('2');
    await page.getByLabel('Speed', { exact: true }).selectOption('3');
    await page.getByText('Timeline and particles', { exact: true }).click();
    await page.getByLabel('Infinite loop', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Replay animation', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Finished' })).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByRole('status').filter({ hasText: 'Reduced motion' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play animation', exact: true })).toBeDisabled();
    expect(await page.locator('[data-node-id]').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1'))).toBe(true);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
});

test('exports cancel cleanly, preserve original dimensions and enforce size limits', async ({ page }, testInfo) => {
  await page.goto('/settings');
  await page.getByLabel('Upload logo', { exact: true }).setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') });
  await expect(page.getByRole('alert').filter({ hasText: 'Choose a PNG' })).toHaveText('Choose a PNG, JPEG, or WebP image.');
  await generate(page, 'DevOps', 'Kubernetes Cost Optimization');
  await page.getByRole('checkbox', { name: 'Animation', exact: true }).check();
  await page.getByLabel('Animation preset', { exact: true }).selectOption('pipeline');
  await page.getByRole('button', { name: 'Export GIF', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel export', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Export cancelled.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export GIF', exact: true })).toBeEnabled();
  await expect(page.locator('[aria-hidden="true"] [data-infographic-canvas]')).toHaveCount(0);
  await page.getByLabel('Duration (s)', { exact: true }).fill('4');
  await page.getByLabel('Speed', { exact: true }).selectOption('3');
  await page.getByLabel('GIF frame rate', { exact: true }).selectOption('5');
  await page.getByLabel('GIF loop duration', { exact: true }).fill('2');
  await page.getByLabel('Export resolution', { exact: true }).selectOption('0');
  await page.getByText('Timeline and particles', { exact: true }).click();
  await page.getByLabel('Infinite loop', { exact: true }).uncheck();
  await page.getByLabel('Loop count', { exact: true }).fill('2');
  const width = await page.locator('[data-infographic-canvas]').evaluate(element => (element as HTMLElement).offsetWidth);
  const waiting = page.waitForEvent('download', { timeout: 90000 });
  await page.getByRole('button', { name: 'Export GIF', exact: true }).click();
  const download = await waiting;
  await download.saveAs(testInfo.outputPath('finite-pipeline.gif'));
  const bytes = await readFile((await download.path())!);
  expect(bytes.readUInt16LE(6)).toBe(width);
  const decoded = await page.evaluate(async data => {
    const decoder = new (globalThis as any).ImageDecoder({ data: new Uint8Array(data), type: 'image/gif' });
    await decoder.tracks.ready; await decoder.completed;
    const result = { frames: decoder.tracks.selectedTrack.frameCount, repetitions: decoder.tracks.selectedTrack.repetitionCount };
    decoder.close(); return result;
  }, Array.from(bytes));
  expect(decoded).toEqual({ frames: 10, repetitions: 1 });
  await page.getByLabel('Export resolution', { exact: true }).selectOption('2160');
  await page.getByLabel('Duration (s)', { exact: true }).fill('20');
  await page.getByLabel('GIF frame rate', { exact: true }).selectOption('24');
  await page.getByLabel('GIF loop duration', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Export GIF', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'This export is too large.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export GIF', exact: true })).toBeEnabled();
});