import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshLambertMaterial, MeshBasicMaterial, type Group, type Mesh } from 'three'
import { colors } from '../lib/tokens'
import type { AgentStatus } from '../lib/types'

/** Materiais compartilhados (monocromáticos). */
const m = {
  floor: new MeshLambertMaterial({ color: '#46464a' }),
  wall: new MeshLambertMaterial({ color: '#2e2e32' }),
  furniture: new MeshLambertMaterial({ color: '#5a5a5f' }),
  robot: new MeshLambertMaterial({ color: '#d8d8da' }),
  robotDark: new MeshLambertMaterial({ color: '#4a4a4e' }),
  eye: new MeshBasicMaterial({ color: colors.white }),
  screenOn: new MeshBasicMaterial({ color: colors.fg }),
  screenOff: new MeshBasicMaterial({ color: colors.black }),
}

function Rig() {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.position.set(7, 6.5, 7)
    camera.lookAt(0, 0.9, 0)
    camera.zoom = Math.min(size.width / 7, size.height / 6)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function Room() {
  return (
    <group>
      <mesh material={m.floor} position={[0, -0.1, 0]}><boxGeometry args={[6, 0.2, 6]} /></mesh>
      <mesh material={m.wall} position={[0, 1.5, -3.1]}><boxGeometry args={[6.2, 3, 0.2]} /></mesh>
      <mesh material={m.wall} position={[-3.1, 1.5, 0]}><boxGeometry args={[0.2, 3, 6]} /></mesh>
    </group>
  )
}

function Station({ on }: { on: boolean }) {
  return (
    <group position={[0, 0, -1.7]}>
      <mesh material={m.furniture} position={[0, 0.78, 0]}><boxGeometry args={[2.6, 0.08, 1.1]} /></mesh>
      <mesh material={m.furniture} position={[-1.2, 0.37, 0]}><boxGeometry args={[0.08, 0.74, 1]} /></mesh>
      <mesh material={m.furniture} position={[1.2, 0.37, 0]}><boxGeometry args={[0.08, 0.74, 1]} /></mesh>
      <mesh material={m.robotDark} position={[0, 0.95, -0.2]}><boxGeometry args={[0.1, 0.26, 0.1]} /></mesh>
      <mesh material={m.robotDark} position={[0, 1.38, -0.2]}><boxGeometry args={[1.1, 0.65, 0.06]} /></mesh>
      <mesh material={on ? m.screenOn : m.screenOff} position={[0, 1.38, -0.165]}><boxGeometry args={[1, 0.55, 0.01]} /></mesh>
    </group>
  )
}

function Robot({ status, still }: { status: AgentStatus; still: boolean }) {
  const head = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const eyes = useRef<Mesh>(null)
  const eyes2 = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = still ? 0 : clock.elapsedTime
    const working = status === 'working'
    const asleep = status === 'sleeping'
    if (head.current) {
      head.current.rotation.x = asleep ? 0.55 : working ? 0.12 + Math.sin(t * 3) * 0.03 : Math.sin(t * 1.2) * 0.04
      head.current.position.y = 1.55 + (asleep ? -0.05 + Math.sin(t * 1.5) * 0.015 : 0)
    }
    const swing = working ? Math.sin(t * 16) * 0.14 : 0
    if (armL.current) armL.current.rotation.x = working ? -1.25 + swing : -0.35
    if (armR.current) armR.current.rotation.x = working ? -1.25 - swing : -0.35
    const eyeH = asleep ? 0.12 : status === 'unknown' ? 0.5 : 1
    for (const e of [eyes.current, eyes2.current]) if (e) e.scale.y = eyeH
  })

  return (
    <group position={[0, 0, -0.55]}>
      {/* cadeira */}
      <mesh material={m.robotDark} position={[0, 0.45, 0.05]}><boxGeometry args={[0.7, 0.08, 0.7]} /></mesh>
      <mesh material={m.robotDark} position={[0, 0.7, 0.42]}><boxGeometry args={[0.7, 0.6, 0.06]} /></mesh>
      <mesh material={m.robotDark} position={[0, 0.22, 0.05]}><boxGeometry args={[0.08, 0.4, 0.08]} /></mesh>
      {/* corpo */}
      <mesh material={m.robot} position={[0, 0.95, 0.1]}><boxGeometry args={[0.62, 0.7, 0.4]} /></mesh>
      {/* braços */}
      <group ref={armL} position={[-0.42, 1.2, 0.1]}>
        <mesh material={m.robot} position={[0, 0, -0.3]}><boxGeometry args={[0.14, 0.14, 0.6]} /></mesh>
      </group>
      <group ref={armR} position={[0.42, 1.2, 0.1]}>
        <mesh material={m.robot} position={[0, 0, -0.3]}><boxGeometry args={[0.14, 0.14, 0.6]} /></mesh>
      </group>
      {/* cabeça */}
      <group ref={head} position={[0, 1.55, 0.1]}>
        <mesh material={m.robot}><boxGeometry args={[0.5, 0.42, 0.42]} /></mesh>
        <mesh ref={eyes} material={m.eye} position={[-0.11, 0.02, -0.215]}><boxGeometry args={[0.1, 0.1, 0.02]} /></mesh>
        <mesh ref={eyes2} material={m.eye} position={[0.11, 0.02, -0.215]}><boxGeometry args={[0.1, 0.1, 0.02]} /></mesh>
        <mesh material={m.robotDark} position={[0, 0.3, 0]}><boxGeometry args={[0.04, 0.18, 0.04]} /></mesh>
      </group>
    </group>
  )
}

function Invalidator({ status }: { status: AgentStatus }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [status, invalidate])
  return null
}

export default function OfficeScene({ status, active, reducedMotion }: { status: AgentStatus; active: boolean; reducedMotion: boolean }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [7, 6.5, 7], zoom: 55, near: 0.1, far: 50 }}
      dpr={[1, 1.5]}
      frameloop={!active ? 'never' : reducedMotion ? 'demand' : 'always'}
      gl={{ antialias: true, powerPreference: 'low-power' }}
      style={{ touchAction: 'pan-y' }}
      aria-label="Escritório virtual 3D"
    >
      <color attach="background" args={[colors.bg]} />
      <Rig />
      <Invalidator status={status} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[4, 8, 3]} intensity={1.6} />
      <Room />
      <Station on={status === 'working'} />
      <Robot status={status} still={reducedMotion} />
    </Canvas>
  )
}
