import { useState, type CSSProperties, type ReactNode } from 'react'
import { PortalContainerContext } from './portal'

/**
 * Replacement-side stages. They mirror the prototype kit's WebStage and
 * MobileStage box for box (same card, padding, 390px phone, height), and add
 * the `.lib-scope` that carries the brand theme. The mobile stage is also the
 * portal container, so Drawer, Toaster, Popover and Select open INSIDE the
 * phone stage, never on document.body.
 */

const ink = '#172320'
const line = '#E2E7E5'
const bg = '#F6F8F7'

export function WebReplacementStage({ height, children }: { height?: number; children: ReactNode }) {
  return (
    <div
      className="lib-scope"
      data-replacement-stage="web"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${line}`,
        borderRadius: 10,
        padding: 14,
        minHeight: 60,
        height,
        overflow: height !== undefined ? 'auto' : 'visible',
        position: 'relative',
        color: ink,
      }}
    >
      {children}
    </div>
  )
}

export function MobileReplacementStage({ height, children }: { height: number; children: ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <div
      ref={setContainer}
      className="lib-scope"
      data-replacement-stage="mobile"
      style={
        {
          width: 390,
          maxWidth: '100%',
          height,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 14,
          border: `1px solid ${line}`,
          background: bg,
          isolation: 'isolate',
          transform: 'translateZ(0)', // a containing block for position:fixed portal content
          fontSize: 16,
          lineHeight: '24px',
        } as CSSProperties
      }
    >
      <PortalContainerContext.Provider value={container}>
        <div style={{ height: '100%', overflowY: 'auto', padding: 14, boxSizing: 'border-box' }}>{children}</div>
      </PortalContainerContext.Provider>
    </div>
  )
}
