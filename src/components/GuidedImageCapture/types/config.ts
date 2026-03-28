const enum TEST_MODE_VALUES {
	OFF = 0,
	BYPASS_VALIDATION = 1,
	RUN_VALIDATION_ON_TEST_TASK = 2,
}

const CONFIG = {

    // ── developer flags ──────────────────────────
    DEV_MODE: true, // shows DevOverlay telemetry panel
    TEST_MODE: TEST_MODE_VALUES.OFF as TEST_MODE_VALUES, // enables test mode behavior

    // ── timing ───────────────────────────────────
    TEST_MODE_IMAGE_VALIDATION_DELAY_MS: 5000, // simulated image validation delay in VALIDATE
    TEST_MODE_IMAGE_SUBMISSION_DELAY_MS: 2000, // simulated image submission delay in SUBMIT
    INSTRUCTOR_LOOP_INTERVAL_MS: 1732, // how often instruction loop evaluates refresh triggers
    VALIDATOR_LOOP_INTERVAL_MS: 1414, // how often background loop fires

    // ── GPS ──────────────────────────────────────
    GPS_TOLERANCE_EXTRA_METERS: 10, // added on top of task.capture_location.radius_meters

    // ── compass ──────────────────────────────────
    COMPASS_TOLERANCE_DEGREES: 25, // acceptable heading deviation
    NAVIGATE_TOLERANCE_DEGREES: 15, // for giving "slight left/right" instructions

    // ── distance ─────────────────────────────────
    DISTANCE_UNAVAILABLE_PASSES: true, // if distance is null, treat check as pass

    // ── sensor update intervals ──────────────────
    LOCATION_UPDATE_MS: 1000, // GPS update frequency
    DEVICE_MOTION_UPDATE_MS: 250, // accelerometer/gyro update frequency
    MAGNETOMETER_UPDATE_MS: 250, // compass update frequency
    LIGHT_SENSOR_UPDATE_MS: 500, // light sensor update frequency

    // -- other constants --
    POST_PROCESS_IMAGE: true, // whether to run post-processing on captured image before validation/submission

} as const

export { CONFIG, TEST_MODE_VALUES }
export default CONFIG

