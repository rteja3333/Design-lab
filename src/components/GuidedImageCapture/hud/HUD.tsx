import { StyleSheet, View } from 'react-native'

import { useEngineStore } from '../stores/useEngineStore'
import { ControlBar } from './ControlBar/ControlBar'
import { useControlBar } from './ControlBar/useControlBar'
import { DevOverlay } from './DevOverlay/DevOverlay'
import { useDevOverlay } from './DevOverlay/useDevOverlay'
import { InstructionHUD } from './InstructionHUD/InstructionHUD'
import { useInstructionHUD } from './InstructionHUD/useInstructionHUD'
import { Scanner } from './Scanner/Scanner'
import { useScanner } from './Scanner/useScanner'

const HUD: React.FC = () => {
    const instructionData = useInstructionHUD()
    const controlBarData = useControlBar()
    const devOverlayData = useDevOverlay()
    const scannerData = useScanner()
    const currentState = useEngineStore((state) => state.currentState)

    return (
        <View style={styles.container}>
            {/* Black overlay during START state */}
            {currentState === 'START' && <View style={styles.blackOverlay} />}

            {/* Instruction HUD at top */}
            <InstructionHUD
                instruction={instructionData.instruction}
                index={instructionData.index}
                total={instructionData.total}
            />

            {/* Scanner line shown only during VALIDATE */}
            <Scanner isActive={scannerData.isActive} />

            {/* Right-edge centered placement host for DevOverlay drawer */}
            <View pointerEvents="box-none" style={styles.devOverlayAnchor}>
                <DevOverlay
                    telemetry={devOverlayData.telemetry}
                    engineState={devOverlayData.engineState}
                    nextState={devOverlayData.nextState}
                    validationStatus={devOverlayData.validationStatus}
                />
            </View>

            {/* Control bar at bottom */}
            <View style={styles.controlBarContainer}>
                <ControlBar
                    label={controlBarData.label}
                    gateState={controlBarData.gateState}
                    onPress={controlBarData.onPress}
                    onPrev={controlBarData.onPrev}
                    onNext={controlBarData.onNext}
                    canPrev={controlBarData.canPrev}
                    canNext={controlBarData.canNext}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'box-none',
    },
    blackOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        zIndex: 1,
    },
    controlBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'auto',
    },
    devOverlayAnchor: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
        justifyContent: 'center',
        alignItems: 'flex-end',
        pointerEvents: 'box-none',
    },
})

export { HUD }

