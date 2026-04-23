import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs'
import { Buffer } from 'buffer'
import { CameraView } from 'expo-camera'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import * as jpeg from 'jpeg-js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isCaptureFrameBusy } from '../engine/useEngineUtils'

type Direction = 'left' | 'right' | 'up' | 'down' | 'centered'

interface GuideBox {
  x: number
  y: number
  width: number
  height: number
}

interface UseObjectCenterGuideArgs {
  cameraRef: React.RefObject<CameraView | null>
  active: boolean
  cameraReady?: boolean
  intervalMs?: number
}

interface UseObjectCenterGuideResult {
  ready: boolean
  running: boolean
  label: string | null
  score: number
  direction: Direction
  instruction: string
  centered: boolean
  box: GuideBox | null
  error: string | null
}

let tfReadyPromise: Promise<void> | null = null
let detectorPromise: Promise<cocoSsd.ObjectDetection> | null = null
let detectorInstance: cocoSsd.ObjectDetection | null = null
const MIN_SCORE = 0.45
const CENTER_THRESHOLD = 0.08
const STICKINESS_BONUS = 0.2
const COCO_MODEL_URL = 'https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/model.json'
const COCO_MODEL_URL_FALLBACK = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/model.json'
const MODEL_LOAD_TIMEOUT_MS = 15000
const TF_INIT_TIMEOUT_MS = 10000

function ensureTfPlatform() {
  const env = tf.env() as unknown as {
    platform?: { fetch?: typeof fetch }
    setPlatform: (
      name: string,
      platform: {
        fetch: typeof fetch
        now: () => number
        encode: (text: string, encoding: BufferEncoding) => Uint8Array
        decode: (bytes: Uint8Array, encoding: BufferEncoding) => string
      },
    ) => void
  }

  if (env.platform?.fetch) {
    return
  }

  if (typeof globalThis.fetch !== 'function') {
    throw new Error('global fetch is not available in this runtime')
  }

  const safeEncode = (text: string): Uint8Array => {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text)
    return Uint8Array.from(Buffer.from(text, 'utf-8'))
  }

  const safeDecode = (bytes: Uint8Array): string => {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes)
    return Buffer.from(bytes).toString('utf-8')
  }

  env.setPlatform('react-native', {
    fetch: globalThis.fetch.bind(globalThis),
    now: () => Date.now(),
    encode: (text) => safeEncode(text),
    decode: (bytes) => safeDecode(bytes),
  })
}

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(base64, 'base64'))
}

function decodeJpegToTensor(base64: string): tf.Tensor3D {
  const bytes = base64ToBytes(base64)
  const decoded = jpeg.decode(bytes, { useTArray: true })
  const { width, height, data } = decoded
  const rgb = new Uint8Array(width * height * 3)

  for (let src = 0, dst = 0; src < data.length; src += 4) {
    rgb[dst++] = data[src]
    rgb[dst++] = data[src + 1]
    rgb[dst++] = data[src + 2]
  }

  return tf.tensor3d(rgb, [height, width, 3], 'int32')
}

function detectMainRegion(base64: string): NormalizedBox | null {
  const decoded = jpeg.decode(base64ToBytes(base64), { useTArray: true })
  const { width, height, data } = decoded
  if (!width || !height || !data?.length) return null

  // Fast luminance-based saliency estimate as fallback when model is unavailable.
  const step = 4
  let lumSum = 0
  let samples = 0
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      lumSum += lum
      samples += 1
    }
  }
  if (!samples) return null
  const mean = lumSum / samples
  const threshold = 20

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let activePixels = 0

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      if (Math.abs(lum - mean) > threshold) {
        activePixels += 1
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }

  if (activePixels < 30 || maxX <= minX || maxY <= minY) return null
  return {
    x: minX / width,
    y: minY / height,
    width: (maxX - minX) / width,
    height: (maxY - minY) / height,
  }
}

