import { ContactShadows, Float, useGLTF } from "@react-three/drei";
import { useMemo } from "react";

const BOT_MODEL_URL = "/assets/models/hukuk-asistani-bot.glb";

useGLTF.preload(BOT_MODEL_URL);

// The source mesh's feet sit 0.957 model-units below its own origin, so it
// must be lifted by that amount (scaled) to stand on the `position` anchor.
const MODEL_FOOT_OFFSET = 0.957;

export function LegalAssistantBot({
  position = [0, 0, 0],
  scale = 0.62,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const { scene } = useGLTF(BOT_MODEL_URL);
  // useGLTF caches and shares a single scene graph across every caller, and a
  // three.js object can only belong to one parent — clone it so this widget
  // and the background scene can each mount their own instance at once.
  const model = useMemo(() => scene.clone(true), [scene]);
  return (
    <group position={position}>
      <Float speed={1.3} rotationIntensity={0.22} floatIntensity={0.5} floatingRange={[-0.06, 0.06]}>
        <primitive object={model} scale={scale} position={[0, MODEL_FOOT_OFFSET * scale, 0]} />
      </Float>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={2.4} blur={2.2} far={1.2} color="#04070f" />
    </group>
  );
}
