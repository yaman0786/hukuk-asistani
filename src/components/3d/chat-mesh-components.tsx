import { RoundedBox, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform vec3 color;
uniform vec3 glow;
uniform float opacity;
varying vec2 vUv;
void main() {
  float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  edge *= smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
  float scan = 0.96 + 0.04 * sin(vUv.y * 90.0);
  vec3 outputColor = mix(glow, color, edge) * scan;
  gl_FragColor = vec4(outputColor, opacity);
}
`;

function MeshSurface({ color, glow, opacity = 0.96 }: { color: string; glow: string; opacity?: number }) {
  const uniforms = useMemo(() => ({
    color: { value: new THREE.Color(color) },
    glow: { value: new THREE.Color(glow) },
    opacity: { value: opacity },
  }), [color, glow, opacity]);
  return <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} />;
}

export function ThreeMessageBubble({
  text,
  role,
  position = [0, 0, 0],
  maxWidth = 5.4,
}: {
  text: string;
  role: "user" | "assistant";
  position?: [number, number, number];
  maxWidth?: number;
}) {
  const assistant = role === "assistant";
  const width = Math.min(maxWidth, Math.max(1.7, Math.min(5.2, text.length * 0.045 + 0.9)));
  const height = Math.max(0.62, Math.ceil(text.length / Math.max(22, Math.floor(width * 10))) * 0.27 + 0.34);
  return (
    <group position={position}>
      <RoundedBox args={[width, height, 0.12]} radius={0.1} smoothness={3}>
        <MeshSurface color={assistant ? "#10254a" : "#18345d"} glow={assistant ? "#c9a227" : "#2764d8"} />
      </RoundedBox>
      <mesh position={[assistant ? -width / 2 + 0.08 : width / 2 - 0.08, 0, 0.08]}>
        <boxGeometry args={[0.035, height * 0.62, 0.025]} />
        <meshBasicMaterial color={assistant ? "#e3bd55" : "#5ea0ff"} transparent opacity={0.9} />
      </mesh>
      <Text
        position={[assistant ? -width / 2 + 0.25 : -width / 2 + 0.18, 0, 0.1]}
        fontSize={0.145}
        maxWidth={width - 0.42}
        lineHeight={1.45}
        color="#f5f7fb"
        anchorX="left"
        anchorY="middle"
      >
        {text}
      </Text>
      <Text position={[assistant ? -width / 2 + 0.22 : width / 2 - 0.22, height / 2 - 0.15, 0.1]} fontSize={0.07} color={assistant ? "#e3bd55" : "#8ab9ff"} anchorX={assistant ? "left" : "right"} anchorY="middle">
        {assistant ? "HUKUK ASİSTANI" : "SİZ"}
      </Text>
    </group>
  );
}

export function ThreePromptInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Hukuki sorunuzu yazın…",
  position = [0, -2.5, 0],
  width = 6.2,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  position?: [number, number, number];
  width?: number;
}) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const [focused, setFocused] = useState(false);
  const { invalidate } = useThree();
  const current = value ?? internalValue;
  const update = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
    invalidate();
  };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!focused) return;
      if (event.key === "Backspace") update(current.slice(0, -1));
      else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (current.trim()) onSubmit?.(current.trim());
      } else if (event.key.length === 1 && current.length < 400) update(current + event.key);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, focused, onSubmit]);
  return (
    <group position={position} onPointerDown={(event) => { event.stopPropagation(); setFocused(true); invalidate(); }}>
      <RoundedBox args={[width, 0.72, 0.16]} radius={0.12} smoothness={3}>
        <meshStandardMaterial color={focused ? "#132f67" : "#0b1935"} emissive={focused ? "#2864d7" : "#11254b"} emissiveIntensity={focused ? 0.7 : 0.22} metalness={0.7} roughness={0.2} />
      </RoundedBox>
      <Text position={[-width / 2 + 0.24, 0, 0.12]} fontSize={0.14} maxWidth={width - 0.48} color={current ? "#f8fafc" : "#8395b6"} anchorX="left" anchorY="middle">
        {current || (focused ? "▌" : placeholder)}
      </Text>
      <mesh position={[width / 2 - 0.23, 0, 0.13]} onPointerDown={(event) => { event.stopPropagation(); if (current.trim()) onSubmit?.(current.trim()); }}>
        <circleGeometry args={[0.16, 24]} />
        <meshBasicMaterial color={current.trim() ? "#e3bd55" : "#334666"} />
      </mesh>
      <Text position={[width / 2 - 0.23, -0.01, 0.15]} fontSize={0.16} color="#071021" anchorX="center" anchorY="middle">↑</Text>
    </group>
  );
}
