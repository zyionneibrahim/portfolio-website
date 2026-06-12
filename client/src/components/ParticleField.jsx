import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Particles({ count = 300 }) {
  const mesh = useRef()

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ],
        speed: Math.random() * 0.01 + 0.002
      })
    }
    return temp
  }, [count])

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    particles.forEach((p, i) => {
      pos[i * 3] = p.position[0]
      pos[i * 3 + 1] = p.position[1]
      pos[i * 3 + 2] = p.position[2]
    })
    return pos
  }, [particles, count])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const positions = mesh.current.geometry.attributes.position.array
    particles.forEach((p, i) => {
      positions[i * 3 + 1] += Math.sin(time * p.speed + i) * 0.003
      positions[i * 3] += Math.cos(time * p.speed + i) * 0.002
    })
    mesh.current.geometry.attributes.position.needsUpdate = true
    mesh.current.rotation.y = time * 0.02
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#7A9E7E"
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  )
}

function ParticleField() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 75 }}
      style={{ background: 'transparent', width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <Particles count={300} />
    </Canvas>
  )
}

export default ParticleField