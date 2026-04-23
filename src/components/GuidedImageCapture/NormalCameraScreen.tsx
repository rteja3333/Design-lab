// NormalCameraScreen.tsx
// Simplified camera screen with linear flow: START → CAPTURE → SUBMIT → DONE.
// Reuses the same HUD, stores, and camera infrastructure as GuidedCameraScreen
// but without navigation/alignment validation or instructor loops.

import { StatusBar, StyleSheet, Text, View } from 'react-native'

import { CameraView, useCameraPermissions } from 'expo-camera'
import { Image } from 'expo-image'
import { useEffect, useRef, useState } from 'react'
import { useNormalEngine } from './engine/useNormalEngine'
import { registerCaptureFrame } from './engine/useEngineUtils'
import { useObjectCenterGuide } from './hooks/useObjectCenterGuide'
import { HUD } from './hud/HUD'
import { ObjectCenterGuideOverlay } from './hud/ObjectCenterGuideOverlay'
import { useCaptureStore } from './stores/useCaptureStore'
import { useEngineStore } from './stores/useEngineStore'
import type { CaptureResult, TaskJson } from './types/types'
import CONFIG from './types/config'

interface NormalCameraScreenProps {
	task: TaskJson
	onComplete: (result: CaptureResult) => void
}

const NormalCameraScreen: React.FC<NormalCameraScreenProps> = ({ task, onComplete }) => {
	const ENABLE_DETECTOR_IN_NORMAL_FLOW = false
	const cameraRef = useRef<CameraView | null>(null)
	const [permission, requestPermission] = useCameraPermissions()
	const [isCameraReady, setIsCameraReady] = useState(false)
	const isPreviewFrozen = useCaptureStore((state) => state.isPreviewFrozen)
	const frozenImageUri = useCaptureStore((state) => state.imageUri)
	const currentState = useEngineStore((state) => state.currentState)

	// Initialize task in store on mount
	useEffect(() => {
		useCaptureStore.getState().setTask(task)
	}, [task])

	// Request camera permission on mount if not yet determined
	useEffect(() => {
		if (permission && !permission.granted && permission.canAskAgain) {
			requestPermission()
		}
	}, [permission, requestPermission])

	// Mount simplified engine
	const { onButtonPress } = useNormalEngine()
	const objectGuide = useObjectCenterGuide({
		cameraRef,
		active:
			ENABLE_DETECTOR_IN_NORMAL_FLOW &&
			!!permission?.granted &&
			!isPreviewFrozen &&
			currentState !== 'START',
		cameraReady: isCameraReady,
	})

	useEffect(() => {
		console.log('[NormalCameraScreen] state changed', { currentState, isPreviewFrozen })
	}, [currentState, isPreviewFrozen])

	useEffect(() => {
		if (!permission?.granted || isCameraReady) return
		const timer = setTimeout(() => setIsCameraReady(true), 2000)
		return () => clearTimeout(timer)
	}, [isCameraReady, permission?.granted])

	// Register capture frame handler
	useEffect(() => {
		return registerCaptureFrame(async () => {
			if (!cameraRef.current) {
				return null
			}

			const photo = await cameraRef.current.takePictureAsync({
				quality: 0.85,
				skipProcessing: true,
			})

			return photo?.uri ?? null
		})
	}, [])

	// Handle DONE state
	useEffect(() => {
		if (currentState === 'DONE') {
			const result = useCaptureStore.getState().buildResult()
			if (CONFIG.DEV_MODE) console.log('[NormalCameraScreen:DONE]', result)
			if (result) onComplete(result)
		}
	}, [currentState])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			useEngineStore.getState().reset()
			useCaptureStore.getState().reset()
		}
	}, [])

	if (!permission?.granted) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={styles.permissionText}>Camera access is required to use this feature.</Text>
			</View>
		)
	}

	return (
		<>
			<StatusBar hidden />
			<View style={styles.container}>
				<CameraView
					ref={cameraRef}
					style={styles.cameraView}
					facing="back"
					active={!isPreviewFrozen}
					onCameraReady={() => setIsCameraReady(true)}
				/>

				{isPreviewFrozen && frozenImageUri ? (
					<Image source={{ uri: frozenImageUri }} style={styles.frozenFrame} contentFit="cover" />
				) : null}

				{ENABLE_DETECTOR_IN_NORMAL_FLOW && currentState !== 'START' ? (
					<ObjectCenterGuideOverlay
						label={objectGuide.label}
						score={objectGuide.score}
						instruction={objectGuide.instruction}
						centered={objectGuide.centered}
						box={objectGuide.box}
						ready={objectGuide.ready}
						running={objectGuide.running}
						error={objectGuide.error}
					/>
				) : null}

			{/* HUD overlay with instructions, controls */}
				<HUD onButtonPress={onButtonPress} />
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
	},
	cameraView: {
		flex: 1,
	},
	frozenFrame: {
		...StyleSheet.absoluteFillObject,
	},
	permissionContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#000000',
		padding: 24,
	},
	permissionText: {
		color: '#ffffff',
		fontSize: 16,
		textAlign: 'center',
	},
})

export { NormalCameraScreen }
