import { useEffect, useRef, type Ref } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BoxGeometry, MeshLambertMaterial, MeshBasicMaterial, type Group, type Mesh } from 'three'
import { colors } from '../lib/tokens'
import { FLOORS, layout } from '../lib/office'
import type { AgentId, AgentStatus } from '../lib/types'

const ROOM_W = 2.8
const FLOOR_H = 2.2
const SX = ROOM_W * 2 + 0.2 // largura total do prédio
const SZ = 3

/** Geometria e materiais compartilhados (monocromáticos). */
const unit = new BoxGeometry(1, 1, 1)
const m = {
  slab: new MeshLambertMaterial({ color: '#3a3a3e' }),
  wall: new MeshLambertMaterial({ color: '#2e2e32' }),
  facade: new MeshLambertMaterial({ color: '#8a8a8e' }),
  floor: new MeshLambertMaterial({ color: '#46464a' }),
  furniture: new MeshLambertMaterial({ color: '#5a5a5f' }),
  robot: new MeshLambertMaterial({ color: '#d8d8da' }),
  robotDark: new MeshLambertMaterial({ color: '#4a4a4e' }),
  eye: new MeshBasicMaterial({ color: colors.white }),
  screenOn: new MeshBasicMaterial({ color: colors.fg }),
  screenOff: new MeshBasicMaterial({ color: colors.black }),
  marker: new MeshBasicMaterial({ color: colors.white }),
}

type V3 = [number, number, number]
function B({ p, s, m: mat, ref }: { p: V3; s: V3; m: MeshLambertMaterial | MeshBasicMaterial; ref?: Ref<Mesh> }) {
  return <mesh ref={ref} geometry={unit} material={mat} position={p} scale={s} />
}

