import { ContactShadows, Float, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { Box3, Vector3 } from "three";

const BOT_MODEL_URL = "/assets/models/hukuk-asistani-bot.glb";

useGLTF.preload(BOT_MODEL_URL);

// World-space height (scene units) the model is normalized to at scale=1.
// Source GLB exports vary wildly in native scale/units, so every instance
// is auto-fit to this height and its feet lifted onto the `position`
// anchor — swapping the model file never requires retuning magic numbers.
const TARGET_HEIGHT = 1.9;

export function LegalAssistantBot({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const { scene } = useGLTF(BOT_MODEL_URL);
  // useGLTF caches and shares a single scene graph across every caller, and a
  // three.js object can only belong to one parent — clone it so this widget
  // and any other instance can each mount their own copy at once.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const rawHeight = new Box3().setFromObject(clone).getSize(new Vector3()).y || 1;
    clone.scale.multiplyScalar(TARGET_HEIGHT / rawHeight);
    clone.position.y -= new Box3().setFromObject(clone).min.y;
    return clone;
  }, [scene]);

  return (
    <group position={position}>
      <group scale={scale}>
        <Float speed={1.3} rotationIntensity={0.22} floatIntensity={0.5} floatingRange={[-0.06, 0.06]}>
          <primitive object={model} />
        </Float>
        <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={2.4} blur={2.2} far={1.2} color="#04070f" />
      </group>
    </group>
  );
}
