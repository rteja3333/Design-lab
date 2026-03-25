import { create } from 'zustand'

import type { TelemetrySnapshot } from '../types/types'

type TelemetryState = Omit<TelemetrySnapshot, 'capturedAt'>
type TelemetryUpdate = {
	gps?: Partial<TelemetryState['gps']>
	orientation?: Partial<TelemetryState['orientation']>
}

interface TelemetryStore extends TelemetryState {
	update: (data: TelemetryUpdate) => void
	snapshot: () => TelemetrySnapshot
}

const useTelemetryStore = create<TelemetryStore>()((set, get) => ({
	gps: {
		lat: 0,
		lng: 0,
		altitude: null,
		accuracy: null,
	},
	orientation: {
		alpha: 0,
		beta: 0,
		gamma: 0,
		heading: 0,
	},
	update: (data) => {
		set((state) => ({
			gps: {
				...state.gps,
				...(data.gps ?? {}),
			},
			orientation: {
				...state.orientation,
				...(data.orientation ?? {}),
			},
		}))
	},
	snapshot: () => {
		const state = get()

		const gps = Object.freeze({ ...state.gps })
		const orientation = Object.freeze({ ...state.orientation })

		return Object.freeze({
			gps,
			orientation,
			capturedAt: new Date().toISOString(),
		})
	},
}))

export { useTelemetryStore }
export type { TelemetryState, TelemetryStore, TelemetryUpdate }

