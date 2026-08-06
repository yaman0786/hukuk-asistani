import { Text, RoundedBox } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";

export function MeshText({ children, position = [0, 0, 0], size = 0.18, color = "#f8fafc" }: { children: string; position?: [number, number, number]; size?: number; color?: string }) {
  return <Text position={position} fontSize={size} color={color} anchorX="center" anchorY="middle">{children}</Text>;
}

export function MeshButton({ label, position, onClick }: { label: string; position: [number, number, number]; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const { invalidate } = useThree();
  return (
    <group position={position} onPointerOver={() => { setHovered(true); invalidate(); }} onPointerOut={() => { setHovered(false); invalidate(); }} onPointerDown={(event) => { event.stopPropagation(); onClick?.(); invalidate(); }}>
      <RoundedBox args={[1.8, 0.46, 0.1]} radius={0.08} smoothness={2}>
        <meshStandardMaterial color={hovered ? "#1e4fa8" : "#12254a"} emissive="#2864d7" emissiveIntensity={hovered ? 0.7 : 0.18} metalness={0.65} roughness={0.2} />
      </RoundedBox>
      <MeshText position={[0, 0, 0.08]} size={0.14}>{label}</MeshText>
    </group>
  );
}

export function MeshInput({ position, placeholder = "Yazın..." }: { position: [number, number, number]; placeholder?: string }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const { invalidate } = useThree();
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!focused) return;
      if (event.key === "Backspace") setValue((current) => current.slice(0, -1));
      else if (event.key.length === 1 && value.length < 80) setValue((current) => current + event.key);
      invalidate();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [focused, invalidate, value.length]);
  return (
    <group position={position} onPointerDown={(event) => { event.stopPropagation(); setFocused(true); invalidate(); }}>
      <RoundedBox args={[3.2, 0.52, 0.1]} radius={0.08} smoothness={2}>
        <meshStandardMaterial color={focused ? "#17366d" : "#0d1931"} emissive="#2864d7" emissiveIntensity={focused ? 0.55 : 0.12} metalness={0.7} roughness={0.2} />
      </RoundedBox>
      <MeshText position={[-1.42, 0, 0.08]} size={0.14} color={value ? "#f8fafc" : "#91a2c1"}>{value || (focused ? "▌" : placeholder)}</MeshText>
    </group>
  );
}