async function getDetector() {
  if (!tfReadyPromise) {
    tfReadyPromise = withTimeout((async () => {
      ensureTfPlatform()
      await tf.ready()
      await tf.setBackend('cpu')
    })(), TF_INIT_TIMEOUT_MS, 'TensorFlow init timed out')
  }
  await tfReadyPromise

  if (!detectorPromise) {
    detectorPromise = (async () => {
      const primary = withTimeout(
        cocoSsd.load({
          base: 'lite_mobilenet_v2',
          modelUrl: COCO_MODEL_URL,
        }),
        MODEL_LOAD_TIMEOUT_MS,
        'Primary model URL timed out',
      )

      try {
        const loaded = await primary
        detectorInstance = loaded
        return loaded
      } catch (primaryErr) {
        console.warn('[ObjectCenterGuide] primary model load failed, trying fallback URL')
        const loaded = await withTimeout(
          cocoSsd.load({
            base: 'lite_mobilenet_v2',
            modelUrl: COCO_MODEL_URL_FALLBACK,
          }),
          MODEL_LOAD_TIMEOUT_MS,
          `Fallback model URL timed out (${String(primaryErr)})`,
        )
        detectorInstance = loaded
        return loaded
      }
    })()
  }
  return detectorPromise
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function getDirection(objectCenterX: number, objectCenterY: number): Direction {
  const deltaX = objectCenterX - 0.5
  const deltaY = objectCenterY - 0.5

  const xCentered = Math.abs(deltaX) <= CENTER_THRESHOLD
  const yCentered = Math.abs(deltaY) <= CENTER_THRESHOLD
  if (xCentered && yCentered) return 'centered'

  if (!xCentered) {
    return deltaX < 0 ? 'right' : 'left'
  }
  return deltaY < 0 ? 'down' : 'up'
}

function directionToInstruction(direction: Direction): string {
  switch (direction) {
    case 'left':
      return 'Move camera left'
    case 'right':
      return 'Move camera right'
    case 'up':
      return 'Move camera up'
    case 'down':
      return 'Move camera down'
    default:
      return 'Great! Object is centered'
  }
}

type NormalizedBox = GuideBox

function bboxToNormalized(bbox: number[], imageWidth: number, imageHeight: number): NormalizedBox {
  const [x, y, width, height] = bbox
  return {
    x: x / imageWidth,
    y: y / imageHeight,
    width: width / imageWidth,
    height: height / imageHeight,
  }
}

function boxArea(box: NormalizedBox): number {
  return Math.max(0, box.width) * Math.max(0, box.height)
}

function boxCenterDistance(box: NormalizedBox): number {
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const dx = cx - 0.5
  const dy = cy - 0.5
  return Math.sqrt(dx * dx + dy * dy)
}

function intersectionOverUnion(a: NormalizedBox, b: NormalizedBox): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  if (intersection <= 0) return 0

  const union = boxArea(a) + boxArea(b) - intersection
  if (union <= 0) return 0
  return intersection / union
}

function selectMainPrediction(
  predictions: cocoSsd.DetectedObject[],
  imageWidth: number,
  imageHeight: number,
  previousClass: string | null,
  previousBox: NormalizedBox | null,
) {
  const candidates = predictions.filter((prediction) => prediction.score >= MIN_SCORE)
  if (!candidates.length) return null

  let best: cocoSsd.DetectedObject | null = null
  let bestScore = -Infinity

  for (const candidate of candidates) {
    const normalized = bboxToNormalized(candidate.bbox, imageWidth, imageHeight)
    const areaScore = Math.min(boxArea(normalized) * 2.2, 1)
    const confidenceScore = candidate.score
    const centerScore = 1 - Math.min(boxCenterDistance(normalized), 1)

    let trackScore = 0
    if (previousClass && previousClass === candidate.class) {
      trackScore += STICKINESS_BONUS
    }
    if (previousBox) {
      trackScore += intersectionOverUnion(previousBox, normalized) * 0.35
    }

    const weighted = confidenceScore * 0.45 + areaScore * 0.3 + centerScore * 0.25 + trackScore
    if (weighted > bestScore) {
      bestScore = weighted
      best = candidate
    }
  }

  return best
}

