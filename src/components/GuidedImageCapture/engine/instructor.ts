import { useCaptureStore, type CaptureStore } from '../stores/useCaptureStore'
import { useEngineStore } from '../stores/useEngineStore'
import type { TelemetryState } from '../stores/useTelemetryStore'
import { useTelemetryStore } from '../stores/useTelemetryStore'
import CONFIG from '../types/config'
import { ValidationResult, type EngineState, type Instruction } from '../types/types'
import {
	computeBearingDegrees,
	computeHaversineDistanceMeters,
	getRelativeAngleDegrees,
	getRelativeAngleToFacingDirection,
} from './telemetryMath'


const getNavigationInstruction = (
	distance: number,
	relativeAngle: number,
	arrivalDistanceThreshold: number,
): string => {
	if (distance <= arrivalDistanceThreshold) {
		return 'You have arrived!'
	}

	if (Math.abs(relativeAngle) < CONFIG.NAVIGATE_TOLERANCE_DEGREES) {
		return `Continue straight for ${formatDistance(distance)}.`
	}

	const direction = relativeAngle > 0 ? 'right' : 'left'
	const adverb = Math.abs(relativeAngle) < 35 ? 'slightly ' : ''
	return `Turn ${adverb}${direction} to head toward your destination (${formatDistance(distance)} away).`
}

const getDirectionSentence = (relativeAngle: number): string => {
	let angle = relativeAngle

	const absAngle = Math.abs(Math.round(angle))
	const direction = angle > 0 ? 'right' : 'left'

	if (absAngle <= CONFIG.COMPASS_TOLERANCE_DEGREES) return "You're facing the right way! Press button."
	if (absAngle >= 165) return 'Turn around. The subject is behind you.'

	return `Turn ${direction} ${absAngle}° to face your target.`
}

const buildInstructions = (
	type: EngineState,
	entries: { title: string; message: string }[],
): Instruction[] => entries.map((entry, step) => ({ step, type, ...entry }))

const formatDistance = (value: number): string => `${Math.max(1, Math.round(value))} meters`

const instructStart = (
	_telemetry: TelemetryState,
	_captureStore: CaptureStore,
	_validationResult: ValidationResult,
): Instruction[] => {
	return buildInstructions('START', [
		{
			title: 'START',
			message: 'Press button to begin the guided capture process.',
		},
	])
}

const instructNavigate = (
	telemetry: TelemetryState,
	captureStore: CaptureStore,
	_validationResult: ValidationResult,
): Instruction[] => {
	const task = captureStore.task!
	const targetLat = task.capture_location.lat
	const targetLng = task.capture_location.lng
	const arrivalDistanceThreshold =
		task.capture_location.radius_meters + CONFIG.GPS_TOLERANCE_EXTRA_METERS
	const distance = computeHaversineDistanceMeters(
		telemetry.gps.lat,
		telemetry.gps.lng,
		targetLat,
		targetLng,
	)

	const bearing = computeBearingDegrees(
		telemetry.gps.lat,
		telemetry.gps.lng,
		targetLat,
		targetLng,
	)
	const relativeAngle = getRelativeAngleDegrees(telemetry.orientation.heading, bearing)
	const navMessage = getNavigationInstruction(distance, relativeAngle, arrivalDistanceThreshold)

	return buildInstructions('NAVIGATE', [
		{
			title: `Go to ${task.capture_location.landmark_hint}`,
			message: `${navMessage}`,
		},
	])
}

const instructAlign = (
	telemetry: TelemetryState,
	captureStore: CaptureStore,
	_validationResult: ValidationResult,
): Instruction[] => {
	const task = captureStore.task!
	const relativeAngle = getRelativeAngleToFacingDirection(
		telemetry.orientation.heading,
		task.capture_orientation.facing_direction,
	)
	const alignMessage = getDirectionSentence(relativeAngle)

	return buildInstructions('ALIGN', [
		{
			title: `Face ${task.capture_orientation.subject_hint}`,
			message: `${alignMessage}`,
		},
	])
}

const instructCapture = (
	_telemetry: TelemetryState,
	_captureStore: CaptureStore,
	_validationResult: ValidationResult,
): Instruction[] => {
	
	// TO-DO: replace with real-time camera feed instructions, 
	// e.g. "Subject should fill 80% of the frame, with the landmark in the background."
	return buildInstructions('CAPTURE', [
		{
			title: 'CAPTURE image',
			message: 'Press button to capture image.',
		},
	])
}

const instructValidate = (
	_telemetry: TelemetryState,
	_captureStore: CaptureStore,
	_validationResult: ValidationResult,
): Instruction[] => {
	return buildInstructions('VALIDATE', [
		{
			title: 'Validating photo...',
			message: 'Please wait while we check the quality of your photo against the task requirements.',
		},
	])
}

