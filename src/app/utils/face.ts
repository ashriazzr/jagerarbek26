import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let modelPromise: Promise<void> | null = null;

export const loadFaceModels = () => {
  if (!modelPromise) {
    modelPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).then(() => undefined);
  }

  return modelPromise;
};

export const captureFaceDescriptor = async (
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
) => {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection?.descriptor ? Array.from(detection.descriptor) : null;
};

export const faceDescriptorDistance = (a: number[], b: number[]) => {
  const length = Math.min(a.length, b.length);
  if (length === 0) return Number.POSITIVE_INFINITY;

  let total = 0;
  for (let index = 0; index < length; index += 1) {
    const delta = a[index] - b[index];
    total += delta * delta;
  }

  return Math.sqrt(total);
};

export const findBestFaceMatch = (
  descriptor: number[],
  candidates: Array<{ id: string; name: string; class: string; nisn: string; faceDescriptor?: number[] | null }>,
  threshold = 0.5,
) => {
  const ranked = candidates
    .filter((candidate) => Array.isArray(candidate.faceDescriptor) && candidate.faceDescriptor.length > 0)
    .map((candidate) => ({
      ...candidate,
      distance: faceDescriptorDistance(descriptor, candidate.faceDescriptor as number[]),
    }))
    .sort((left, right) => left.distance - right.distance);

  const best = ranked[0];
  if (!best || best.distance > threshold) {
    return null;
  }

  return best;
};