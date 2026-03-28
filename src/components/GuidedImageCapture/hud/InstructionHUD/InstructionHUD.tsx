import { BlurView } from 'expo-blur'
import { StyleSheet, Text, View } from 'react-native'
import { guidedTheme } from '../theme'
import type { InstructionHUDState } from './useInstructionHUD'

type InstructionHUDProps = InstructionHUDState

const InstructionHUD: React.FC<InstructionHUDProps> = ({ instruction, index, total }) => {
    if (!instruction) {
        return null
    }

    return (
        <View style={styles.container} pointerEvents="none">
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                {/* Instruction title */}
                <Text style={styles.title}>{instruction.title}</Text>
                {/* Instruction message */}
                <Text style={styles.message}>{instruction.message}</Text>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1,
        top: 0,
        left: 0,
        right: 0,
    },
    blur: {
        width: '100%',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 14,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    title: {
        color: guidedTheme.colors.title,
        textAlign: 'center',
        fontSize: 14,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        marginBottom: 8,
        fontWeight: '700',
    },
    message: {
        color: guidedTheme.colors.text,
        textAlign: 'center',
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '800',
        textTransform: 'none',
        marginBottom: 12,
    },
});

export { InstructionHUD }

