import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { Image } from 'react-native'

import type { TelemetryState } from '../../stores/useTelemetryStore'
import type { TaskJson } from '../../types/types'

interface PostCaptureInput {
	imageUri: string
	task: TaskJson
	telemetry: TelemetryState
}

interface PostCaptureMetrics {
	resolutionPixels: number | null
	blurScore: number | null
	brightness: number | null
	tiltDegrees: number
	fileSizeMb: number | null
}

interface PostCaptureProcessingResult {
	processedImageUri: string
	appliedOperations: string[]
}

const RAD_TO_DEG = 180 / Math.PI

const getImageSize = async (uri: string): Promise<{ width: number; height: number } | null> => {
	return await new Promise((resolve) => {
		Image.getSize(
			uri,
			(width, height) => resolve({ width, height }),
			() => resolve(null),
		)
	})
}

const getFileSizeMb = async (uri: string): Promise<number | null> => {
	try {
		const response = await fetch(uri)
		const blob = await response.blob()
		return blob.size / (1024 * 1024)
	} catch {
		return null
	}
}

const parseMinResolution = (raw: string): number | null => {
	const normalized = raw.trim().toLowerCase()

	if (normalized === '4k') return 3840 * 2160
	if (normalized === '1440p') return 2560 * 1440
	if (normalized === '1080p') return 1920 * 1080
	if (normalized === '720p') return 1280 * 720
	if (normalized === '480p') return 854 * 480

	const directMatch = normalized.match(/^(\d+)x(\d+)$/)
	if (!directMatch) return null

	const width = Number(directMatch[1])
	const height = Number(directMatch[2])

	if (!Number.isFinite(width) || !Number.isFinite(height)) return null
	return width * height
}

const getTiltDegrees = (telemetry: TelemetryState): number => {
	const pitch = Math.abs(telemetry.orientation.beta * RAD_TO_DEG)
	const roll = Math.abs(telemetry.orientation.gamma * RAD_TO_DEG)
	return Math.max(pitch, roll)
}

const calculateImageQualityMetrics = async (input: PostCaptureInput): Promise<PostCaptureMetrics> => {
	const size = await getImageSize(input.imageUri)
	const fileSizeMb = await getFileSizeMb(input.imageUri)

	return {
		resolutionPixels: size ? size.width * size.height : null,
		// Placeholder metrics until pixel-level analysis is added.
		blurScore: 0,
		brightness: 100,
		tiltDegrees: getTiltDegrees(input.telemetry),
		fileSizeMb,
	}
}

const postProcessImage = async (input: PostCaptureInput): Promise<PostCaptureProcessingResult> => {
	const operations: string[] = []
	const baseMetrics = await calculateImageQualityMetrics(input)
	let workingUri = input.imageUri

	if (baseMetrics.tiltDegrees > input.task.quality_thresholds.max_tilt_degrees) {
		const rotated = await manipulateAsync(
			workingUri,
			[{ rotate: -Math.round(input.telemetry.orientation.gamma * RAD_TO_DEG) }],
			{ compress: 1, format: SaveFormat.JPEG },
		)
		workingUri = rotated.uri
		operations.push('rotate')
	}

	if (
		typeof baseMetrics.fileSizeMb === 'number'
		&& baseMetrics.fileSizeMb > input.task.quality_thresholds.file_size_mb.max
	) {
		const compressed = await manipulateAsync(
			workingUri,
			[],
			{ compress: 0.8, format: SaveFormat.JPEG },
		)
		workingUri = compressed.uri
		operations.push('compress')
	}

	return {
		processedImageUri: workingUri,
		appliedOperations: operations,
	}
}

const validateResolutionMetric = (metrics: PostCaptureMetrics, task: TaskJson): boolean => {
	const minPixels = parseMinResolution(task.quality_thresholds.min_resolution)
	if (minPixels === null) {
		return true
	}

	return typeof metrics.resolutionPixels === 'number' && metrics.resolutionPixels >= minPixels
}

const validateBlurMetric = (metrics: PostCaptureMetrics, task: TaskJson): boolean => {
	const value = metrics.blurScore
	return typeof value === 'number' && value <= task.quality_thresholds.max_blur_score
}

const validateBrightnessMetric = (metrics: PostCaptureMetrics, task: TaskJson): boolean => {
	const value = metrics.brightness
	return typeof value === 'number' && value >= task.quality_thresholds.min_brightness
}

const validateTiltMetric = (metrics: PostCaptureMetrics, task: TaskJson): boolean => {
	const value = metrics.tiltDegrees
	return value <= task.quality_thresholds.max_tilt_degrees
}

const validateFileSizeMetric = (metrics: PostCaptureMetrics, task: TaskJson): boolean => {
	const value = metrics.fileSizeMb
	return (
		typeof value === 'number'
		&& value >= task.quality_thresholds.file_size_mb.min
		&& value <= task.quality_thresholds.file_size_mb.max
	)
}

export {
    calculateImageQualityMetrics,
    postProcessImage, validateBlurMetric,
    validateBrightnessMetric, validateFileSizeMetric, validateResolutionMetric, validateTiltMetric
}

export type {
    PostCaptureInput,
    PostCaptureMetrics,
    PostCaptureProcessingResult
}
