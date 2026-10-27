import { useEffect, useRef, type Ref } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BoxGeometry, MeshLambertMaterial, MeshBasicMaterial, type Group, type Mesh } from 'three'
import { colors } from '../lib/tokens'
import { layout } from '../lib/office'
import type { AgentId, AgentStatus } from '../lib/types'

const RX = 7.2 // largura do escritório (x)
const RZ = 5.4 // profundidade (z)
const WALL_H = 3

/** Geometria e materiais compartilhados (monocromáticos). */
const unit = new BoxGeometry(1, 1, 1)
const m = {
  slab: new MeshLambertMaterial({ color: '#3a3a3e' }),
  wall: new MeshLambertMaterial({ color: '#2e2e32' }),
  glass: new MeshLambertMaterial({ color: '#8e8e93' }),
  light: new MeshBasicMaterial({ color: colors.white }),
  leaf: new MeshLambertMaterial({ color: '#9a9a9e' }),
  floor: new MeshLambertMaterial({ color: '#46464a' }),
  furniture: new MeshLambertMaterial({ color: '#5a5a5f' }),
  robot: new MeshLambertMaterial({ color: '#d8d8da' }),
  robotDark: new MeshLambertMaterial({ color: '#4a4a4e' }),
  eye: new MeshBasicMaterial({ color: colors.white }),
  screenOn: new MeshBasicMaterial({ color: colors.fg }),
  screenOff: new MeshBasicMaterial({ color: colors.black }),
  zone: new MeshLambertMaterial({ color: '#3d3d41' }),
  marker: new MeshBasicMaterial({ color: colors.white }),
}

type V3 = [number, number, number]
function B({ p, s, m: mat, ref }: { p: V3; s: V3; m: MeshLambertMaterial | MeshBasicMaterial; ref?: Ref<Mesh> }) {
  return <mesh ref={ref} geometry={unit} material={mat} position={p} scale={s} />
}

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

/** Base de diorama + paredes dos fundos e da esquerda (corte sem teto). */
function Shell() {
  return (
    <group>
      <B p={[0, -0.15, 0]} s={[RX + 0.4, 0.3, RZ + 0.4]} m={m.slab} />
      <B p={[0, 0.01, 0]} s={[RX, 0.04, RZ]} m={m.floor} />
      <B p={[0, WALL_H / 2, -RZ / 2 - 0.08]} s={[RX + 0.4, WALL_H, 0.16]} m={m.wall} />
      <B p={[-RX / 2 - 0.08, WALL_H / 2, 0]} s={[0.16, WALL_H, RZ]} m={m.wall} />
      {/* janelas */}
      {[-2.5, 2.5].map((x) => <B key={x} p={[x, 1.7, -RZ / 2 + 0.01]} s={[1.5, 1.3, 0.03]} m={m.glass} />)}
      {[-0.6, 1.5].map((z) => <B key={z} p={[-RX / 2 + 0.01, 1.7, z]} s={[0.03, 1.3, 1.5]} m={m.glass} />)}
      {/* faixas de luz */}
      <B p={[0, WALL_H - 0.12, -RZ / 2 + 0.02]} s={[RX, 0.04, 0.04]} m={m.light} />
      <B p={[-RX / 2 + 0.02, WALL_H - 0.12, 0]} s={[0.04, 0.04, RZ]} m={m.light} />
      {/* telão */}
      <B p={[0, 2.1, -RZ / 2 + 0.03]} s={[2.2, 0.9, 0.05]} m={m.robotDark} />
      {[0, 1, 2].map((i) => <B key={i} p={[-0.6 + i * 0.1, 2.3 - i * 0.2, -RZ / 2 + 0.065]} s={[1.0 + i * 0.3, 0.05, 0.01]} m={m.eye} />)}
    </group>
  )
}

function Plant({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <B p={[0, 0.2, 0]} s={[0.4, 0.4, 0.4]} m={m.furniture} />
      <B p={[0, 0.6, 0]} s={[0.55, 0.4, 0.55]} m={m.leaf} />
      <B p={[0, 0.95, 0]} s={[0.4, 0.35, 0.4]} m={m.leaf} />
      <B p={[0, 1.2, 0]} s={[0.22, 0.25, 0.22]} m={m.leaf} />
    </group>
  )
}

/** Mobiliário de apoio: sofá, mesa alta com banquetas, plantas. */
function Decor() {
  return (
    <group>
      <B p={[-3.0, 0.25, 1.5]} s={[0.9, 0.3, 2.2]} m={m.furniture} />
      <B p={[-3.4, 0.55, 1.5]} s={[0.2, 0.5, 2.2]} m={m.furniture} />
      <B p={[2.8, 0.95, 1.7]} s={[1.0, 0.06, 0.7]} m={m.furniture} />
      <B p={[2.8, 0.47, 1.7]} s={[0.08, 0.94, 0.08]} m={m.furniture} />
      {[1.1, 2.3].map((z) => (
        <group key={z}>
          <B p={[2.0, 0.55, z + 0.3]} s={[0.32, 0.06, 0.32]} m={m.robotDark} />
          <B p={[2.0, 0.27, z + 0.3]} s={[0.06, 0.54, 0.06]} m={m.robotDark} />
        </group>
      ))}
      <Plant p={[-3.2, 0, -2.3]} />
      <Plant p={[3.2, 0, -2.3]} />
      <Plant p={[-3.2, 0, 2.3]} />
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

function Station({ id, status, selected, still, onSelect }: { id: AgentId; status: AgentStatus; selected: boolean; still: boolean; onSelect: (id: AgentId) => void }) {
  const { x, z } = layout[id]
  const on = status === 'working'
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
    >
      {/* zona da mesa: área clicável e destaque de seleção */}
      <B p={[0, 0.04, 1.0]} s={[2.0, 0.02, 2.6]} m={selected ? m.furniture : m.zone} />
      {selected && <B p={[0, 0.06, 2.25]} s={[1.8, 0.02, 0.06]} m={m.marker} />}
      <group position={[0, 0, 1.19]} scale={0.7}>
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
      <Shell />
      <Decor />
      {order.map((id) => (
        <Station key={id} id={id} status={statuses[id]} selected={selected === id} still={reducedMotion} onSelect={onSelect} />
      ))}
    </Canvas>
  )
}
