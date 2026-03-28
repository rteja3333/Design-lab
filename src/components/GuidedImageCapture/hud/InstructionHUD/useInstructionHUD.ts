import { useEngineStore } from '../../stores/useEngineStore';
import type { Instruction } from '../../types/types';

interface InstructionHUDState {
	instruction: Instruction | null
	index: number
	total: number
}

const useInstructionHUD = (): InstructionHUDState => {
    const instructions = useEngineStore((state) => state.instructions)
    const instructionIndex = useEngineStore((state) => state.instructionIndex)

    const current = instructions[instructionIndex] ?? null

    return {
        instruction: current,
        index: instructionIndex + 1,
        total: instructions.length,
    }
}

export { useInstructionHUD };
export type { InstructionHUDState };

