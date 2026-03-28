import { useEffect, useRef } from 'react'
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native'
import type { ScannerState } from './useScanner'

type ScannerProps = ScannerState

const Scanner: React.FC<ScannerProps> = ({ isActive }) => {
    const progress = useRef(new Animated.Value(0)).current
    const loopRef = useRef<Animated.CompositeAnimation | null>(null)
    const screenHeight = Dimensions.get('window').height
    const scanRange = screenHeight - 60 // Leave some margin at top/bottom

    useEffect(() => {
        if (isActive) {
            loopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(progress, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.timing(progress, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.cubic),
                        useNativeDriver: true,
                    }),
                ]),
            )
            loopRef.current.start()
            return () => {
                loopRef.current?.stop()
                loopRef.current = null
            }
        }

        loopRef.current?.stop()
        loopRef.current = null
        progress.setValue(0)
    }, [isActive, progress])

    if (!isActive) {
        return null
    }

    const translateY = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, scanRange],
    })

    return (
        <View pointerEvents="none" style={styles.container}>
            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
                <View style={styles.outerGlow} />
                <View style={styles.innerGlow} />
                <View style={styles.line} />
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 18,
        right: 18,
        height: '100%',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        zIndex: 2,
    },
    scanLine: {
        height: 28,
        justifyContent: 'center',
    },
    line: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 3,
        borderRadius: 999,
        backgroundColor: '#69ff9b',
        shadowColor: '#69ff9b',
        shadowOpacity: 0.95,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    },
    innerGlow: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(105, 255, 155, 0.24)',
    },
    outerGlow: {
        position: 'absolute',
        left: -6,
        right: -6,
        height: 22,
        borderRadius: 999,
        backgroundColor: 'rgba(105, 255, 155, 0.1)',
    },
})

export { Scanner }

