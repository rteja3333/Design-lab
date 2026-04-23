import { useCaptureStore } from '../stores/useCaptureStore'
import { useTelemetryStore } from '../stores/useTelemetryStore'

type CaptureFrameHandler = () => Promise<string | null>

let captureFrameHandler: CaptureFrameHandler | null = null
let captureFrameInFlight = false

const registerCaptureFrame = (handler: CaptureFrameHandler): (() => void) => {
    captureFrameHandler = handler

    return () => {
        if (captureFrameHandler === handler) {
            captureFrameHandler = null
        }
    }
}

const captureImage = async (): Promise<void> => {
    const telemetry = useTelemetryStore.getState().snapshot()
    const capture = useCaptureStore.getState()

    let frozenUri: string | null = null

    if (captureFrameHandler) {
        try {
            captureFrameInFlight = true
            frozenUri = await Promise.race([
                captureFrameHandler(),
                new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 5000)),
            ])
        } catch {
            frozenUri = null
        } finally {
            captureFrameInFlight = false
        }
    }

    if (frozenUri) {
        capture.setImage(frozenUri, telemetry)
        capture.setPreviewFrozen(true)
        return
    }

    useCaptureStore.setState({
        imageUri: null,
        telemetrySnapshot: null,
        isPreviewFrozen: false,
    })
}

const isCaptureFrameBusy = (): boolean => captureFrameInFlight

const retakeImage = async (): Promise<void> => {
    useCaptureStore.setState({
        imageUri: null,
        telemetrySnapshot: null,
        isPreviewFrozen: false,
    })
}

export { captureImage, isCaptureFrameBusy, registerCaptureFrame, retakeImage }

