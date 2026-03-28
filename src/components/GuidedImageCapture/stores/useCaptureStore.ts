import { create } from 'zustand'

import defaultTaskJson from '../types/task.json'
import type { CaptureResult, TaskJson, TelemetrySnapshot } from '../types/types'

interface CaptureStore {
	task: TaskJson | null
	imageUri: string | null
	telemetrySnapshot: TelemetrySnapshot | null
	isPreviewFrozen: boolean
	setTask: (task: TaskJson) => void
	setImage: (uri: string, snap: TelemetrySnapshot) => void
	setPreviewFrozen: (isFrozen: boolean) => void
	reset: () => void
	buildResult: () => CaptureResult | null
}

const DEFAULT_TASK: TaskJson = defaultTaskJson as TaskJson

const useCaptureStore = create<CaptureStore>()((set, get) => ({
	task: DEFAULT_TASK,
	imageUri: null,
	telemetrySnapshot: null,
	isPreviewFrozen: false,
	setTask: (task) => {
		set({ task })
	},
	setImage: (uri, snap) => {
		set({ imageUri: uri, telemetrySnapshot: snap })
	},
	setPreviewFrozen: (isFrozen) => {
		set({ isPreviewFrozen: isFrozen })
	},
	reset: () => {
		set({ imageUri: null, telemetrySnapshot: null, isPreviewFrozen: false })
	},
	buildResult: () => {
		const { task, imageUri, telemetrySnapshot } = get()

		if (!imageUri || !telemetrySnapshot) {
			return null
		}

		return {
			task_id: task?.task_id ?? '',
			shot_id: task?.capture_requirements?.[0]?.shot_id ?? '',
			imageUri,
			telemetry: telemetrySnapshot,
			submittedAt: new Date().toISOString(),
		}
	},
}))

export { useCaptureStore }
export type { CaptureStore }

