'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Film, Pause, Play, RotateCcw, Square, X } from 'lucide-react';
import { DEFAULT_ANIMATION, PRESETS, applyPreset, playbackTime, type AnimationConfig, type AnimationPreset } from '../lib/infographic-animation';
import { measureScene, type DomScene } from '../lib/infographic-dom';
import type { ExportProgress } from '../lib/infographic-export';
import { BrandKit } from './brand-kit';

const INPUT = 'min-w-0 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400';
const BUTTON = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40';

export function InfographicAnimationEditor({ children, layout, topic }: { children: ReactNode; layout: string; topic: string }) {
  const [config, setConfig] = useState<AnimationConfig>(DEFAULT_ANIMATION);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [resolution, setResolution] = useState(1080);
  const [fps, setFps] = useState(12);
  const [colors, setColors] = useState(128);
  const [gifLoopDuration, setGifLoopDuration] = useState(DEFAULT_ANIMATION.duration);
  const wrapper = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DomScene | null>(null);
  const configRef = useRef(config);
  const elapsed = useRef(0);
  const seek = useRef<HTMLInputElement>(null);
  const clock = useRef<HTMLOutputElement>(null);
  const abort = useRef<AbortController | null>(null);
  configRef.current = config;

  function update<Key extends keyof AnimationConfig>(key: Key, value: AnimationConfig[Key]) {
    setConfig(current => ({ ...current, [key]: value }));
  }

  function showPosition(time: number) {
    if (seek.current) seek.current.value = `${time}`;
    if (clock.current) clock.current.textContent = `${time.toFixed(1)} / ${configRef.current.duration.toFixed(1)}s`;
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);
    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const root = wrapper.current?.querySelector<HTMLElement>('[data-infographic-canvas]');
    if (!root) return;
    let active = true;
    let previousSize = '';
    function rebuild() {
      if (!active || !root) return;
      const size = `${root.offsetWidth}:${root.offsetHeight}`;
      if (size === previousSize && sceneRef.current) return;
      previousSize = size;
      abort.current?.abort();
      sceneRef.current?.dispose();
      sceneRef.current = measureScene(root, layout, configRef.current);
      sceneRef.current.paint(playbackTime(elapsed.current, { ...configRef.current, speed: 1 }).time, configRef.current);
      setReady(true);
    }
    rebuild();
    const observer = new ResizeObserver(rebuild);
    observer.observe(root);
    return () => {
      active = false; observer.disconnect(); abort.current?.abort();
      sceneRef.current?.dispose(); sceneRef.current = null;
    };
  }, [layout, topic, config.preset, config.particleCount, config.particleSize, config.particleColor]);

  useEffect(() => {
    elapsed.current = 0;
    setFinished(false);
    setPlaying(config.enabled && !reducedMotion);
    sceneRef.current?.paint(0, { ...configRef.current, enabled: config.enabled && !reducedMotion });
  }, [config.enabled, config.preset, reducedMotion]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!playing || !config.enabled || reducedMotion || busy) {
      const time = playbackTime(elapsed.current, { ...configRef.current, speed: 1 }).time;
      scene?.paint(time, { ...configRef.current, enabled: config.enabled && !reducedMotion });
      showPosition(time);
      return;
    }
    let frameId = 0;
    let last = performance.now();
    function tick(now: number) {
      const current = configRef.current;
      elapsed.current += Math.min(0.25, Math.max(0, now - last) / 1000) * current.speed;
      last = now;
      const position = playbackTime(elapsed.current, { ...current, speed: 1 });
      sceneRef.current?.paint(position.time, current);
      showPosition(position.time);
      if (position.finished) { setPlaying(false); setFinished(true); return; }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [playing, config, reducedMotion, busy]);

  function replay() {
    elapsed.current = 0;
    setFinished(false);
    sceneRef.current?.paint(0, configRef.current);
    showPosition(0);
    setPlaying(true);
  }

  async function exportFile(format: 'gif' | 'png' | 'svg') {
    const root = wrapper.current?.querySelector<HTMLElement>('[data-infographic-canvas]');
    const scene = sceneRef.current;
    if (!root || !scene) return;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true); setPlaying(false); setError(''); setMessage('');
    setProgress({ stage: 'Preparing export', progress: 0 });
    try {
      const { exportGif, exportStatic, downloadBlob } = await import('../lib/infographic-export');
      const blob = format === 'gif'
        ? await exportGif(root, scene, configRef.current, { width: resolution, fps, colors, loopDuration: gifLoopDuration }, controller.signal, setProgress)
        : await exportStatic(root, scene, configRef.current, format, resolution);
      if (controller.signal.aborted) throw new DOMException('Export cancelled.', 'AbortError');
      if (blob.size > 50 * 1024 * 1024) throw new Error('The file exceeds 50 MB. Lower resolution or frame rate and try again.');
      downloadBlob(blob, `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) || 'infographic'}.${format}`);
      setMessage(`${format.toUpperCase()} ready (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
    } catch (failure) {
      if (failure instanceof DOMException && failure.name === 'AbortError') setMessage('Export cancelled.');
      else setError(failure instanceof Error ? failure.message : 'Export failed. Try a lower resolution.');
    } finally {
      if (abort.current === controller) {
        abort.current = null; setBusy(false); setProgress(null);
        sceneRef.current?.paint(playbackTime(elapsed.current, { ...configRef.current, speed: 1 }).time, { ...configRef.current, enabled: configRef.current.enabled && !reducedMotion });
      }
    }
  }

  function numeric(label: string, key: 'duration' | 'delay' | 'elementDuration' | 'stagger' | 'loops' | 'particleCount' | 'particleSize' | 'particleSpeed', min: number, max: number, step = 1) {
    return <label className="min-w-0 space-y-1 text-xs text-slate-400">{label}
      <input aria-label={label} type="number" min={min} max={max} step={step} value={config[key]} className={INPUT}
        onChange={event => update(key, Math.min(max, Math.max(min, step === 1 ? Math.round(Number(event.target.value)) : Number(event.target.value))))} />
    </label>;
  }

  function toggle(label: string, key: 'lines' | 'particles' | 'reveal' | 'pulse' | 'border' | 'reverse' | 'infinite') {
    return <label className="flex items-center gap-2 text-xs text-slate-300">
      <input type="checkbox" checked={config[key]} onChange={event => {
        const checked = event.target.checked;
        setConfig(current => ({ ...current, [key]: checked, ...(key === 'reveal' && checked ? { startState: 'hidden' as const, endState: current.infinite ? 'fade' as const : 'hold' as const } : {}) }));
      }} className="accent-sky-400" />{label}
    </label>;
  }

  return <div className="min-w-0 space-y-4">
    <fieldset disabled={busy} className="min-w-0 space-y-3 border-b border-slate-700 pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <input type="checkbox" checked={config.enabled} onChange={event => update('enabled', event.target.checked)} className="accent-sky-400" />Animation
        </label>
        <select aria-label="Animation preset" value={config.preset} disabled={!config.enabled} className={`${INPUT} !w-auto max-w-full`}
          onChange={event => setConfig(current => {
            const next = applyPreset(current, event.target.value as AnimationPreset);
            return { ...next, startState: next.reveal ? 'hidden' : 'visible', endState: next.reveal && next.infinite ? 'fade' : 'hold' };
          })}>
          {PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <button type="button" disabled={!config.enabled || reducedMotion || !ready} className={BUTTON}
            onClick={() => finished ? replay() : setPlaying(value => !value)} aria-label={playing ? 'Pause animation' : 'Play animation'} title={playing ? 'Pause animation' : 'Play animation'}>
            {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
          </button>
          <button type="button" disabled={!config.enabled || reducedMotion || !ready} onClick={replay} className={BUTTON} aria-label="Replay animation" title="Replay animation"><RotateCcw size={15} aria-hidden="true" /></button>
          <button type="button" disabled={!config.enabled || reducedMotion || !ready} onClick={() => { setPlaying(false); elapsed.current = 0; sceneRef.current?.paint(0, config); showPosition(0); }} className={BUTTON} aria-label="Stop animation" title="Stop animation"><Square size={14} aria-hidden="true" /></button>
        </div>
        <span role="status" className="text-xs text-slate-400">{reducedMotion ? 'Reduced motion' : !config.enabled ? 'Static' : finished ? 'Finished' : playing ? 'Playing' : 'Paused'}</span>
      </div>
      {config.enabled && <>
        <div className="flex items-center gap-3">
          <input ref={seek} aria-label="Animation position" type="range" min="0" max={config.duration} step="0.01" defaultValue="0" className="min-w-0 flex-1 accent-sky-400"
            onChange={event => { elapsed.current = Number(event.target.value); setPlaying(false); setFinished(false); sceneRef.current?.paint(elapsed.current, { ...config, enabled: !reducedMotion }); showPosition(elapsed.current); }} />
          <output ref={clock} className="w-24 shrink-0 text-right text-xs tabular-nums text-slate-400">0.0 / {config.duration.toFixed(1)}s</output>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">{toggle('Draw lines', 'lines')}{toggle('Moving particles', 'particles')}{toggle('Reveal nodes', 'reveal')}{toggle('Pulse nodes', 'pulse')}{toggle('Draw borders', 'border')}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-xs text-slate-400">Execution<select aria-label="Execution" value={config.execution} onChange={event => update('execution', event.target.value as AnimationConfig['execution'])} className={INPUT}><option value="sequential">Sequential</option><option value="parallel">Parallel branches</option></select></label>
          {numeric('Duration (s)', 'duration', 2, 20, 0.5)}
          <label className="space-y-1 text-xs text-slate-400">Speed<select aria-label="Speed" value={config.speed} onChange={event => update('speed', Number(event.target.value))} className={INPUT}>{[0.25, 0.5, 1, 1.5, 2, 3].map(value => <option key={value} value={value}>{value}x</option>)}</select></label>
        </div>
        <details className="border-t border-slate-800 pt-2">
          <summary className="cursor-pointer text-xs text-slate-400">Timeline and particles</summary>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {numeric('Initial delay (s)', 'delay', 0, 5, 0.1)}{numeric('Element duration (s)', 'elementDuration', 0.1, 3, 0.1)}{numeric('Stagger (s)', 'stagger', 0, 2, 0.05)}
            {numeric('Particle count', 'particleCount', 1, 8)}{numeric('Particle size', 'particleSize', 1, 6, 0.5)}{numeric('Particle speed', 'particleSpeed', 0.25, 4, 0.25)}
            <label className="space-y-1 text-xs text-slate-400">Particle color<input type="color" aria-label="Particle color" value={config.particleColor} onChange={event => update('particleColor', event.target.value)} className="block h-8 w-full cursor-pointer rounded border border-slate-600 bg-transparent" /></label>
            <label className="space-y-1 text-xs text-slate-400">Start state<select aria-label="Start state" value={config.startState} onChange={event => update('startState', event.target.value as AnimationConfig['startState'])} className={INPUT}><option value="visible">Visible</option><option value="hidden">Hidden nodes</option></select></label>
            <label className="space-y-1 text-xs text-slate-400">End state<select aria-label="End state" value={config.endState} onChange={event => update('endState', event.target.value as AnimationConfig['endState'])} className={INPUT}><option value="hold">Hold</option><option value="fade">Fade to start</option></select></label>
            {numeric('Loop count', 'loops', 1, 100)}
          </div>
          <div className="mt-3 flex flex-wrap gap-4">{toggle('Infinite loop', 'infinite')}{toggle('Reverse particles', 'reverse')}</div>
        </details>
      </>}
    </fieldset>
    <div ref={wrapper}>{children}</div>
    <fieldset disabled={busy} className="min-w-0 border-y border-slate-800 py-1">
      <details><summary className="cursor-pointer py-2 text-xs text-slate-400">Logo and images</summary><BrandKit compact /></details>
    </fieldset>
    <fieldset disabled={busy} className="min-w-0 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs text-slate-400">Resolution<select aria-label="Export resolution" value={resolution} onChange={event => setResolution(Number(event.target.value))} className={INPUT}>{[0, 720, 1080, 1440, 2160].map(value => <option key={value} value={value}>{value ? `${value}px wide` : 'Original dimensions'}</option>)}</select></label>
        <label className="space-y-1 text-xs text-slate-400">Frame rate<select aria-label="GIF frame rate" value={fps} onChange={event => setFps(Number(event.target.value))} className={INPUT}>{[5, 8, 10, 12, 15, 20, 24].map(value => <option key={value} value={value}>{value} fps</option>)}</select></label>
        <label className="space-y-1 text-xs text-slate-400">GIF quality<select aria-label="GIF quality" value={colors} onChange={event => setColors(Number(event.target.value))} className={INPUT}><option value="64">Compact (64 colors)</option><option value="128">Balanced (128 colors)</option><option value="256">High (256 colors)</option></select></label>
        <label className="space-y-1 text-xs text-slate-400">GIF loop duration (s)<input aria-label="GIF loop duration" type="number" min="0.25" max="60" step="0.25" value={gifLoopDuration} onChange={event => setGifLoopDuration(Math.min(60, Math.max(0.25, Number(event.target.value))))} className={INPUT} /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!ready} className={BUTTON} onClick={() => void exportFile('png')}><Download size={15} aria-hidden="true" />Download PNG</button>
        <button type="button" disabled={!ready} className={BUTTON} onClick={() => void exportFile('svg')}><Download size={15} aria-hidden="true" />Download SVG</button>
        <button type="button" disabled={!ready || !config.enabled} className={`${BUTTON} !border-sky-600 !text-sky-200`} onClick={() => void exportFile('gif')}><Film size={15} aria-hidden="true" />Export GIF</button>
      </div>
    </fieldset>
    {progress && <div className="space-y-2" role="status">
      <div className="flex items-center justify-between gap-2 text-xs text-sky-300"><span>{progress.stage} {Math.round(progress.progress * 100)}%</span><button type="button" onClick={() => abort.current?.abort()} className={BUTTON}><X size={14} aria-hidden="true" />Cancel export</button></div>
      <progress aria-label="Export progress" value={progress.progress} max="1" className="h-1 w-full accent-sky-400" />
    </div>}
    {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
    {message && <p role="status" className="text-xs text-emerald-300">{message}</p>}
  </div>;
}