import { useEffect, useRef } from 'react'
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { guidedTheme } from '../theme'
import type { ControlBarState } from './useControlBar'

type ControlBarProps = ControlBarState

const ControlBar = ({
    label,
    gateState,
    onPress,
    onPrev,
    onNext,
    canPrev,
    canNext,
}: ControlBarProps) => {
    const isActive = gateState !== 'STATIC'
    const pulseProgress = useRef(new Animated.Value(0)).current
    const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null)

    useEffect(() => {
        pulseLoopRef.current?.stop()
        pulseLoopRef.current = null

        if (isActive) {
            pulseProgress.setValue(0)
            pulseLoopRef.current = Animated.loop(
                Animated.timing(pulseProgress, {
                    toValue: 1,
                    duration: 2200,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            )
            pulseLoopRef.current.start()
            return () => {
                pulseLoopRef.current?.stop()
                pulseLoopRef.current = null
            }
        }

        pulseProgress.stopAnimation()
        pulseProgress.setValue(0)
    }, [isActive, pulseProgress])

    const getButtonBgColor = (): string => {
        switch (gateState) {
            case 'PROGRESS':
                return guidedTheme.colors.ready
            case 'REGRESS':
                return guidedTheme.colors.error
            case 'STATIC':
                return guidedTheme.colors.warning
            default:
                return guidedTheme.colors.warning
        }
    }

    const getButtonBorderColor = (): string => {
        switch (gateState) {
            case 'PROGRESS':
                return guidedTheme.colors.readyBorder
            case 'REGRESS':
                return guidedTheme.colors.errorBorder
            case 'STATIC':
                return guidedTheme.colors.warning
            default:
                return guidedTheme.colors.warning
        }
    }

    const getButtonShadowColor = (): string => {
        switch (gateState) {
            case 'PROGRESS':
                return guidedTheme.colors.readyGlow
            case 'REGRESS':
                return 'rgba(255, 122, 118, 0.5)'
            case 'STATIC':
                return 'rgba(247, 212, 95, 0.45)'
            default:
                return 'rgba(247, 212, 95, 0.45)'
        }
    }

    const pulseScale = pulseProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.42],
    })

    const pulseOpacity = pulseProgress.interpolate({
        inputRange: [0, 0.35, 0.75, 1],
        outputRange: [0.24, 0.18, 0.08, 0],
    })

    return (
        <View style={styles.container}>
            {/* Glass panel wrapper for the full control bar */}
            <View style={styles.panel}>
                <View style={styles.row}>
                    {/* Left nav: previous instruction */}
                    <View style={styles.sideColumn}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Previous instruction"
                            onPress={onPrev}
                            disabled={!canPrev}
                            activeOpacity={0.75}
                            style={[
                                styles.navButton,
                                !canPrev ? styles.navButtonDisabled : null,
                            ]}>
                            <Text style={styles.navButtonText}>←</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Center action: shutter button + current state label */}
                    <View style={styles.centerColumn}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={label}
                            onPress={onPress}
                            activeOpacity={0.8}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.shutterButton}>
                            <View style={styles.shutterStage}>
                                {isActive ? (
                                    <Animated.View
                                        pointerEvents="none"
                                        style={[
                                            styles.pulseRing,
                                            {
                                                borderColor: getButtonBorderColor(),
                                                opacity: pulseOpacity,
                                                transform: [{ scale: pulseScale }],
                                            },
                                        ]}
                                    />
                                ) : null}
                                <View
                                    style={[
                                        styles.shutterOuter,
                                        {
                                            borderColor: getButtonBorderColor(),
                                            shadowColor: getButtonShadowColor(),
                                        },
                                    ]}>
                                    <View
                                        style={[
                                            styles.shutterInner,
                                            {
                                                backgroundColor: getButtonBgColor(),
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.label}>{label}</Text>
                    </View>

                    {/* Right nav: next instruction */}
                    <View style={styles.sideColumn}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Next instruction"
                            onPress={onNext}
                            disabled={!canNext}
                            activeOpacity={0.75}
                            style={[
                                styles.navButton,
                                !canNext ? styles.navButtonDisabled : null,
                            ]}>
                            <Text style={styles.navButtonText}>→</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    // Anchors the bar to the bottom of the HUD overlay.
    container: {
        zIndex: 1,
        elevation: 30,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'box-none',
    },
    // Frosted panel background and rounded top corners.
    panel: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 24,
        pointerEvents: 'auto',
        ...(Platform.OS === 'android'
            ? { elevation: 20 }
            : {}),
    },
    // Main horizontal layout: left nav, center shutter, right nav.
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // Fixed-width side slots for previous/next arrow buttons.
    sideColumn: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerColumn: {
        flex: 1,
        alignItems: 'center',
    },
    // Circular arrow button style.
    navButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 248, 224, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 248, 224, 0.3)',
    },
    // Muted arrow style when nav is unavailable.
    navButtonDisabled: {
        opacity: 0.4,
        backgroundColor: 'rgba(255, 248, 224, 0.05)',
        borderColor: 'rgba(255, 248, 224, 0.15)',
    },
    navButtonPressed: {
        transform: [{ scale: 0.95 }],
        backgroundColor: 'rgba(255, 248, 224, 0.2)',
    },
    // Arrow glyph styling.
    navButtonText: {
        color: guidedTheme.colors.ghostButtonLabel,
        fontSize: 20,
        fontWeight: '700',
    },
    // Press target for the center shutter control.
    shutterButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterStage: {
        width: 92,
        height: 92,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 3,
    },
    // Outer shutter ring with state-driven border and glow.
    shutterOuter: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOpacity: 0.75,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 16,
        elevation: 10,
    },
    // Inner shutter fill with state-driven color.
    shutterInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    // Subtle press feedback for center shutter.
    buttonPressed: {
        transform: [{ scale: 0.97 }],
    },
    // State label shown below the center shutter button.
    label: {
        marginTop: 8,
        color: guidedTheme.colors.ghostButtonLabel,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
})

export { ControlBar }

