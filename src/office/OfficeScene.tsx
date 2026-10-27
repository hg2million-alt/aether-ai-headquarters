import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { colors } from '../lib/tokens'
import { layout } from '../lib/office'
import type { AgentId, AgentStatus } from '../lib/types'
import { m, unit } from './materials'
import { B, Robot } from './Robot'
import { staticMeshes } from './staticScene'

function Rig() {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.position.set(14, 12, 14)
    camera.lookAt(0, 0.8, 0)
    camera.zoom = Math.min(size.width / 10.4, size.height / 8)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

/** Cenário fixo: uma malha por material. */
function Static() {
  return (
    <>
      {staticMeshes.map(([k, g]) => (
        <mesh key={k} geometry={g} material={m[k]} />
      ))}
    </>
  )
}

function Station({ id, status, selected, still, onSelect }: { id: AgentId; status: AgentStatus; selected: boolean; still: boolean; onSelect: (id: AgentId) => void }) {
  const { x, z } = layout[id]
  const screen = status === 'working' ? 'screenOn' : 'screenOff'
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
    >
      {/* área clicável invisível da mesa */}
      <mesh geometry={unit} material={m.hit} position={[0, 0.8, 1.0]} scale={[2.0, 1.8, 2.6]} />
      {selected && <B p={[0, 0.07, 2.25]} s={[1.8, 0.02, 0.06]} k="marker" />}
      <group position={[0, 0, 1.19]} scale={0.7}>
        <B p={[0, 1.38, -1.865]} s={[1, 0.55, 0.01]} k={screen} />
        {id === 'atlas' && <B p={[1.05, 1.3, -1.865]} s={[0.7, 0.42, 0.01]} k={screen} />}
        <Robot id={id} status={status} still={still} />
      </group>
    </group>
  )
}

function Lights({ night }: { night: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [night, invalidate])
  return (
    <>
      <color attach="background" args={[night ? '#050505' : colors.bg]} />
      <ambientLight color="#ffe8cc" intensity={night ? 0.5 : 1.25} />
      <directionalLight color="#fff1dc" position={[4, 8, 3]} intensity={night ? 0.45 : 1.5} />
    </>
  )
}

function Invalidator({ k }: { k: string }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [k, invalidate])
  return null
}

const order: AgentId[] = ['scout', 'atlas', 'sentinel', 'nova', 'mercury']

export default function OfficeScene({
  statuses, selected, night, onSelect, active, reducedMotion,
}: {
  statuses: Record<AgentId, AgentStatus>
  selected: AgentId | null
  night: boolean
  onSelect: (id: AgentId) => void
  active: boolean
  reducedMotion: boolean
}) {
  return (
    <Canvas
      orthographic
      camera={{ position: [14, 12, 14], zoom: 40, near: 0.1, far: 80 }}
      dpr={[1, 1.5]}
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      gl={{ antialias: true, powerPreference: 'low-power' }}
      style={{ touchAction: 'pan-y' }}
      aria-label="Escritório virtual 3D com as mesas dos agentes"
    >
      <Rig />
      <Lights night={night} />
      <Invalidator k={order.map((id) => statuses[id]).join() + selected} />
      <Static />
      {order.map((id) => (
        <Station key={id} id={id} status={statuses[id]} selected={selected === id} still={reducedMotion} onSelect={onSelect} />
      ))}
    </Canvas>
  )
}
