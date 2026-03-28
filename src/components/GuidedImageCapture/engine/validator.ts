import { useCaptureStore, type CaptureStore } from '../stores/useCaptureStore'
import type { TelemetryState } from '../stores/useTelemetryStore'
import { useTelemetryStore } from '../stores/useTelemetryStore'
import { ValidationResult, type EngineState } from '../types/types'

import CONFIG, { TEST_MODE_VALUES } from '../types/config'
import {
    calculateImageQualityMetrics,
    postProcessImage,
    validateBlurMetric,
    validateBrightnessMetric,
    validateFileSizeMetric,
    validateResolutionMetric,
    validateTiltMetric,
} from './processors/postCapture'
import { computeAngleToTarget, computeHaversineDistanceMeters } from './telemetryMath'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const validateStart = (_telemetry: TelemetryState, _capture: CaptureStore): ValidationResult => {
    // Placeholder: START state always passes
    return ValidationResult.SUCCESS
}

const validateNavigate = (telemetry: TelemetryState, capture: CaptureStore): ValidationResult => {
    const task = capture.task!
    // Check that current location is within task radius plus configured GPS tolerance.
    if (telemetry.gps.accuracy === null) {
        return CONFIG.DISTANCE_UNAVAILABLE_PASSES
            ? ValidationResult.SUCCESS
            : ValidationResult.DEFAULT_FAILURE
    }

    const distance = computeHaversineDistanceMeters(
        telemetry.gps.lat,
        telemetry.gps.lng,
        task.capture_location.lat,
        task.capture_location.lng,
    )

    const allowedRadius = task.capture_location.radius_meters + CONFIG.GPS_TOLERANCE_EXTRA_METERS
    return distance <= allowedRadius ? ValidationResult.SUCCESS : ValidationResult.DEFAULT_FAILURE
}

const validateAlign = (telemetry: TelemetryState, capture: CaptureStore): ValidationResult => {
    const task = capture.task!
    // Check that heading delta from required direction is within compass tolerance.
    const angleToTarget = computeAngleToTarget(
        telemetry.orientation.heading,
        task.capture_orientation.facing_direction,
    )
    return angleToTarget <= CONFIG.COMPASS_TOLERANCE_DEGREES
        ? ValidationResult.SUCCESS
        : ValidationResult.DEFAULT_FAILURE
}

const validateCapture = (_telemetry: TelemetryState, capture: CaptureStore): ValidationResult => {
    // Placeholder: CAPTURE state always passes (actual capture validation happens in VALIDATE)
    return ValidationResult.SUCCESS
}

const validateValidate = async (telemetry: TelemetryState, capture: CaptureStore): Promise<ValidationResult> => {
    // Validate the captured image against the task's quality thresholds. Returns specific failure types for better feedback.
    const { imageUri, task } = capture

    if (!task) {
        return ValidationResult.DEFAULT_FAILURE
    }

    if (!imageUri) {
        return ValidationResult.DEFAULT_FAILURE
    }

    const preProcessedMetrics = await calculateImageQualityMetrics({
        imageUri,
        task,
        telemetry,
    })

    let processedImageUri = imageUri
    if (CONFIG.POST_PROCESS_IMAGE) {
        const postProcessing = await postProcessImage({
            imageUri,
            task,
            telemetry,
        })
        processedImageUri = postProcessing.processedImageUri
    }

    const postProcessedMetrics = await calculateImageQualityMetrics({
        imageUri: processedImageUri,
        task,
        telemetry,
    })

    if (CONFIG.DEV_MODE) {
        console.log('[PostCapture:metrics-diff]', {
            preProcessedMetrics,
            postProcessedMetrics,
            delta: {
                resolutionPixels:
                    (postProcessedMetrics.resolutionPixels ?? 0) - (preProcessedMetrics.resolutionPixels ?? 0),
                blurScore: (postProcessedMetrics.blurScore ?? 0) - (preProcessedMetrics.blurScore ?? 0),
                brightness: (postProcessedMetrics.brightness ?? 0) - (preProcessedMetrics.brightness ?? 0),
                tiltDegrees: postProcessedMetrics.tiltDegrees - preProcessedMetrics.tiltDegrees,
                fileSizeMb: (postProcessedMetrics.fileSizeMb ?? 0) - (preProcessedMetrics.fileSizeMb ?? 0),
            },
        })
    }

    if (CONFIG.TEST_MODE === TEST_MODE_VALUES.RUN_VALIDATION_ON_TEST_TASK) {
        await sleep(CONFIG.TEST_MODE_IMAGE_VALIDATION_DELAY_MS)
    }

    if (!validateResolutionMetric(postProcessedMetrics, task)) {
        return ValidationResult.RESOLUTION_FAILURE
    }

    if (!validateBlurMetric(postProcessedMetrics, task)) {
        return ValidationResult.BLUR_FAILURE
    }

    if (!validateBrightnessMetric(postProcessedMetrics, task)) {
        return ValidationResult.BRIGHTNESS_FAILURE
    }

    if (!validateTiltMetric(postProcessedMetrics, task)) {
        return ValidationResult.TILT_FAILURE
    }

    if (!validateFileSizeMetric(postProcessedMetrics, task)) {
        return ValidationResult.FILE_SIZE_FAILURE
    }

    return ValidationResult.SUCCESS
}

const validateRetake = (_telemetry: TelemetryState, _capture: CaptureStore): ValidationResult => {
    // Placeholder: RETAKE state always passes
    return ValidationResult.SUCCESS
}

const validateSubmit = async (_telemetry: TelemetryState, capture: CaptureStore): Promise<ValidationResult> => {
    if (CONFIG.TEST_MODE === TEST_MODE_VALUES.RUN_VALIDATION_ON_TEST_TASK) {
        await sleep(CONFIG.TEST_MODE_IMAGE_SUBMISSION_DELAY_MS)
    }

    // Submission is only valid when a complete capture result can be built.
    return capture.buildResult() !== null
        ? ValidationResult.SUCCESS
        : ValidationResult.SUBMIT_FAILURE
}

const validateDone = (_telemetry: TelemetryState, _capture: CaptureStore): ValidationResult => {
    // Placeholder: DONE state always passes
    return ValidationResult.SUCCESS
}

const validateForState = async (
    state: EngineState,
    telemetry: TelemetryState,
    capture: CaptureStore,
): Promise<ValidationResult> => {

    if (CONFIG.TEST_MODE === TEST_MODE_VALUES.BYPASS_VALIDATION) 
        return ValidationResult.SUCCESS

    switch (state) {
        case 'START': 
            return validateStart(telemetry, capture)
        case 'NAVIGATE':
            return validateNavigate(telemetry, capture)
        case 'ALIGN':
            return validateAlign(telemetry, capture)
        case 'CAPTURE':
            return validateCapture(telemetry, capture)
        case 'VALIDATE':
            return await validateValidate(telemetry, capture)
        case 'RETAKE':
            return validateRetake(telemetry, capture)
        case 'SUBMIT':
            return await validateSubmit(telemetry, capture)
        case 'DONE':
            return validateDone(telemetry, capture)
        default:
            return ValidationResult.DEFAULT_FAILURE
    }
}

const validate = async (state: EngineState): Promise<ValidationResult> => {
    const telemetry = useTelemetryStore.getState()
    const capture = useCaptureStore.getState()

    if (!capture.task) {
        throw new Error('validate() called before task was loaded into capture store.')
    }

    const result = await validateForState(state, telemetry, capture)
    return result
}

export { validate }

