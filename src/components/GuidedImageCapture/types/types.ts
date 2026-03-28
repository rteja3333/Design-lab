// All shared TypeScript types for Guided Image Capture module.
//
// Exports:
//   TaskJson
//   EngineState
//   GateState
//   ORDER
//   Instruction (with step, type, title, message)
//   ValidationResult
//   TelemetrySnapshot
//   CaptureResult

interface TaskJson {
    task_id: string
    report_id: string
    issued_at: string
    expires_at: string

    capture_location: {
        lat: number
        lng: number
        radius_meters: number
        landmark_hint: string
    }

    capture_orientation: {
        facing_direction: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
        distance_from_subject_meters: { min: number; max: number }
        subject_hint: string
        orientation: 'portrait' | 'landscape'
    }

    subject: {
        object_of_interest: string
        fault_description: string
        focus_region: string
        secondary_context: string[]
        background_context: string[]
    }

    capture_requirements: {
        shot_id: string
        label: string
        media_type: string
        priority: number
    }[]

    quality_thresholds: {
        min_resolution: string
        max_blur_score: number
        min_brightness: number
        max_tilt_degrees: number
        file_size_mb: { min: number; max: number }
    }
}

type EngineState =
    | 'START'
    | 'NAVIGATE'
    | 'ALIGN'
    | 'CAPTURE'
    | 'VALIDATE'
    | 'RETAKE'
    | 'SUBMIT'
    | 'DONE'

const ORDER: Record<EngineState, number> = {
    START: 0,
    NAVIGATE: 1,
    ALIGN: 2,
    CAPTURE: 3,
    RETAKE: 4,
    VALIDATE: 5,
    SUBMIT: 6,
    DONE: 7,
}

type GateState = 'STATIC' | 'PROGRESS' | 'REGRESS'

interface Instruction {
    step: number // index within current state's queue (0-based)
    type: EngineState // matches the state that generated it
    title: string
    message: string
}

const enum ValidationResult {
    SUCCESS = 0,
    DEFAULT_FAILURE = 1,
    
    // placeholder for additional failure types
    DUMMY = 2, 

    // Submit failure
    SUBMIT_FAILURE = 9,

    // Post-capture quality failures
    RESOLUTION_FAILURE = 10,
    BLUR_FAILURE = 11,
    BRIGHTNESS_FAILURE = 12,
    TILT_FAILURE = 13,
    FILE_SIZE_FAILURE = 14,
}

interface TelemetrySnapshot {
    gps: {
        lat: number
        lng: number
        altitude: number | null  // metres, null if unavailable
        accuracy: number | null  // metres radius of uncertainty
    }

    orientation: {
        alpha: number  // yaw   — rotation around Z axis (0 to 2π)
        beta: number  // pitch — rotation around X axis (-π to π)
        gamma: number  // roll  — rotation around Y axis (-π/2 to π/2)
        heading: number  // degrees 0–360, compass direction (from Magnetometer)
    }

    capturedAt: string  // ISO timestamp of when snapshot was taken
}

interface CaptureResult {
    task_id: string
    shot_id: string
    imageUri: string
    telemetry: TelemetrySnapshot
    submittedAt: string // ISO timestamp
}

export type {
    CaptureResult,
    EngineState,
    GateState,
    Instruction, TaskJson, TelemetrySnapshot
}

export { ORDER, ValidationResult }