function Rig() {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.position.set(14, 15, 14)
    camera.lookAt(0, 4.6, 0)
    camera.zoom = Math.min(size.width / 7.4, size.height / 12.4)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function Building() {
  const H = FLOORS * FLOOR_H
  const pillar = (x: number, z: number) => <B key={`${x}${z}`} p={[x, H / 2, z]} s={[0.14, H, 0.14]} m={m.slab} />
  return (
    <group>
      {/* lajes com faixa de fachada na frente de cada andar */}
      {Array.from({ length: FLOORS }, (_, i) => (
        <group key={i}>
          <B p={[0, i * FLOOR_H - 0.08, 0]} s={[SX, 0.16, SZ]} m={m.slab} />
          <B p={[0, i * FLOOR_H + 0.1, SZ / 2]} s={[SX, 0.3, 0.1]} m={m.facade} />
          <B p={[SX / 2, i * FLOOR_H + 0.1, 0]} s={[0.1, 0.3, SZ]} m={m.facade} />
        </group>
      ))}
      <B p={[0, H - 0.08, 0]} s={[SX + 0.3, 0.16, SZ + 0.3]} m={m.slab} />
      <B p={[0, H / 2, -SZ / 2 - 0.06]} s={[SX + 0.24, H, 0.12]} m={m.wall} />
      <B p={[-SX / 2 - 0.06, H / 2, 0]} s={[0.12, H, SZ]} m={m.wall} />
      {Array.from({ length: FLOORS }, (_, i) => (
        <B key={i} p={[0, i * FLOOR_H + 0.15, 0]} s={[0.08, 0.3, SZ]} m={m.wall} />
      ))}
      {pillar(-SX / 2, SZ / 2)}
      {pillar(0, SZ / 2)}
      {pillar(SX / 2, SZ / 2)}
      {pillar(SX / 2, -SZ / 2)}
      {/* teto: platibanda, caixa d'água e antena */}
      <B p={[0, H + 0.2, SZ / 2 + 0.1]} s={[SX + 0.3, 0.4, 0.1]} m={m.facade} />
      <B p={[SX / 2 + 0.1, H + 0.2, 0]} s={[0.1, 0.4, SZ + 0.3]} m={m.facade} />
      <B p={[0, H + 0.2, -SZ / 2 - 0.1]} s={[SX + 0.3, 0.4, 0.1]} m={m.facade} />
      <B p={[-SX / 2 - 0.1, H + 0.2, 0]} s={[0.1, 0.4, SZ + 0.3]} m={m.facade} />
      <B p={[-1.6, H + 0.55, -0.7]} s={[1.0, 0.7, 0.8]} m={m.furniture} />
      <B p={[1.4, H + 0.35, -0.6]} s={[0.9, 0.3, 0.6]} m={m.furniture} />
      <B p={[2.0, H + 1.0, -0.9]} s={[0.05, 1.6, 0.05]} m={m.robotDark} />
    </group>
  )
}

/** Térreo: recepção com balcão e porta. */
function Lobby() {
  return (
    <group>
      {[-0.5, 0.5].map((c) => (
        <B key={c} p={[c * (ROOM_W + 0.1), 0.02, 0]} s={[ROOM_W - 0.1, 0.04, SZ - 0.1]} m={m.floor} />
      ))}
      <B p={[-1.5, 0.45, -0.2]} s={[1.8, 0.9, 0.6]} m={m.furniture} />
      <B p={[-1.5, 0.95, -0.2]} s={[1.9, 0.06, 0.7]} m={m.robotDark} />
      <B p={[1.6, 0.9, SZ / 2 - 0.05]} s={[1.0, 1.8, 0.06]} m={m.robotDark} />
      <B p={[1.6, 0.9, SZ / 2 - 0.03]} s={[0.9, 1.7, 0.02]} m={m.screenOff} />
    </group>
  )
}

function Robot({ id, status, still }: { id: AgentId; status: AgentStatus; still: boolean }) {
  const head = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const eyeL = useRef<Mesh>(null)
  const eyeR = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime
    const working = status === 'working'
    const asleep = status === 'sleeping'
    if (head.current) {
      head.current.rotation.x = asleep ? 0.55 : working ? 0.12 + Math.sin(t * 3) * 0.03 : Math.sin(t * 1.2) * 0.04
      head.current.rotation.z = status === 'failed' ? 0.18 : 0
      head.current.position.y = 1.55 + (asleep ? -0.05 + Math.sin(t * 1.5) * 0.015 : 0)
    }
    const swing = working ? Math.sin(t * 16) * 0.14 : 0
    if (armL.current) armL.current.rotation.x = working ? -1.25 + swing : -0.35
    if (armR.current) armR.current.rotation.x = working ? -1.25 - swing : -0.35
    const h = asleep ? 0.12 : status === 'unknown' || status === 'failed' ? 0.5 : 1
    if (eyeL.current) eyeL.current.scale.y = 0.1 * h
    if (eyeR.current) eyeR.current.scale.y = 0.1 * h
  })

  return (
    <group position={[0, 0, -0.55]}>
      <B p={[0, 0.45, 0.05]} s={[0.7, 0.08, 0.7]} m={m.robotDark} />
      <B p={[0, 0.7, 0.42]} s={[0.7, 0.6, 0.06]} m={m.robotDark} />
      <B p={[0, 0.22, 0.05]} s={[0.08, 0.4, 0.08]} m={m.robotDark} />
      <B p={[0, 0.95, 0.1]} s={[0.62, 0.7, 0.4]} m={m.robot} />
      {id === 'mercury' && <B p={[0, 0.98, -0.11]} s={[0.1, 0.5, 0.02]} m={m.robotDark} />}
      <group ref={armL} position={[-0.42, 1.2, 0.1]}><B p={[0, 0, -0.3]} s={[0.14, 0.14, 0.6]} m={m.robot} /></group>
      <group ref={armR} position={[0.42, 1.2, 0.1]}><B p={[0, 0, -0.3]} s={[0.14, 0.14, 0.6]} m={m.robot} /></group>
      <group ref={head} position={[0, 1.55, 0.1]}>
        <B p={[0, 0, 0]} s={[0.5, 0.42, 0.42]} m={m.robot} />
        <B ref={eyeL} p={[-0.11, 0.02, -0.215]} s={[0.1, 0.1, 0.02]} m={m.eye} />
        <B ref={eyeR} p={[0.11, 0.02, -0.215]} s={[0.1, 0.1, 0.02]} m={m.eye} />
        {id === 'scout' && <B p={[0, 0.3, 0]} s={[0.3, 0.06, 0.3]} m={m.robotDark} />}
        {id === 'atlas' && <B p={[0, 0.3, 0]} s={[0.04, 0.18, 0.04]} m={m.robotDark} />}
        {id === 'sentinel' && <B p={[0, 0.06, -0.22]} s={[0.54, 0.05, 0.02]} m={m.robotDark} />}
        {id === 'nova' && (
          <>
            <B p={[-0.15, 0.3, 0]} s={[0.04, 0.18, 0.04]} m={m.robotDark} />
            <B p={[0.15, 0.3, 0]} s={[0.04, 0.18, 0.04]} m={m.robotDark} />
          </>
        )}
        {id === 'mercury' && <B p={[0.26, 0, 0]} s={[0.06, 0.2, 0.2]} m={m.robotDark} />}
      </group>
    </group>
  )
}

