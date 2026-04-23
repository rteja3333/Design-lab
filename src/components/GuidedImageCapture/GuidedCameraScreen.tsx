// GuidedCameraScreen.tsx
// Receives task.json prop, mounts useEngine, and composes CameraView + HUD.
// No logic, orchestration only.
// No direct state or store access.
//
// Exports: React.FC<{ task: TaskJson }>
//
// Depends on: ../types/types, engine/useEngine, hud/HUD

import { StatusBar, StyleSheet, Text, View } from 'react-native'

import { CameraView, useCameraPermissions } from 'expo-camera'
import { Image } from 'expo-image'
import { useEffect, useRef, useState } from 'react'
import { useEngine } from './engine/useEngine'
import { registerCaptureFrame } from './engine/useEngineUtils'
import { useObjectCenterGuide } from './hooks/useObjectCenterGuide'
import { useTelemetry } from './hooks/useTelemetry'
import { HUD } from './hud/HUD'
import { ObjectCenterGuideOverlay } from './hud/ObjectCenterGuideOverlay'
import { useCaptureStore } from './stores/useCaptureStore'
import { useEngineStore } from './stores/useEngineStore'
import type { CaptureResult, TaskJson } from './types/types'
import CONFIG from './types/config'

interface GuidedCameraScreenProps {
	task: TaskJson
	onComplete: (result: CaptureResult) => void
}

const GuidedCameraScreen: React.FC<GuidedCameraScreenProps> = ({ task, onComplete }) => {
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

	// Start sensor and location subscriptions
	useTelemetry()

	// Mount engine and get handlers
	const { onButtonPress } = useEngine()
	const objectGuide = useObjectCenterGuide({
		cameraRef,
		active:
			!!permission?.granted &&
			!isPreviewFrozen &&
			currentState !== 'START',
		cameraReady: isCameraReady,
	})

	useEffect(() => {
		console.log('[GuidedCameraScreen] state changed', { currentState, isPreviewFrozen })
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
			if (CONFIG.DEV_MODE) console.log('[GuidedCameraScreen:DONE]', result)
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

				{currentState !== 'START' ? (
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

				{/* HUD overlay with instructions, controls, and dev overlay */}
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

export { GuidedCameraScreen }

