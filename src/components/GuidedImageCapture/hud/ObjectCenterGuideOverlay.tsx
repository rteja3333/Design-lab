import { StyleSheet, Text, View } from 'react-native'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

interface ObjectCenterGuideOverlayProps {
  label: string | null
  score: number
  instruction: string
  centered: boolean
  box: Box | null
  ready: boolean
  running: boolean
  error: string | null
}

function instructionArrow(instruction: string, centered: boolean) {
  if (centered) return '◎'
  if (instruction.toLowerCase().includes('left')) return '←'
  if (instruction.toLowerCase().includes('right')) return '→'
  if (instruction.toLowerCase().includes('up')) return '↑'
  if (instruction.toLowerCase().includes('down')) return '↓'
  return '•'
}

const ObjectCenterGuideOverlay: React.FC<ObjectCenterGuideOverlayProps> = ({
  label,
  score,
  instruction,
  centered,
  box,
  ready,
  running,
  error,
}) => {
  const arrow = instructionArrow(instruction, centered)
  const statusText = error
    ? `Detector unavailable: ${error}`
    : !ready
      ? 'Loading detector model...'
      : !label
        ? running
          ? 'Looking for object...'
          : 'Preparing detection...'
        : instruction

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.targetZone, centered && styles.targetZoneCentered]} />

      {box ? (
        <View
          style={[
            styles.detectedBox,
            centered ? styles.detectedBoxCentered : styles.detectedBoxWarning,
            {
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            },
          ]}
        />
      ) : null}

      <View style={styles.topBanner}>
        <Text style={styles.statusText}>
          {arrow} {statusText}
        </Text>
        {label ? (
          <Text style={styles.metaText}>
            Tracking: {label} ({Math.round(score * 100)}%)
          </Text>
        ) : (
          <Text style={styles.metaText}>Main object tracking enabled</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },
  targetZone: {
    position: 'absolute',
    left: '28%',
    top: '24%',
    width: '44%',
    height: '52%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  targetZoneCentered: {
    borderColor: '#60e591',
    backgroundColor: 'rgba(96,229,145,0.08)',
  },
  detectedBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 10,
  },
  detectedBoxWarning: {
    borderColor: '#ffcc5c',
    backgroundColor: 'rgba(255,204,92,0.12)',
  },
  detectedBoxCentered: {
    borderColor: '#60e591',
    backgroundColor: 'rgba(96,229,145,0.15)',
  },
  topBanner: {
    position: 'absolute',
    top: 42,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '90%',
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  metaText: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textTransform: 'capitalize',
  },
})

export { ObjectCenterGuideOverlay }
