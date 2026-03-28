import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import CONFIG from '../../types/config'
import type { DevOverlayState } from './useDevOverlay'

type DevOverlayProps = DevOverlayState

const formatNumber = (num: number | null): string => {
	if (num === null || num === undefined) {
		return 'N/A'
	}
	return typeof num === 'number' ? num.toFixed(4) : String(num)
}

const DevOverlay: React.FC<DevOverlayProps> = ({ telemetry, engineState, nextState, validationStatus }) => {
	const [isOpen, setIsOpen] = useState(false)

	if (!CONFIG.DEV_MODE || !telemetry) {
		return null
	}

	return (
		<View style={styles.drawerRow}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={isOpen ? 'Hide dev overlay' : 'Show dev overlay'}
				onPress={() => setIsOpen((prev) => !prev)}
				style={styles.drawerTab}>
				<Text style={styles.drawerTabText}>{isOpen ? 'DEV >' : '< DEV'}</Text>
			</Pressable>

			{isOpen && (
				<View style={styles.container}>
					<View style={styles.headerRow}>
						<Text style={styles.header}>DEV OVERLAY</Text>
						<Text style={styles.pill}>LIVE</Text>
					</View>

					<ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}>
						<Text style={styles.sectionTitle}>GPS</Text>
						<View style={styles.row}>
							<Text style={styles.label}>Lat</Text>
							<Text style={styles.value}>{formatNumber(telemetry.gps.lat)}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Lng</Text>
							<Text style={styles.value}>{formatNumber(telemetry.gps.lng)}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Altitude</Text>
							<Text style={styles.value}>{formatNumber(telemetry.gps.altitude)} m</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Accuracy</Text>
							<Text style={styles.value}>{formatNumber(telemetry.gps.accuracy)} m</Text>
						</View>

						<Text style={styles.sectionTitle}>Orientation</Text>
						<View style={styles.row}>
							<Text style={styles.label}>Heading</Text>
							<Text style={styles.value}>{formatNumber(telemetry.orientation.heading)}°</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Alpha</Text>
							<Text style={styles.value}>{formatNumber((telemetry.orientation.alpha * 180) / Math.PI)}°</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Beta</Text>
							<Text style={styles.value}>{formatNumber((telemetry.orientation.beta * 180) / Math.PI)}°</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Gamma</Text>
							<Text style={styles.value}>{formatNumber((telemetry.orientation.gamma * 180) / Math.PI)}°</Text>
						</View>

						<Text style={styles.sectionTitle}>Engine</Text>
						<View style={styles.row}>
							<Text style={styles.label}>State</Text>
							<Text style={styles.value}>{engineState ?? 'IDLE'}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Next State</Text>
							<Text style={styles.value}>{nextState ?? 'IDLE'}</Text>
						</View>
						<View style={styles.row}>
							<Text style={styles.label}>Gate</Text>
							<Text style={styles.value}>{validationStatus}</Text>
						</View>
					</ScrollView>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	drawerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	drawerTab: {
		width: 52,
		height: 56,
		borderTopLeftRadius: 14,
		borderBottomLeftRadius: 14,
		backgroundColor: 'rgba(16, 22, 26, 0.55)',
		borderWidth: 1,
		borderColor: 'rgba(141, 238, 170, 0.5)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	drawerTabText: {
		color: '#8deea9',
		fontSize: 10,
		fontWeight: '800',
		letterSpacing: 0.6,
	},
	container: {
		width: 240,
		height: 320,
		backgroundColor: 'rgba(14, 18, 22, 0.9)',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'rgba(141, 238, 170, 0.55)',
		paddingHorizontal: 10,
		paddingTop: 10,
		paddingBottom: 8,
		marginLeft: 8,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 8,
	},
	header: {
		color: '#8deea9',
		fontSize: 11,
		fontWeight: '800',
		letterSpacing: 0.7,
	},
	pill: {
		color: '#10161a',
		fontSize: 9,
		fontWeight: '800',
		letterSpacing: 0.4,
		backgroundColor: '#8deea9',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 999,
	},
	sectionTitle: {
		color: '#7bc3ff',
		fontSize: 9,
		fontWeight: '800',
		marginTop: 8,
		marginBottom: 5,
		letterSpacing: 0.4,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 3,
		paddingVertical: 2,
	},
	label: {
		color: '#bdc6d0',
		fontSize: 10,
		fontWeight: '600',
		flex: 1,
	},
	value: {
		color: '#8deea9',
		fontSize: 10,
		fontWeight: '700',
		fontFamily: 'monospace',
		textAlign: 'right',
		flex: 1,
	},
})

export { DevOverlay }