export function useObjectCenterGuide({
  cameraRef,
  active,
  cameraReady = true,
  intervalMs = 1400,
}: UseObjectCenterGuideArgs): UseObjectCenterGuideResult {
  const [ready, setReady] = useState(true)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [direction, setDirection] = useState<Direction>('centered')
  const [box, setBox] = useState<GuideBox | null>(null)
  const [error, setError] = useState<string | null>(null)
  const trackedClassRef = useRef<string | null>(null)
  const trackedBoxRef = useRef<NormalizedBox | null>(null)
  const lastDirectionRef = useRef<Direction>('centered')
  const currentDirectionRef = useRef<Direction>('centered')
  const stableDirectionCountRef = useRef(0)
  const busyRef = useRef(false)
  const consecutiveCaptureFailuresRef = useRef(0)
  const modelLoadedRef = useRef(false)
  const modelInitStartedRef = useRef(false)
  const debugFrameCountRef = useRef(0)

  useEffect(() => {
    currentDirectionRef.current = direction
  }, [direction])

  useEffect(() => {
    if (modelInitStartedRef.current) return
    modelInitStartedRef.current = true

    let cancelled = false
    console.log('[ObjectCenterGuide] init start')
    getDetector()
      .then(() => {
        if (!cancelled) {
          setError(null)
          setReady(true)
          modelLoadedRef.current = true
          console.log('[ObjectCenterGuide] init success, model ready')
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Detector failed to load'
          console.warn('[ObjectCenterGuide] detector init failed:', message)
          detectorPromise = null
          detectorInstance = null
          setReady(true)
          setError(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!active || !ready || !cameraReady) {
      setRunning(false)
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const scheduleNext = (delayMs: number) => {
      if (cancelled) return
      timer = setTimeout(run, delayMs)
    }

    const run = async () => {
      if (cancelled || busyRef.current || !cameraRef.current) return
      if (isCaptureFrameBusy()) {
        scheduleNext(Math.max(300, Math.floor(intervalMs / 2)))
        return
      }
      busyRef.current = true
      setRunning(true)

      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.4,
          skipProcessing: true,
        })

        if (!photo?.uri) {
          throw new Error('Camera returned empty frame')
        }

        const resized = await manipulateAsync(
          photo.uri,
          [{ resize: { width: 320 } }],
          { compress: 0.55, format: SaveFormat.JPEG, base64: true },
        )

        if (!resized.base64) return

        let best: cocoSsd.DetectedObject | null = null
        let normalizedBox: NormalizedBox | null = null
        let derivedLabel: string | null = null
        let derivedScore = 0

        if (modelLoadedRef.current && detectorInstance) {
          const imageTensor = decodeJpegToTensor(resized.base64)
          const predictions = await detectorInstance.detect(imageTensor as tf.Tensor3D)
          imageTensor.dispose()

          if (predictions.length) {
            best = selectMainPrediction(
              predictions,
              resized.width,
              resized.height,
              trackedClassRef.current,
              trackedBoxRef.current,
            )
          }
        }

        if (best) {
          normalizedBox = bboxToNormalized(best.bbox, resized.width, resized.height)
          derivedLabel = best.class
          derivedScore = best.score
        } else {
          normalizedBox = detectMainRegion(resized.base64)
          derivedLabel = normalizedBox ? 'main object' : null
          if (normalizedBox) {
            const area = Math.max(0, normalizedBox.width * normalizedBox.height)
            const centerX = normalizedBox.x + normalizedBox.width / 2
            const centerY = normalizedBox.y + normalizedBox.height / 2
            const centerDistance = Math.min(
              1,
              Math.sqrt((centerX - 0.5) ** 2 + (centerY - 0.5) ** 2) * 1.8,
            )
            const centerContribution = (1 - centerDistance) * 0.32
            const areaContribution = Math.min(0.4, area * 1.1)
            derivedScore = Math.min(0.94, Math.max(0.24, 0.24 + areaContribution + centerContribution))
          } else {
            derivedScore = 0
          }
        }

        debugFrameCountRef.current += 1
        if (debugFrameCountRef.current % 15 === 0) {
          console.log('[ObjectCenterGuide] frame ok', {
            mode: best ? 'ml' : 'fallback',
            hasBox: !!normalizedBox,
            label: derivedLabel,
            modelLoaded: modelLoadedRef.current,
          })
        }

        setError(null)
        consecutiveCaptureFailuresRef.current = 0

        if (!normalizedBox) {
          setLabel(null)
          setScore(0)
          setBox(null)
          setDirection('centered')
          trackedClassRef.current = null
          trackedBoxRef.current = null
          stableDirectionCountRef.current = 0
          return
        }

        const centerX = normalizedBox.x + normalizedBox.width / 2
        const centerY = normalizedBox.y + normalizedBox.height / 2
        const rawDirection = getDirection(centerX, centerY)

        if (rawDirection === lastDirectionRef.current) {
          stableDirectionCountRef.current += 1
        } else {
          stableDirectionCountRef.current = 0
        }
        lastDirectionRef.current = rawDirection

        const nextDirection =
          stableDirectionCountRef.current >= 1 ? rawDirection : currentDirectionRef.current

        setLabel(derivedLabel)
        setScore(derivedScore)
        setDirection(nextDirection)
        setBox(normalizedBox)
        trackedClassRef.current = derivedLabel
        trackedBoxRef.current = normalizedBox
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Detection failed'
        console.warn('[ObjectCenterGuide] frame detection failed:', message)
        if (message.toLowerCase().includes('capture')) {
          consecutiveCaptureFailuresRef.current += 1
          console.warn('[ObjectCenterGuide] capture failure count:', consecutiveCaptureFailuresRef.current)
          if (consecutiveCaptureFailuresRef.current >= 3) {
            setError('Camera is busy. Hold steady for a second...')
          } else {
            setError(null)
          }
        } else {
          setError(message)
        }
      } finally {
        busyRef.current = false
        const nextDelay = consecutiveCaptureFailuresRef.current > 0
          ? Math.min(intervalMs + consecutiveCaptureFailuresRef.current * 500, 3200)
          : intervalMs
        scheduleNext(nextDelay)
      }
    }

    run()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      setRunning(false)
    }
  }, [active, cameraReady, cameraRef, intervalMs, ready])

  return useMemo(
    () => ({
      ready,
      running,
      label,
      score,
      direction,
      instruction: directionToInstruction(direction),
      centered: direction === 'centered' && !!label,
      box,
      error,
    }),
    [box, direction, error, label, ready, running, score],
  )
}
