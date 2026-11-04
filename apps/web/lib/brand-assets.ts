'use client';

import { useEffect, useState } from 'react';

export interface BrandImage { name: string; dataUrl: string }
export interface BrandAssets { logo?: BrandImage; image?: BrandImage }
const STORAGE_KEY = 'infograph-ai-brand-assets-v1';
const CHANGE_EVENT = 'infograph-ai-brand-change';

function loadAssets(): BrandAssets {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const valid = (asset: unknown): asset is BrandImage => Boolean(asset && typeof asset === 'object' && 'dataUrl' in asset && typeof asset.dataUrl === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(asset.dataUrl) && 'name' in asset && typeof asset.name === 'string');
    return { logo: valid(value?.logo) ? value.logo : undefined, image: valid(value?.image) ? value.image : undefined };
  } catch { return {}; }
}

export function useBrandAssets() {
  const [assets, setAssets] = useState<BrandAssets>({});
  useEffect(() => {
    const update = () => setAssets(loadAssets());
    update();
    window.addEventListener('storage', update);
    window.addEventListener(CHANGE_EVENT, update);
    return () => { window.removeEventListener('storage', update); window.removeEventListener(CHANGE_EVENT, update); };
  }, []);
  function saveAssets(next: BrandAssets) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error('Browser storage is full or unavailable. Remove an image or use a smaller file.'); }
    setAssets(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return { assets, saveAssets };
}

export async function prepareBrandImage(file: File, kind: 'logo' | 'image'): Promise<BrandImage> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be smaller than 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 20000000) throw new Error('Image dimensions are too large. Use an image under 20 megapixels.');
    const ratio = Math.min(1, (kind === 'logo' ? 512 : 1080) / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is not available in this browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(kind === 'logo' ? 'image/png' : 'image/webp', 0.9);
    if (dataUrl.length > 1800000) throw new Error('This image is too detailed for local storage. Choose a smaller image.');
    return { name: file.name, dataUrl };
  } catch (error) {
    if (error instanceof Error && error.name !== 'EncodingError') throw error;
    throw new Error('This image could not be decoded. Try a different PNG or JPEG.');
  } finally { URL.revokeObjectURL(url); }
}