function Room({ id, status, selected, still, onSelect }: { id: AgentId; status: AgentStatus; selected: boolean; still: boolean; onSelect: (id: AgentId) => void }) {
  const { floor, col } = layout[id]
  const on = status === 'working'
  return (
    <group
      position={[(col - 0.5) * (ROOM_W + 0.1), floor * FLOOR_H, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
    >
      <B p={[0, 0.02, 0]} s={[ROOM_W - 0.1, 0.04, SZ - 0.1]} m={m.floor} />
      {selected && <B p={[0, 0.05, 0.3]} s={[ROOM_W - 0.3, 0.02, 0.06]} m={m.marker} />}
      <group position={[0, 0, 0.15]} scale={0.7}>
        <B p={[0, 0.78, -1.7]} s={[2.6, 0.08, 1.1]} m={m.furniture} />
        <B p={[-1.2, 0.37, -1.7]} s={[0.08, 0.74, 1]} m={m.furniture} />
        <B p={[1.2, 0.37, -1.7]} s={[0.08, 0.74, 1]} m={m.furniture} />
        <B p={[0, 0.95, -1.9]} s={[0.1, 0.26, 0.1]} m={m.robotDark} />
        <B p={[0, 1.38, -1.9]} s={[1.1, 0.65, 0.06]} m={m.robotDark} />
        <B p={[0, 1.38, -1.865]} s={[1, 0.55, 0.01]} m={on ? m.screenOn : m.screenOff} />
        <Robot id={id} status={status} still={still} />
      </group>
    </group>
  )
}

/** Sala sem agente: mesa de reunião decorativa. */
function MeetingRoom() {
  return (
    <group position={[0.5 * (ROOM_W + 0.1), 3 * FLOOR_H, 0]}>
      <B p={[0, 0.02, 0]} s={[ROOM_W - 0.1, 0.04, SZ - 0.1]} m={m.floor} />
      <B p={[0, 0.5, 0.2]} s={[1.6, 0.06, 0.9]} m={m.furniture} />
      <B p={[0, 0.25, 0.2]} s={[0.1, 0.5, 0.1]} m={m.furniture} />
    </group>
  )
}

function Lights({ night }: { night: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [night, invalidate])
  return (
    <>
      <color attach="background" args={[night ? '#050505' : colors.bg]} />
      <ambientLight intensity={night ? 0.45 : 1.3} />
      <directionalLight position={[4, 8, 3]} intensity={night ? 0.5 : 1.6} />
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
      camera={{ position: [14, 15, 14], zoom: 40, near: 0.1, far: 80 }}
      dpr={[1, 1.5]}
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      gl={{ antialias: true, powerPreference: 'low-power' }}
      style={{ touchAction: 'pan-y' }}
      aria-label="Prédio virtual 3D com os escritórios dos agentes"
    >
      <Rig />
      <Lights night={night} />
      <Invalidator k={order.map((id) => statuses[id]).join() + selected} />
      <Building />
      {order.map((id) => (
        <Room key={id} id={id} status={statuses[id]} selected={selected === id} still={reducedMotion} onSelect={onSelect} />
      ))}
      <Lobby />
      <MeetingRoom />
    </Canvas>
  )
}
