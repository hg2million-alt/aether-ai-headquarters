import { useRef, type Ref } from 'react'
import { useFrame } from '@react-three/fiber'
import type { BufferGeometry, Group, Mesh } from 'three'
import type { AgentId, AgentStatus } from '../lib/types'
import { geo, m, type MatKey } from './materials'

type V3 = [number, number, number]
const HALF_PI = Math.PI / 2

/** Peça genérica: `g` define a forma; `s` escala; `rot` rotaciona. */
export function B({ p, s = [1, 1, 1], k, g = geo.box, rot, ref }: { p: V3; s?: V3; k: MatKey; g?: BufferGeometry; rot?: V3; ref?: Ref<Mesh> }) {
  return <mesh ref={ref} geometry={g} material={m[k]} position={p} scale={s} rotation={rot} />
}

/** Roupa de cada função: cor do torso e das mangas. */
const outfit: Record<AgentId, { torso: MatKey; sleeve: MatKey }> = {
  scout: { torso: 'khaki', sleeve: 'khaki' },
  atlas: { torso: 'hoodie', sleeve: 'hoodie' },
  sentinel: { torso: 'coat', sleeve: 'coat' },
  nova: { torso: 'navy', sleeve: 'navy' },
  mercury: { torso: 'suit', sleeve: 'suit' },
}

const torsoGeo = geo.rbox(0.66, 0.72, 0.44, 0.17)
const headGeo = geo.rbox(0.5, 0.44, 0.44, 0.17)
const armGeo = geo.caps(0.075, 0.5)

/** Detalhes no torso (z = -0.125 é a frente). */
function Torso({ id }: { id: AgentId }) {
  return (
    <>
      <B g={torsoGeo} p={[0, 0.95, 0.1]} k={outfit[id].torso} />
      {id === 'scout' && (
        <>
          <B g={geo.rbox(0.2, 0.18, 0.03, 0.012)} p={[-0.18, 0.88, -0.125]} k="khakiDark" />
          <B g={geo.rbox(0.2, 0.18, 0.03, 0.012)} p={[0.18, 0.88, -0.125]} k="khakiDark" />
          <B g={geo.cyl} s={[0.1, 0.12, 0.1]} rot={[HALF_PI, 0, 0]} p={[-0.08, 1.08, -0.16]} k="joint" />
          <B g={geo.cyl} s={[0.1, 0.12, 0.1]} rot={[HALF_PI, 0, 0]} p={[0.08, 1.08, -0.16]} k="joint" />
        </>
      )}
      {id === 'atlas' && <B g={geo.sph} s={[0.46, 0.3, 0.28]} p={[0, 1.33, 0.3]} k="hoodie" />}
      {id === 'sentinel' && (
        <>
          <B g={geo.rbox(0.68, 0.3, 0.46, 0.1)} p={[0, 0.62, 0.1]} k="coat" />
          <B g={geo.rbox(0.1, 0.4, 0.03, 0.012)} p={[-0.1, 1.1, -0.125]} k="shirt" />
          <B g={geo.rbox(0.1, 0.4, 0.03, 0.012)} p={[0.1, 1.1, -0.125]} k="shirt" />
          <B g={geo.rbox(0.1, 0.07, 0.03, 0.01)} p={[0.2, 1.05, -0.13]} k="lens" />
        </>
      )}
      {id === 'nova' && (
        <>
          <B g={geo.cyl} s={[0.15, 0.02, 0.15]} rot={[HALF_PI, 0, 0]} p={[0.17, 1.1, -0.125]} k="orange" />
          <B g={geo.rbox(0.66, 0.05, 0.03, 0.012)} p={[0, 0.66, -0.125]} k="orange" />
        </>
      )}
      {id === 'mercury' && (
        <>
          <B g={geo.rbox(0.16, 0.45, 0.02, 0.008)} p={[0, 1.05, -0.125]} k="shirt" />
          <B g={geo.rbox(0.07, 0.4, 0.02, 0.01)} p={[0, 0.98, -0.135]} k="tie" />
        </>
      )}
    </>
  )
}

function Headset({ mic }: { mic?: boolean }) {
  return (
    <>
      <B g={geo.arc} p={[0, 0, 0]} k="headset" />
      <B g={geo.cyl} s={[0.2, 0.07, 0.2]} rot={[0, 0, HALF_PI]} p={[-0.29, 0, 0]} k="headset" />
      <B g={geo.cyl} s={[0.2, 0.07, 0.2]} rot={[0, 0, HALF_PI]} p={[0.29, 0, 0]} k="headset" />
      {mic && (
        <>
          <B g={geo.cyl} s={[0.04, 0.3, 0.04]} rot={[HALF_PI, 0, 0]} p={[-0.29, -0.12, -0.14]} k="headset" />
          <B g={geo.sph} s={[0.08, 0.08, 0.08]} p={[-0.29, -0.12, -0.3]} k="orange" />
        </>
      )}
    </>
  )
}

/** Acessórios da cabeça (animam junto com ela). */
function HeadGear({ id }: { id: AgentId }) {
  return (
    <>
      {id === 'scout' && (
        <>
          <B g={geo.sph} s={[0.56, 0.36, 0.5]} p={[0, 0.2, 0]} k="olive" />
          <B g={geo.cyl} s={[0.44, 0.03, 0.3]} p={[0, 0.17, -0.3]} k="olive" />
        </>
      )}
      {id === 'atlas' && <Headset />}
      {id === 'sentinel' && (
        <>
          <B g={geo.rbox(0.54, 0.07, 0.46, 0.03)} p={[0, 0.12, 0]} k="headset" />
          <B g={geo.cyl} s={[0.15, 0.03, 0.15]} rot={[HALF_PI, 0, 0]} p={[-0.11, 0.12, -0.235]} k="lens" />
          <B g={geo.cyl} s={[0.15, 0.03, 0.15]} rot={[HALF_PI, 0, 0]} p={[0.11, 0.12, -0.235]} k="lens" />
        </>
      )}
      {id === 'nova' && <Headset mic />}
      {id === 'mercury' && (
        <>
          <B g={geo.sph} s={[0.54, 0.32, 0.48]} p={[0, 0.2, 0.02]} k="hair" />
          <B g={geo.sph} s={[0.06, 0.1, 0.1]} p={[0.27, 0, 0]} k="headset" />
        </>
      )}
    </>
  )
}

export function Robot({ id, status, still }: { id: AgentId; status: AgentStatus; still: boolean }) {
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

  const sleeve = outfit[id].sleeve
  return (
    <group position={[0, 0, -0.55]}>
      <Torso id={id} />
      {[-0.42, 0.42].map((x) => (
        <group key={x} ref={x < 0 ? armL : armR} position={[x, 1.2, 0.1]}>
          <B g={armGeo} rot={[HALF_PI, 0, 0]} p={[0, 0, -0.3]} k={sleeve} />
          <B g={geo.sph} s={[0.15, 0.15, 0.15]} p={[0, 0, -0.62]} k="robot" />
        </group>
      ))}
      <group ref={head} position={[0, 1.55, 0.1]}>
        <B g={headGeo} p={[0, 0, 0]} k="robot" />
        <B ref={eyeL} g={geo.sph} s={[0.1, 0.1, 0.03]} p={[-0.11, 0.02, -0.22]} k="eye" />
        <B ref={eyeR} g={geo.sph} s={[0.1, 0.1, 0.03]} p={[0.11, 0.02, -0.22]} k="eye" />
        <HeadGear id={id} />
      </group>
    </group>
  )
}
