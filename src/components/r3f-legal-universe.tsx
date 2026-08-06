import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Group } from "three";

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const perspective = camera as import("three").PerspectiveCamera;
    perspective.fov = size.width < 640 ? 48 : size.width < 1024 ? 42 : 36;
    perspective.aspect = size.width / Math.max(size.height, 1);
    perspective.position.set(size.width < 640 ? 0 : 0.8, size.width < 640 ? 1.2 : 1.6, size.width < 640 ? 8.5 : 7);
    perspective.lookAt(0, 0.7, 0);
    perspective.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function HologramPanel({
  position,
  label,
  value,
  accent = "#c9a227",
}: {
  position: [number, number, number];
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[1.8, 0.9, 0.08]} radius={0.08} smoothness={2}>
        <meshStandardMaterial color="#101b36" emissive={accent} emissiveIntensity={0.16} transparent opacity={0.94} metalness={0.65} roughness={0.22} />
      </RoundedBox>
      <mesh position={[0, -0.38, 0.03]} scale={[1.4, 0.018, 1]}>
        <planeGeometry />
        <meshBasicMaterial color={accent} transparent opacity={0.75} />
      </mesh>
      <Html center transform position={[0, 0, 0.08]} distanceFactor={6} style={{ pointerEvents: "none", width: "150px", textAlign: "center", color: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.68 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: accent }}>{value}</div>
        </div>
      </Html>
    </group>
  );
}

function LegalRoom() {
  const group = useRef<Group>(null);
  const { invalidate } = useThree();
  return (
    <group ref={group} onPointerMove={() => invalidate()} onPointerDown={() => invalidate()}>
      <ambientLight intensity={0.65} />
      <pointLight position={[0, 4, 3]} intensity={18} distance={12} color="#d8b455" />
      <pointLight position={[-4, 1, 2]} intensity={8} distance={10} color="#315dff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#071021" metalness={0.7} roughness={0.32} />
      </mesh>
      <gridHelper args={[12, 24, "#1b3a68", "#0d1e3b"]} position={[0, -0.12, 0]} />
      <RoundedBox args={[2.4, 0.45, 0.75]} radius={0.1} position={[0, 0.3, -0.9]}>
        <meshStandardMaterial color="#172544" emissive="#c9a227" emissiveIntensity={0.12} metalness={0.7} roughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.75, -0.9]}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#c9a227" emissive="#c9a227" emissiveIntensity={0.8} />
      </mesh>
      <HologramPanel position={[-2.35, 1.55, -0.2]} label="Dosya" value="24" />
      <HologramPanel position={[2.35, 1.55, -0.2]} label="Kaynak" value="98%" accent="#60a5fa" />
      <HologramPanel position={[-2.35, 0.25, 1.1]} label="Hazırlık" value="82" accent="#34d399" />
      <HologramPanel position={[2.35, 0.25, 1.1]} label="Risk" value="Düşük" accent="#fbbf24" />
      <Sparkles count={32} scale={[8, 4, 5]} size={1.2} speed={0.15} color="#c9a227" />
    </group>
  );
}

export function R3FLegalUniverse() {
  return (
    <div className="r3f-legal-universe" aria-hidden="true">
      <Canvas frameloop="demand" dpr={[0.75, 1.25]} camera={{ fov: 40, position: [0.8, 1.6, 7] }} gl={{ antialias: false, powerPreference: "low-power", alpha: true }}>
        <ResponsiveCamera />
        <LegalRoom />
        <OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.05} minPolarAngle={Math.PI / 3.2} />
      </Canvas>
    </div>
  );
}
