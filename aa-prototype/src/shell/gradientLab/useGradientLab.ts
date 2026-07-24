import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AA_DEFAULT_GRADIENT,
  loadStoredConfig,
  saveConfig,
  type GradientField,
  type LowerFade,
  type MobileGradientConfig,
} from '../../theme/mobileGradient'
import { GRADIENT_LAB_ENABLED } from '../../theme/gradientLabGate'

/** Below this viewport width the open panel is capped to the left gutter so it
 *  never covers the centred device. */
export const LAB_NARROW_BREAKPOINT = 1024

/** Top-level (non radial-field) values the lab can patch in one go. */
export interface GradientPatch {
  enabled?: boolean
  intensity?: number
  baseColor?: string
  lowerFade?: Partial<LowerFade>
}

/** The live tuning surface the Gradient Lab drives. `null` when the gate is off. */
export interface GradientLabController {
  patch: (partial: GradientPatch) => void
  setField: (which: 'accent' | 'identity', partial: Partial<GradientField>) => void
  /** Replace the whole config (used by the preset switcher). */
  applyPreset: (config: MobileGradientConfig) => void
  resetToDefault: () => void
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
}

export interface UseMobileGradientResult {
  config: MobileGradientConfig
  controller: GradientLabController | null
}

function applyPatch(prev: MobileGradientConfig, partial: GradientPatch): MobileGradientConfig {
  return {
    ...prev,
    enabled: partial.enabled ?? prev.enabled,
    intensity: partial.intensity ?? prev.intensity,
    baseColor: partial.baseColor ?? prev.baseColor,
    lowerFade: partial.lowerFade ? { ...prev.lowerFade, ...partial.lowerFade } : prev.lowerFade,
  }
}

/**
 * Source the mobile atmosphere config + (behind the gate) its live controller.
 *
 * Gate OFF → the checked-in `AA_DEFAULT_GRADIENT` and a null controller;
 * localStorage is never read, so the lab removes cleanly. Gate ON → the
 * persisted/live config plus a controller. React state + CSS custom properties
 * only — no extra state-management or colour-picker dependency.
 *
 * The setters use the `setConfig(prev => …)` updater form so rapid, sequential
 * edits (dragging a slider) compose correctly; persistence lives in an effect
 * keyed on `config` (never a side effect inside the reducer), so each committed
 * change writes exactly once.
 *
 * The hooks below run unconditionally (the gate is a build-time constant), so
 * the branch on `GRADIENT_LAB_ENABLED` only chooses what is returned.
 */
export function useMobileGradient(): UseMobileGradientResult {
  const [config, setConfig] = useState<MobileGradientConfig>(() =>
    GRADIENT_LAB_ENABLED ? loadStoredConfig() : AA_DEFAULT_GRADIENT,
  )
  // Start collapsed behind the toggle button on every viewport — the lab is a
  // temporary tuning tool, kept out of the way until deliberately opened.
  const [panelOpen, setPanelOpen] = useState(false)

  // Persist on change only (skip the initial mount so merely opening /mobile
  // never rewrites the key with the untouched default).
  const persistedOnce = useRef(false)
  useEffect(() => {
    if (!GRADIENT_LAB_ENABLED) return
    if (!persistedOnce.current) {
      persistedOnce.current = true
      return
    }
    saveConfig(config)
  }, [config])

  const patch = useCallback((partial: GradientPatch) => {
    setConfig((prev) => applyPatch(prev, partial))
  }, [])

  const setField = useCallback((which: 'accent' | 'identity', partial: Partial<GradientField>) => {
    setConfig((prev) => ({ ...prev, [which]: { ...prev[which], ...partial } }))
  }, [])

  const applyPreset = useCallback((next: MobileGradientConfig) => {
    setConfig(next)
  }, [])

  const resetToDefault = useCallback(() => {
    setConfig(AA_DEFAULT_GRADIENT)
  }, [])

  if (!GRADIENT_LAB_ENABLED) {
    return { config: AA_DEFAULT_GRADIENT, controller: null }
  }

  return {
    config,
    controller: { patch, setField, applyPreset, resetToDefault, panelOpen, setPanelOpen },
  }
}