const instructRetake = (
	_telemetry: TelemetryState,
	_captureStore: CaptureStore,
	validationResult: ValidationResult,
): Instruction[] => {
	switch (validationResult) {
		case ValidationResult.RESOLUTION_FAILURE:
			return buildInstructions('RETAKE', [
				{
					title: 'Photo resolution too low',
					message: 'Please retake the photo ensuring it meets the minimum resolution requirements.',
				},
			])

		case ValidationResult.BLUR_FAILURE:
			return buildInstructions('RETAKE', [
				{
					title: 'Photo is blurry',
					message: 'Please retake the photo, holding your device steady and ensuring good lighting.',
				},
			])
		
		case ValidationResult.BRIGHTNESS_FAILURE:
			return buildInstructions('RETAKE', [
				{
					title: 'Photo is too dark or too bright',
					message: 'Please retake the photo in better lighting conditions.',
				},
			])
		
		case ValidationResult.TILT_FAILURE:
			return buildInstructions('RETAKE', [
				{
					title: 'Photo is tilted',
					message: 'Please retake the photo, holding your device level.',
				},
			])

		case ValidationResult.FILE_SIZE_FAILURE:
			return buildInstructions('RETAKE', [
				{
					title: 'Photo file size issue',
					message: 'Please retake the photo ensuring it meets the file size requirements.',
				},
			])
		
		case ValidationResult.SUBMIT_FAILURE:
			return buildInstructions('RETAKE', [
				{
					title: 'Photo submission failed',
					message: 'Something went wrong during submission, please try retaking and submitting your photo again.',
				},
			])
		
		default:
			return buildInstructions('RETAKE', [
				{
					title: 'Validation failed',
					message: 'Press button to retake photo and follow instructions to improve quality.',
				},
			])
	}
}

const instructSubmit = (
	_telemetry: TelemetryState,
	captureStore: CaptureStore,
	_validationResult: ValidationResult,
): Instruction[] => {
	const task = captureStore.task!

	return buildInstructions('SUBMIT', [
		{
			title: 'Submit photo',
			message: `Your photo meets the requirements for ${task.capture_requirements[0].label}. Press button to submit.`,
		},
	])
}

const instructDone = (
	_telemetry: TelemetryState,
	_captureStore: CaptureStore,
	_validationResult: ValidationResult,
): Instruction[] => {
	return buildInstructions('DONE', [
		{
			title: 'DONE',
			message: `Task complete!`,
		},
	])
}

const instructForState = (
	state: EngineState,
	telemetry: TelemetryState,
	captureStore: CaptureStore,
	validationResult: ValidationResult,
): Instruction[] => {
	switch (state) {
		case 'START':
			return instructStart(telemetry, captureStore, validationResult)
		case 'NAVIGATE':
			return instructNavigate(telemetry, captureStore, validationResult)
		case 'ALIGN':
			return instructAlign(telemetry, captureStore, validationResult)
		case 'CAPTURE':
			return instructCapture(telemetry, captureStore, validationResult)
		case 'VALIDATE':
			return instructValidate(telemetry, captureStore, validationResult)
		case 'RETAKE':
			return instructRetake(telemetry, captureStore, validationResult)
		case 'SUBMIT':
			return instructSubmit(telemetry, captureStore, validationResult)
		case 'DONE':
			return instructDone(telemetry, captureStore, validationResult)
		default:
			return []
	}
}

const instruct = (state: EngineState, validationResult: ValidationResult = ValidationResult.SUCCESS): void => {
	const telemetry = useTelemetryStore.getState()
	const captureStore = useCaptureStore.getState()

	if (!captureStore.task) {
		throw new Error('instruct() called before task was loaded into capture store.')
	}

	const instructions = instructForState(state, telemetry, captureStore, validationResult)
	useEngineStore.getState().setInstructions(instructions)
}

const instructNormal = (state: EngineState): void => {

	const instructionMap: Partial<Record<EngineState, Instruction[]>> = {
		START: buildInstructions('START', [
			{ title: 'Ready', message: 'Press button to open the camera.' },
		]),
		CAPTURE: buildInstructions('CAPTURE', [
			{ title: 'Take Photo', message: 'Capture a photo for report.' },
		]),
		SUBMIT: buildInstructions('SUBMIT', [
			{ title: 'Submit', message: 'Looks good! Press button to submit.' },
		]),
		DONE: buildInstructions('DONE', [
			{ title: 'Done', message: 'Photo captured successfully!' },
		]),
	}

	const instructions = instructionMap[state]
	if (instructions) {
		useEngineStore.getState().setInstructions(instructions)
	}
}

const instructValidatorLoopError = (errorState: EngineState): void => {
	useEngineStore.getState().setInstructions([{
		step: 0,
		type: errorState,
		title: `${errorState} validation failed`,
		message: 'Please press button to return to the previous step and follow instructions.',
	}])
}

export { instruct, instructNormal, instructValidatorLoopError }

