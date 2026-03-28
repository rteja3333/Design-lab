import { useEffect } from 'react'

import * as Location from 'expo-location'
import { DeviceMotion, Magnetometer } from 'expo-sensors'

import { computeHeadingFromMagnetometer, normalizeDegrees } from '../engine/telemetryMath'
import { useTelemetryStore } from '../stores/useTelemetryStore'
import CONFIG from '../types/config'

type Unsubscribe = () => void

const updateTelemetry = useTelemetryStore.getState().update

const subscribeToLocation = async (): Promise<Unsubscribe> => {
    const permission = await Location.requestForegroundPermissionsAsync()
    if (permission.status !== 'granted') {
        return () => undefined
    }

    const subscription = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: CONFIG.LOCATION_UPDATE_MS,
            distanceInterval: 0,
        },
        (position) => {
            updateTelemetry({
                gps: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    altitude: position.coords.altitude,
                    accuracy: position.coords.accuracy,
                },
            })
        },
    )

    return () => subscription.remove()
}

const subscribeToDeviceMotion = async (): Promise<Unsubscribe> => {
    const available = await DeviceMotion.isAvailableAsync()
    if (!available) {
        return () => undefined
    }

    DeviceMotion.setUpdateInterval(CONFIG.DEVICE_MOTION_UPDATE_MS)

    const subscription = DeviceMotion.addListener((reading) => {
        updateTelemetry({
            orientation: {
                alpha: reading.rotation?.alpha ?? 0,
                beta: reading.rotation?.beta ?? 0,
                gamma: reading.rotation?.gamma ?? 0,
            },
        })
    })

    return () => subscription.remove()
}

const subscribeToMagnetometer = async (): Promise<Unsubscribe> => {
    const available = await Magnetometer.isAvailableAsync()
    if (!available) {
        return () => undefined
    }

    Magnetometer.setUpdateInterval(CONFIG.MAGNETOMETER_UPDATE_MS)

    const subscription = Magnetometer.addListener((reading) => {
        updateTelemetry({
            orientation: { heading: computeHeadingFromMagnetometer(reading.x, reading.y) },
        })
    })

    return () => subscription.remove()
}

const subscribeToHeading = async (): Promise<Unsubscribe | null> => {
    try {
        const subscription = await Location.watchHeadingAsync((reading) => {
            const heading = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading

            if (typeof heading === 'number' && heading >= 0) {
                updateTelemetry({
                    orientation: { heading: normalizeDegrees(heading) },
                })
            }
        })

        return () => subscription.remove()
    } catch {
        return null
    }
}

const subscribeToHeadingWithFallback = async (): Promise<Unsubscribe> => {
    const headingUnsubscribe = await subscribeToHeading()
    if (headingUnsubscribe) {
        return headingUnsubscribe
    }

    // Fallback for devices where watchHeadingAsync is unavailable.
    return subscribeToMagnetometer()
}

const useTelemetry = (): void => {
    useEffect(() => {
        let isMounted = true
        let unsubscribers: Unsubscribe[] = []

        const startSubscriptions = async (): Promise<void> => {
            const starts = await Promise.all([
                subscribeToLocation(),
                subscribeToDeviceMotion(),
                subscribeToHeadingWithFallback(),
            ])

            if (!isMounted) {
                starts.forEach((unsubscribe) => unsubscribe())
                return
            }

            unsubscribers = starts
        }

        void startSubscriptions()

        return () => {
            isMounted = false
            unsubscribers.forEach((unsubscribe) => unsubscribe())
        }
    }, [])
}

export { useTelemetry }

