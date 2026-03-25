import type { TaskJson } from '../types/types'

// Maps compass direction labels to their true-north degree equivalents.
const DIRECTION_TO_DEGREES: Record<TaskJson['capture_orientation']['facing_direction'], number> = {
	N: 0,
	NE: 45,
	E: 90,
	SE: 135,
	S: 180,
	SW: 225,
	W: 270,
	NW: 315,
}

const toRadians = (degrees: number): number => degrees * (Math.PI / 180)
const toDegrees = (radians: number): number => radians * (180 / Math.PI)

// Wraps any degree value into the [0, 360) range.
const normalizeDegrees = (value: number): number => {
	const normalized = value % 360
	return normalized < 0 ? normalized + 360 : normalized
}

// Returns signed relative angle in degrees within [-180, 180].
// Positive means "turn right", negative means "turn left".
const getRelativeAngleDegrees = (currentHeading: number, targetBearing: number): number => {
	return ((targetBearing - currentHeading + 540) % 360) - 180
}

const getRelativeAngleToFacingDirection = (
	heading: number,
	facingDirection: TaskJson['capture_orientation']['facing_direction'],
): number => {
	const requiredHeading = DIRECTION_TO_DEGREES[facingDirection]
	return getRelativeAngleDegrees(heading, requiredHeading)
}

// Converts raw magnetometer (x, y) components to a compass heading in degrees (0–360).
const computeHeadingFromMagnetometer = (x: number, y: number): number => {
	return normalizeDegrees(toDegrees(Math.atan2(y, x)))
}

// Returns the angular deviation in degrees (0–180) between the device's current heading
// and the task's required facing direction.
const computeAngleToTarget = (
	heading: number,
	facingDirection: TaskJson['capture_orientation']['facing_direction'],
): number => {
	return Math.abs(getRelativeAngleToFacingDirection(heading, facingDirection))
}

// Computes the initial bearing in degrees (0–360) from one GPS coordinate to another,
// measured clockwise from true north.
const computeBearingDegrees = (
	fromLat: number,
	fromLng: number,
	toLat: number,
	toLng: number,
): number => {
	const phi1 = toRadians(fromLat)
	const phi2 = toRadians(toLat)
	const deltaLambda = toRadians(toLng - fromLng)

	const y = Math.sin(deltaLambda) * Math.cos(phi2)
	const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

	return normalizeDegrees(toDegrees(Math.atan2(y, x)))
}

// Converts a numeric bearing in degrees to a human-readable 16-wind compass direction.
const bearingToDirection = (bearing: number): string => {
	const directions = [
		'north',
		'north-north-east',
		'north-east',
		'east-north-east',
		'east',
		'east-south-east',
		'south-east',
		'south-south-east',
		'south',
		'south-south-west',
		'south-west',
		'west-south-west',
		'west',
		'west-north-west',
		'north-west',
		'north-north-west',
	]

	const sectorSize = 360 / directions.length
	const index = Math.round(bearing / sectorSize) % directions.length
	return directions[index]
}

// Computes the great-circle distance in metres between two GPS coordinates
// using the Haversine formula.
const computeHaversineDistanceMeters = (
	fromLat: number,
	fromLng: number,
	toLat: number,
	toLng: number,
): number => {
	const earthRadiusMeters = 6371000

	const dLat = toRadians(toLat - fromLat)
	const dLng = toRadians(toLng - fromLng)
	const fromLatRad = toRadians(fromLat)
	const toLatRad = toRadians(toLat)

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(dLng / 2) ** 2

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

	return earthRadiusMeters * c
}

export {
    bearingToDirection,
    computeAngleToTarget,
    computeBearingDegrees,
    computeHaversineDistanceMeters,
    computeHeadingFromMagnetometer, getRelativeAngleDegrees, getRelativeAngleToFacingDirection, normalizeDegrees
}

