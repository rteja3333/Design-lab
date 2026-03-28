import { create } from 'zustand'

import { ORDER, type EngineState, type GateState, type Instruction } from '../types/types'

interface EngineStore {
	currentState: EngineState | null
	nextState: EngineState | null
	gateState: GateState
	instructions: Instruction[]
	instructionIndex: number
	enterState: (state: EngineState) => void
	setInstructions: (instructions: Instruction[]) => void
	setNextState: (state: EngineState) => void
	stepInstruction: (dir: 'prev' | 'next') => void
	reset: () => void
}

const useEngineStore = create<EngineStore>()((set) => ({
	currentState: null,
	nextState: null,
	gateState: 'STATIC',
	instructions: [],
	instructionIndex: 0,
	enterState: (state) => {
		set({
			currentState: state,
			nextState: null,
			gateState: 'STATIC',
		})
	},
	setInstructions: (instructions) => {
		set({
			instructions,
			instructionIndex: 0,
		})
	},
	setNextState: (state) => {
		set((storeState) => ({
			nextState: state,
			gateState: selectGateState(storeState.currentState, state),
		}))
	},
	stepInstruction: (dir) => {
		set((state) => {
			const maxIndex = Math.max(0, state.instructions.length - 1)
			const delta = dir === 'next' ? 1 : -1
			const nextIndex = Math.min(maxIndex, Math.max(0, state.instructionIndex + delta))

			return { instructionIndex: nextIndex }
		})
	},
	reset: () => {
		set({
			currentState: null,
			nextState: null,
			gateState: 'STATIC',
			instructions: [],
			instructionIndex: 0,
		})
	},
}))

const selectGateState = (current: EngineState | null, next: EngineState | null): GateState => {
	if (!current || !next) {
		return 'STATIC'
	} else if (ORDER[current] < ORDER[next]) {
		return 'PROGRESS'
	} else if (ORDER[current] > ORDER[next]) {
		return 'REGRESS'
	} else {
		return 'STATIC'
	}
}
export { useEngineStore }
export type { EngineStore }

