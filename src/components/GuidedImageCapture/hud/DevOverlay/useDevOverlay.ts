import { useEngineStore } from '../../stores/useEngineStore'
import { useTelemetryStore } from '../../stores/useTelemetryStore'
import type { EngineState, TelemetrySnapshot } from '../../types/types'

interface DevOverlayState {
	telemetry: TelemetrySnapshot | null
	engineState: EngineState | null
	nextState: EngineState | null
	validationStatus: string
}

const useDevOverlay = (): DevOverlayState => {
	const gps = useTelemetryStore((state) => state.gps)
	const orientation = useTelemetryStore((state) => state.orientation)

	const engineState = useEngineStore((state) => state.currentState)
	const nextState = useEngineStore((state) => state.nextState)
	const validationStatus = useEngineStore((state) => state.gateState)

	const telemetry: TelemetrySnapshot = {
		gps,
		orientation,
		capturedAt: new Date().toISOString(),
	}

	return {
		telemetry,
		engineState,
		nextState,
		validationStatus: validationStatus ?? 'STATIC',
	}
}

export { useDevOverlay }
export type { DevOverlayState }

