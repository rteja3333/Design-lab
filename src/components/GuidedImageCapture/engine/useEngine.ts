import { useEffect } from 'react';
import { useCaptureStore } from '../stores/useCaptureStore';
import { useEngineStore } from '../stores/useEngineStore';
import CONFIG from '../types/config';
import { ValidationResult, type EngineState } from '../types/types';
import { instruct, instructValidatorLoopError } from './instructor';
import { captureImage, retakeImage } from './useEngineUtils';
import { validate } from './validator';

const isValidationSuccess = (validationResult: ValidationResult): boolean =>
    validationResult === ValidationResult.SUCCESS;

type EngineSnapshot = ReturnType<typeof useEngineStore.getState>;
type EngineEvent = 'BUTTON_PRESS' | 'STATE_ENTRY' | 'VALIDATOR_TICK';
interface EventContext {
    validationResult?: ValidationResult;
}

type EventHandler = (engine: EngineSnapshot, context?: EventContext) => Promise<void>;

interface StateDefinition {
    defaultNextState: EngineState;
    validatorStates?: EngineState[];
    onButtonPress?: EventHandler;
    onStateEntry?: EventHandler;
    onValidatorTick?: EventHandler;
}

const getStateDefinition = (state: EngineState): StateDefinition => stateDefinitions[state];

// --- Validator Manager ---
class ValidatorLoop {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private isTicking = false;

    start() {
        this.stop();
        this.intervalId = setInterval(() => void this.tick(), CONFIG.VALIDATOR_LOOP_INTERVAL_MS);
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
    }

    private async tick(): Promise<void> {
        if (this.isTicking) return;
        this.isTicking = true;

        try {
            const engine = useEngineStore.getState();
            const currentState = engine.currentState;
            if (!currentState) return;

            await dispatchStateEvent(currentState, 'VALIDATOR_TICK', engine);
        } finally {
            this.isTicking = false;
        }
    }
}

// --- Instructor Manager ---
class InstructorLoop {
    private intervalId: ReturnType<typeof setInterval> | null = null;

    start() {
        this.stop();
        this.intervalId = setInterval(() => this.tick(), CONFIG.INSTRUCTOR_LOOP_INTERVAL_MS);
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
    }

    private tick(): void {
        const engine = useEngineStore.getState();
        const currentState = engine.currentState;
        const gateState = engine.gateState;
        if (!currentState || gateState == 'REGRESS') return;
        instruct(currentState);
    }
}

// --- Helpers ---
const validatorLoop = new ValidatorLoop();
const instructorLoop = new InstructorLoop();
let isTransitioning = false;

const runValidationProgression = async (engine: EngineSnapshot, currentState: EngineState): Promise<void> => {
    const { validatorStates = [], defaultNextState } = getStateDefinition(currentState);
    if (validatorStates.length === 0) return;

    for (const step of validatorStates) {
        const validationResult = await validate(step);

        if (!isValidationSuccess(validationResult)) {
            engine.setNextState(step);

            if (step !== currentState) {
                instructValidatorLoopError(step);
            }

            return;
        }
    }

    engine.setNextState(defaultNextState);
};

const transitionToState = async (
    nextState: EngineState,
    validationResult: ValidationResult = ValidationResult.SUCCESS,
): Promise<void> => {
    const engine = useEngineStore.getState();
    engine.setNextState(nextState);
    engine.enterState(nextState);
    await dispatchStateEvent(nextState, 'STATE_ENTRY', useEngineStore.getState(), { validationResult });
};

const dispatchStateEvent = async (
    state: EngineState,
    event: EngineEvent,
    engine: EngineSnapshot = useEngineStore.getState(),
    context?: EventContext,
): Promise<void> => {
    const definition = getStateDefinition(state);

    if (event === 'BUTTON_PRESS') {
        await definition.onButtonPress?.(engine, context);
        return;
    }

    if (event === 'STATE_ENTRY') {
        await definition.onStateEntry?.(engine, context);
        return;
    }

    await definition.onValidatorTick?.(engine, context);
};

