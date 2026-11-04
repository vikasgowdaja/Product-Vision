'use client';

import { useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';
import { prepareBrandImage, useBrandAssets } from '../lib/brand-assets';

export function BrandKit({ compact = false }: { compact?: boolean }) {
  const { assets, saveAssets } = useBrandAssets();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined, kind: 'logo' | 'image') {
    if (!file) return;
    setError(''); setBusy(true);
    try { saveAssets({ ...assets, [kind]: await prepareBrandImage(file, kind) }); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Upload failed.'); }
    finally { setBusy(false); }
  }

  function remove(kind: 'logo' | 'image') {
    try { saveAssets({ ...assets, [kind]: undefined }); setError(''); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not remove the image.'); }
  }

  return (
    <section aria-label="Brand Kit" className={compact ? 'space-y-3 py-3' : 'space-y-4 border-y border-slate-700 py-5'}>
      {!compact && <h2 className="text-sm font-semibold text-white">Brand Kit</h2>}
      <div className="grid gap-4 sm:grid-cols-2">
        {(['logo', 'image'] as const).map(kind => (
          <div key={kind} className="min-w-0 space-y-2">
            <p className="text-xs font-medium text-slate-300">{kind === 'logo' ? 'Brand logo' : 'Infographic image'}</p>
            {assets[kind] && <div className="flex min-w-0 items-center gap-2">
              <img src={assets[kind]!.dataUrl} alt={kind === 'logo' ? 'Uploaded brand logo' : 'Uploaded infographic image'} className="h-12 w-16 rounded border border-slate-600 bg-white object-contain" />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-400">{assets[kind]!.name}</span>
              <button type="button" disabled={busy} onClick={() => remove(kind)} aria-label={`Remove ${kind}`} title={`Remove ${kind}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-red-300 disabled:opacity-40">
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>}
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 ${busy ? 'pointer-events-none opacity-40' : ''}`}>
              {kind === 'logo' ? <Upload size={15} aria-hidden="true" /> : <ImagePlus size={15} aria-hidden="true" />}
              {assets[kind] ? 'Replace' : 'Upload'} {kind}
              <input type="file" aria-label={`Upload ${kind}`} accept="image/png,image/jpeg,image/webp" disabled={busy} className="sr-only"
                onChange={event => { void upload(event.target.files?.[0], kind); event.target.value = ''; }} />
            </label>
          </div>
        ))}
      </div>
      {busy && <p role="status" className="text-xs text-sky-300">Processing image...</p>}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    </section>
  );
}