import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyAdminRequest } from '@/lib/admin-auth';
import ffmpegStatic from 'ffmpeg-static';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, readFileSync, mkdirSync, rmSync, createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const runtime = 'nodejs';
export const maxDuration = 60; // spike: allow up to 60s

const execFileP = promisify(execFile);

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`download failed ${res.status}`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

function ts(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}`;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const dir = path.join(os.tmpdir(), `vtt-spike-${id}`);
  mkdirSync(dir, { recursive: true });

  try {
    const { videoUrl, interval, tile } = await req.json();
    if (!videoUrl) return NextResponse.json({ error: 'missing videoUrl' }, { status: 400 });
    const INTERVAL = interval || 5;
    const TILE_W = tile || 320;
    const TILE_H = Math.round((TILE_W * 9) / 16);
    const COLS = 5;

    const t0 = Date.now();
    const srcPath = path.join(dir, 'src.mp4');
    await download(videoUrl, srcPath);
    const tDownload = Date.now();

    const probe = await execFileP(ffmpegStatic!, ['-i', srcPath, '-f', 'null', '-']);
    const m = (probe.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/) || []);
    const dur = m.length ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : null;
    const tProbe = Date.now();

    const vf = `fps=1/${INTERVAL},scale=${TILE_W}:${TILE_H}:force_original_aspect_ratio=decrease,pad=${TILE_W}:${TILE_H}:(ow-iw)/2:(oh-ih)/2,tile=${COLS}x10`;
    await execFileP(ffmpegStatic!, ['-y', '-i', srcPath, '-vf', vf, '-frames:v', '1', '-q:v', '5', path.join(dir, 'sprite.jpg')], { maxBuffer: 1024 * 1024 * 60 });
    const tSprite = Date.now();

    const frames = dur ? Math.max(1, Math.ceil(dur / INTERVAL)) : 1;
    let vtt = 'WEBVTT\n\n';
    for (let i = 0; i < frames; i++) {
      const st = i * INTERVAL;
      const en = Math.min((i + 1) * INTERVAL, dur ?? (i + 1) * INTERVAL);
      const x = (i % COLS) * TILE_W;
      const y = Math.floor(i / COLS) * TILE_H;
      vtt += `${ts(st)} --> ${ts(en)}\nsprite.jpg#xywh=${x},${y},${TILE_W},${TILE_H}\n\n`;
    }
    const vttPath = path.join(dir, 'sprite.vtt');
    writeFileSync(vttPath, vtt);
    const tVtt = Date.now();

    const base = `vercel-blob/vtt-spike/${id}`;
    const spriteBlob = await put(`${base}/sprite.jpg`, readFileSync(path.join(dir, 'sprite.jpg')), {
      access: 'public',
      contentType: 'image/jpeg',
    });
    const vttBlob = await put(`${base}/sprite.vtt`, readFileSync(vttPath), {
      access: 'public',
      contentType: 'text/vtt; charset=utf-8',
    });
    const tUpload = Date.now();

    return NextResponse.json({
      ok: true,
      ms: {
        download: tDownload - t0,
        probe: tProbe - tDownload,
        sprite: tSprite - tProbe,
        vtt: tVtt - tSprite,
        upload: tUpload - tVtt,
        total: tUpload - t0,
      },
      duration: dur,
      frames,
      tile: { w: TILE_W, h: TILE_H },
      spriteUrl: spriteBlob.url,
      vttUrl: vttBlob.url,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}
