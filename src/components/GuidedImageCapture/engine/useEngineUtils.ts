import { useCaptureStore } from '../stores/useCaptureStore'
import { useTelemetryStore } from '../stores/useTelemetryStore'

type CaptureFrameHandler = () => Promise<string | null>

let captureFrameHandler: CaptureFrameHandler | null = null

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
            frozenUri = await captureFrameHandler()
        } catch {
            frozenUri = null
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

const retakeImage = async (): Promise<void> => {
    useCaptureStore.setState({
        imageUri: null,
        telemetrySnapshot: null,
        isPreviewFrozen: false,
    })
}

export { captureImage, registerCaptureFrame, retakeImage }

