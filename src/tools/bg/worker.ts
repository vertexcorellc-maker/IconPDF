// Runs the background-removal model off the main thread so the page stays responsive.
import { env, pipeline, RawImage } from '@huggingface/transformers';

env.allowLocalModels = false;

interface Tier {
  id: 'gpu' | 'cpu';
  model: string;
  device: 'webgpu' | 'wasm';
  dtype: 'fp16' | 'q8';
}

// ormbg is Apache-2.0, so it is safe for commercial use.
// BiRefNet_lite (MIT) gives finer edges but exceeds WebGPU's storage-buffer limit on
// common graphics cards, so it is not used here.
const GPU_TIER: Tier = {
  id: 'gpu',
  model: 'onnx-community/ormbg-ONNX',
  device: 'webgpu',
  dtype: 'fp16',
};
const CPU_TIER: Tier = {
  id: 'cpu',
  model: 'onnx-community/ormbg-ONNX',
  device: 'wasm',
  dtype: 'q8',
};

const post = (msg: unknown, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(msg, transfer);

let remover: any = null;
let active: Tier | null = null;

async function gpuUsable(): Promise<boolean> {
  try {
    const gpu = (navigator as any).gpu;
    if (!gpu) return false;
    const adapter = await gpu.requestAdapter();
    return !!adapter && adapter.features.has('shader-f16');
  } catch {
    return false;
  }
}

async function load(tier: Tier) {
  post({ type: 'status', stage: 'model', tier: tier.id });
  remover = await pipeline('background-removal', tier.model, {
    device: tier.device,
    dtype: tier.dtype,
    progress_callback: (p: any) => {
      if (p.status === 'progress' && typeof p.file === 'string' && p.file.endsWith('.onnx')) {
        post({ type: 'progress', loaded: p.loaded, total: p.total });
      }
    },
  } as any);
  active = tier;
}

async function ensureLoaded(forceCpu: boolean) {
  if (remover) return;
  await load(!forceCpu && (await gpuUsable()) ? GPU_TIER : CPU_TIER);
}

self.onmessage = async (e: MessageEvent<{ blob: Blob; forceCpu?: boolean }>) => {
  try {
    const image = await RawImage.fromBlob(e.data.blob);
    let out;
    try {
      await ensureLoaded(!!e.data.forceCpu);
      post({ type: 'status', stage: 'run', tier: active!.id });
      out = await remover(image);
    } catch (err) {
      if (e.data.forceCpu || active === CPU_TIER) throw err;
      // A failed GPU session can leave the runtime in a bad state, so ask the page
      // to restart this worker in CPU-only mode rather than retrying here.
      console.warn('GPU path failed, restarting on CPU', err);
      post({ type: 'retry-cpu' });
      return;
    }
    const result: RawImage = Array.isArray(out) ? out[0] : out;
    const rgba = result.channels === 4 ? result : result.rgba();
    const data = new Uint8ClampedArray(rgba.data);
    post(
      { type: 'done', width: rgba.width, height: rgba.height, data: data.buffer, tier: active!.id },
      [data.buffer]
    );
  } catch (err: any) {
    post({ type: 'error', message: String(err?.message ?? err) });
  }
};
