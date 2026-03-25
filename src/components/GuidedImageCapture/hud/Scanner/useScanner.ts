import { useEngineStore } from '../../stores/useEngineStore'

interface ScannerState {
    isActive: boolean
}

const useScanner = (): ScannerState => {
    const currentState = useEngineStore((state) => state.currentState)

    return {
        isActive: currentState === 'VALIDATE',
    }
}

export { useScanner }
export type { ScannerState }

