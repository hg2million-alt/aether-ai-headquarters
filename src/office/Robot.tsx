import { useRef, type Ref } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import type { AgentId, AgentStatus } from '../lib/types'
import { m, unit, type MatKey } from './materials'

type V3 = [number, number, number]
export function B({ p, s, k, ref }: { p: V3; s: V3; k: MatKey; ref?: Ref<Mesh> }) {
  return <mesh ref={ref} geometry={unit} material={m[k]} position={p} scale={s} />
}

/** Roupa de cada função: cor do torso e das mangas. */
const outfit: Record<AgentId, { torso: MatKey; sleeve: MatKey }> = {
  scout: { torso: 'khaki', sleeve: 'khaki' },
  atlas: { torso: 'hoodie', sleeve: 'hoodie' },
  sentinel: { torso: 'coat', sleeve: 'coat' },
  nova: { torso: 'navy', sleeve: 'navy' },
  mercury: { torso: 'suit', sleeve: 'suit' },
}

/** Detalhes no torso (z = -0.125 é a frente do casaco). */
function Torso({ id }: { id: AgentId }) {
  return (
    <>
      <B p={[0, 0.95, 0.1]} s={[0.66, 0.72, 0.44]} k={outfit[id].torso} />
      {id === 'scout' && (
        <>
          <B p={[-0.18, 0.88, -0.125]} s={[0.2, 0.18, 0.02]} k="khakiDark" />
          <B p={[0.18, 0.88, -0.125]} s={[0.2, 0.18, 0.02]} k="khakiDark" />
          <B p={[-0.08, 1.08, -0.15]} s={[0.1, 0.1, 0.1]} k="joint" />
          <B p={[0.08, 1.08, -0.15]} s={[0.1, 0.1, 0.1]} k="joint" />
        </>
      )}
      {id === 'atlas' && <B p={[0, 1.34, 0.3]} s={[0.42, 0.2, 0.2]} k="hoodie" />}
      {id === 'sentinel' && (
        <>
          <B p={[0, 0.62, 0.1]} s={[0.68, 0.3, 0.46]} k="coat" />
          <B p={[-0.1, 1.1, -0.125]} s={[0.1, 0.4, 0.02]} k="shirt" />
          <B p={[0.1, 1.1, -0.125]} s={[0.1, 0.4, 0.02]} k="shirt" />
          <B p={[0.2, 1.05, -0.13]} s={[0.1, 0.07, 0.02]} k="lens" />
        </>
      )}
      {id === 'nova' && (
        <>
          <B p={[0.17, 1.1, -0.125]} s={[0.14, 0.14, 0.02]} k="orange" />
          <B p={[0, 0.66, -0.125]} s={[0.66, 0.05, 0.02]} k="orange" />
        </>
      )}
      {id === 'mercury' && (
        <>
          <B p={[0, 1.05, -0.125]} s={[0.16, 0.45, 0.015]} k="shirt" />
          <B p={[0, 0.98, -0.135]} s={[0.07, 0.4, 0.015]} k="tie" />
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
          <B p={[0, 0.25, 0]} s={[0.54, 0.1, 0.46]} k="olive" />
          <B p={[0, 0.2, -0.3]} s={[0.46, 0.03, 0.2]} k="olive" />
        </>
      )}
      {id === 'atlas' && (
        <>
          <B p={[0, 0.24, 0]} s={[0.56, 0.05, 0.1]} k="headset" />
          <B p={[-0.29, 0, 0]} s={[0.08, 0.2, 0.2]} k="headset" />
          <B p={[0.29, 0, 0]} s={[0.08, 0.2, 0.2]} k="headset" />
        </>
      )}
      {id === 'sentinel' && (
        <>
          <B p={[0, 0.12, 0]} s={[0.54, 0.06, 0.44]} k="headset" />
          <B p={[-0.11, 0.12, -0.225]} s={[0.14, 0.08, 0.02]} k="lens" />
          <B p={[0.11, 0.12, -0.225]} s={[0.14, 0.08, 0.02]} k="lens" />
        </>
      )}
      {id === 'nova' && (
        <>
          <B p={[0, 0.24, 0]} s={[0.56, 0.05, 0.1]} k="headset" />
          <B p={[-0.29, 0, 0]} s={[0.08, 0.2, 0.2]} k="headset" />
          <B p={[0.29, 0, 0]} s={[0.08, 0.2, 0.2]} k="headset" />
          <B p={[-0.29, -0.12, -0.14]} s={[0.04, 0.04, 0.3]} k="headset" />
          <B p={[-0.29, -0.12, -0.3]} s={[0.07, 0.07, 0.05]} k="orange" />
        </>
      )}
      {id === 'mercury' && (
        <>
          <B p={[0, 0.23, 0.03]} s={[0.5, 0.08, 0.4]} k="hair" />
          <B p={[0.27, 0, 0]} s={[0.05, 0.1, 0.1]} k="headset" />
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
      <group ref={armL} position={[-0.42, 1.2, 0.1]}>
        <B p={[0, 0, -0.3]} s={[0.14, 0.14, 0.6]} k={sleeve} />
        <B p={[0, 0, -0.62]} s={[0.12, 0.12, 0.08]} k="robot" />
      </group>
      <group ref={armR} position={[0.42, 1.2, 0.1]}>
        <B p={[0, 0, -0.3]} s={[0.14, 0.14, 0.6]} k={sleeve} />
        <B p={[0, 0, -0.62]} s={[0.12, 0.12, 0.08]} k="robot" />
      </group>
      <group ref={head} position={[0, 1.55, 0.1]}>
        <B p={[0, 0, 0]} s={[0.5, 0.42, 0.42]} k="robot" />
        <B ref={eyeL} p={[-0.11, 0.02, -0.215]} s={[0.1, 0.1, 0.02]} k="eye" />
        <B ref={eyeR} p={[0.11, 0.02, -0.215]} s={[0.1, 0.1, 0.02]} k="eye" />
        <HeadGear id={id} />
      </group>
    </group>
  )
}
