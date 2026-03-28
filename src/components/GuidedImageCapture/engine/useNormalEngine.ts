// useNormalEngine.ts
// A simplified linear engine: START → CAPTURE → SUBMIT → DONE.
// No validation loops, no instructor loops, no nav/align checks.
// Follows the same StateDefinition pattern as useEngine.ts.

import { useEffect } from 'react'
import { useCaptureStore } from '../stores/useCaptureStore'
import { useEngineStore } from '../stores/useEngineStore'
import { ValidationResult, type EngineState, type Instruction } from '../types/types'
import { captureImage, retakeImage } from './useEngineUtils'
import { instructNormal } from './instructor'

type EngineSnapshot = ReturnType<typeof useEngineStore.getState>
type EngineEvent = 'BUTTON_PRESS' | 'STATE_ENTRY'
interface EventContext {
    validationResult?: ValidationResult
}

type EventHandler = (engine: EngineSnapshot, context?: EventContext) => Promise<void>

interface StateDefinition {
    defaultNextState: EngineState
    onButtonPress?: EventHandler
    onStateEntry?: EventHandler
}

// --- Helpers ---

let isTransitioning = false

const getStateDefinition = (state: EngineState): StateDefinition => stateDefinitions[state]

const transitionToState = async (
    nextState: EngineState,
    validationResult: ValidationResult = ValidationResult.SUCCESS,
): Promise<void> => {
    const engine = useEngineStore.getState()
    engine.setNextState(nextState)
    engine.enterState(nextState)
    await dispatchStateEvent(nextState, 'STATE_ENTRY', useEngineStore.getState(), { validationResult })
}

const dispatchStateEvent = async (
    state: EngineState,
    event: EngineEvent,
    engine: EngineSnapshot = useEngineStore.getState(),
    context?: EventContext,
): Promise<void> => {
    const definition = getStateDefinition(state)

    if (event === 'BUTTON_PRESS') {
        await definition.onButtonPress?.(engine, context)
        return
    }

    await definition.onStateEntry?.(engine, context)
}

// --- State Definitions (linear: START → CAPTURE → SUBMIT → DONE) ---

const stateDefinitions: Record<EngineState, StateDefinition> = {
    START: {
        defaultNextState: 'CAPTURE',
        onStateEntry: async (engine) => {
            instructNormal('START')
            engine.setNextState('CAPTURE')
        },
        onButtonPress: async () => {
            await transitionToState('CAPTURE')
        },
    },
    // Unused in normal flow — stubbed out to satisfy the Record type.
    NAVIGATE: {
        defaultNextState: 'CAPTURE',
    },
    ALIGN: {
        defaultNextState: 'CAPTURE',
    },
    CAPTURE: {
        defaultNextState: 'SUBMIT',
        onStateEntry: async (engine) => {
            instructNormal('CAPTURE')
            engine.setNextState('SUBMIT')
        },
        onButtonPress: async () => {
            await captureImage()
            await transitionToState('SUBMIT')
        },
    },
    VALIDATE: {
        defaultNextState: 'SUBMIT',
    },
    RETAKE: {
        defaultNextState: 'CAPTURE',
        onStateEntry: async (engine) => {
            instructNormal('CAPTURE')
            engine.setNextState('CAPTURE')
        },
        onButtonPress: async () => {
            await retakeImage()
            await transitionToState('CAPTURE')
        },
    },
    SUBMIT: {
        defaultNextState: 'DONE',
        onStateEntry: async (engine) => {
            instructNormal('SUBMIT')
            engine.setNextState('DONE')
        },
        onButtonPress: async () => {
            const result = useCaptureStore.getState().buildResult()
            if (result) {
                await transitionToState('DONE')
            }
        },
    },
    DONE: {
        defaultNextState: 'DONE',
        onStateEntry: async () => {
            instructNormal('DONE')
        },
    },
}

// --- Main Engine Logic ---

const handleButtonPress = async (): Promise<void> => {
    const engine = useEngineStore.getState()
    const current = engine.currentState

    if (!current) {
        await transitionToState('START')
        return
    }

    await dispatchStateEvent(current, 'BUTTON_PRESS', engine)
}

const onButtonPress = (): void => {
    if (isTransitioning) return

    isTransitioning = true
    void handleButtonPress().finally(() => {
        isTransitioning = false
    })
}

export const useNormalEngine = () => {
    useEffect(() => {
        const engine = useEngineStore.getState()
        const capture = useCaptureStore.getState()

        engine.reset()
        capture.reset()
        void transitionToState('START')
    }, [])

    return { onButtonPress }
}

export { onButtonPress as onNormalButtonPress }
