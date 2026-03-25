import { onButtonPress } from '../../engine/useEngine'
import { useEngineStore } from '../../stores/useEngineStore'
import type { GateState } from '../../types/types'

interface ControlBarState {
    label: string
    gateState: GateState
    onPress: () => void
    onPrev: () => void
    onNext: () => void
    canPrev: boolean
    canNext: boolean
}

const getStateLabel = (state: string | null): string => {
    switch (state) {
        case 'START':
            return 'START'
        case 'NAVIGATE':
            return 'NAVIGATE'
        case 'ALIGN':
            return 'ALIGN'
        case 'CAPTURE':
            return 'CAPTURE'
        case 'VALIDATE':
            return 'VALIDATING'
        case 'SUBMIT':
            return 'SUBMIT'
        case 'RETAKE':
            return 'RETAKE'
        case 'DONE':
            return 'DONE'
        default:
            return 'READY'
    }
}

const useControlBar = (): ControlBarState => {
    const currentState = useEngineStore((state) => state.currentState)
    const gateState = useEngineStore((state) => state.gateState)
    const instructions = useEngineStore((state) => state.instructions)
    const instructionIndex = useEngineStore((state) => state.instructionIndex)

    const label = getStateLabel(currentState)

    const canPrev = instructionIndex > 0
    const canNext = instructionIndex < instructions.length - 1

    const handlePrev = (): void => {
        useEngineStore.getState().stepInstruction('prev')
    }

    const handleNext = (): void => {
        useEngineStore.getState().stepInstruction('next')
    }

    return {
        label,
        gateState,
        onPress: onButtonPress,
        onPrev: handlePrev,
        onNext: handleNext,
        canPrev,
        canNext,
    }
}

export { useControlBar }
export type { ControlBarState }

