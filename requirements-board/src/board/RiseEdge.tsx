import { BaseEdge, type EdgeProps } from '@xyflow/react'

/**
 * Mapped's feature-to-epic line: straight up from the feature's top to the epic's
 * foot. The epic always spans its features there, so no bend is needed.
 */
export function RiseEdge({ id, sourceY, targetX, targetY, style }: EdgeProps) {
  return <BaseEdge id={id} path={`M ${targetX},${sourceY} L ${targetX},${targetY}`} style={style} />
}