const stateDefinitions: Record<EngineState, StateDefinition> = {
    START: {
        defaultNextState: 'NAVIGATE',
        onStateEntry: async (engine, context) => {
            instruct('START', context?.validationResult ?? ValidationResult.SUCCESS);
            engine.setNextState('NAVIGATE');
        },
        onButtonPress: async () => {
            validatorLoop.start();
            instructorLoop.start();
            await transitionToState('NAVIGATE');
        },
    },
    NAVIGATE: {
        defaultNextState: 'ALIGN',
        validatorStates: ['NAVIGATE'],
        onStateEntry: async (_engine, context) => {
            instruct('NAVIGATE', context?.validationResult ?? ValidationResult.SUCCESS);
        },
        onButtonPress: async () => {
            await transitionToState('ALIGN');
        },
        onValidatorTick: async (engine) => {
            await runValidationProgression(engine, 'NAVIGATE');
        },
    },
    ALIGN: {
        defaultNextState: 'CAPTURE',
        validatorStates: ['NAVIGATE', 'ALIGN'],
        onStateEntry: async (engine, context) => {
            instruct('ALIGN', context?.validationResult ?? ValidationResult.SUCCESS);
            engine.setNextState('CAPTURE');
        },
        onButtonPress: async () => {
            await transitionToState('CAPTURE');
        },
        onValidatorTick: async (engine) => {
            await runValidationProgression(engine, 'ALIGN');
        },
    },
    CAPTURE: {
        defaultNextState: 'VALIDATE',
        validatorStates: ['NAVIGATE'],
        onStateEntry: async (engine, context) => {
            instruct('CAPTURE', context?.validationResult ?? ValidationResult.SUCCESS);
            engine.setNextState('VALIDATE');
        },
        onButtonPress: async (engine) => {
            validatorLoop.stop();
            instructorLoop.stop();

            await captureImage();

            const validationResult = await validate('CAPTURE');
            await transitionToState(isValidationSuccess(validationResult) ? 'VALIDATE' : 'RETAKE', validationResult);
        },
        onValidatorTick: async (engine) => {
            await runValidationProgression(engine, 'CAPTURE');
        },
    },
    VALIDATE: {
        defaultNextState: 'SUBMIT',
        onStateEntry: async (_engine, context) => {
            instruct('VALIDATE', context?.validationResult ?? ValidationResult.SUCCESS);
            const validationResult = await validate('VALIDATE');
            await transitionToState(isValidationSuccess(validationResult) ? 'SUBMIT' : 'RETAKE', validationResult);
        },
    },
    RETAKE: {
        defaultNextState: 'CAPTURE',
        validatorStates: ['NAVIGATE', 'ALIGN'],
        onStateEntry: async (engine, context) => {
            instruct('RETAKE', context?.validationResult ?? ValidationResult.SUCCESS);
            engine.setNextState('CAPTURE');
        },
        onButtonPress: async () => {
            validatorLoop.start();
            instructorLoop.start();
            await retakeImage();
            await transitionToState('CAPTURE');
        },
        onValidatorTick: async (engine) => {
            await runValidationProgression(engine, 'RETAKE');
        },
    },
    SUBMIT: {
        defaultNextState: 'DONE',
        onStateEntry: async (engine, context) => {
            instruct('SUBMIT', context?.validationResult ?? ValidationResult.SUCCESS);
            engine.setNextState('DONE');
        },
        onButtonPress: async () => {
            const validationResult = await validate('SUBMIT');
            await transitionToState(isValidationSuccess(validationResult) ? 'DONE' : 'RETAKE', validationResult);
        },
    },
    DONE: {
        defaultNextState: 'DONE',
        onStateEntry: async (_engine, context) => {
            instruct('DONE', context?.validationResult ?? ValidationResult.SUCCESS);
            validatorLoop.stop();
            instructorLoop.stop();
        },
    },
};

// --- Main Engine Logic ---
const handleButtonPress = async (): Promise<void> => {
    const engine = useEngineStore.getState();
    const current = engine.currentState;

    if (!current) {
        await transitionToState('START');
        return;
    }

    await dispatchStateEvent(current, 'BUTTON_PRESS', engine);
};

const onButtonPress = (): void => {
    const { currentState, gateState } = useEngineStore.getState();
    console.log('[GuidedEngine] button press', { currentState, gateState, isTransitioning });

    // Prevent re-entrant presses during async work (e.g. CAPTURE).
    if (isTransitioning) return;

    isTransitioning = true;
    void handleButtonPress().finally(() => {
        isTransitioning = false;
        console.log('[GuidedEngine] button handling completed');
    });
};

export const useEngine = () => {
    useEffect(() => {
        const engine = useEngineStore.getState();
        const capture = useCaptureStore.getState();

        engine.reset();
        capture.reset();
        void transitionToState('START');

        return () => {
            validatorLoop.stop();
            instructorLoop.stop();
        };
    }, []);

    return { onButtonPress };
};

export { onButtonPress };

