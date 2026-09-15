import { ContactShadows, useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { AnimationMixer, Box3, Vector3 } from "three";
import { SkeletonUtils } from "three-stdlib";

const BOT_MODEL_URL = "/assets/models/ugi-bot.glb";

useGLTF.preload(BOT_MODEL_URL);

// World-space height (scene units) the model is normalized to at scale=1.
// Source GLB exports vary wildly in native scale/units, so every instance
// is auto-fit to this height and its feet lifted onto the `position`
// anchor — swapping the model file never requires retuning magic numbers.
const TARGET_HEIGHT = 1.9;

const DEFAULT_CLIP = "Idle_7";

export function LegalAssistantBot({
  position = [0, 0, 0],
  scale = 1,
  clip = DEFAULT_CLIP,
}: {
  position?: [number, number, number];
  scale?: number;
  clip?: string;
}) {
  const { scene, animations } = useGLTF(BOT_MODEL_URL);
  // useGLTF caches and shares a single scene graph across every caller, and a
  // three.js object can only belong to one parent — clone it (skeleton-aware,
  // since this rig has bones/skinned meshes a plain Object3D.clone would
  // desync) so this widget and any other instance can each mount their own
  // copy at once.
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // A rigged character's bind pose (t=0, no animation applied) can have a
  // wildly different silhouette than its actual standing animation — this
  // rig's bind pose is ~2 units tall with feet a full unit below its
  // origin, but its "Idle_7" pose is ~1.7 units tall with feet already at
  // the origin. Normalizing from the bind pose would size and float the
  // model wrong, so pose it with the reference clip once before measuring.
  useEffect(() => {
    const referenceClip = animations.find((a) => a.name === DEFAULT_CLIP) ?? animations[0];
    if (!referenceClip) return;
    const probe = new AnimationMixer(model);
    probe.clipAction(referenceClip).play();
    probe.update(0);
    model.updateMatrixWorld(true);
    const height = new Box3().setFromObject(model).getSize(new Vector3()).y || 1;
    model.scale.setScalar(TARGET_HEIGHT / height);
    model.updateMatrixWorld(true);
    model.position.y -= new Box3().setFromObject(model).min.y;
    probe.stopAllAction();
    probe.uncacheRoot(model);
  }, [model, animations]);

  const { actions } = useAnimations(animations, model);

  useEffect(() => {
    const action = actions[clip] ?? actions[animations[0]?.name];
    action?.reset().fadeIn(0.3).play();
    return () => {
      action?.fadeOut(0.3);
    };
  }, [actions, clip, animations]);

  return (
    <group position={position}>
      <group scale={scale}>
        <primitive object={model} />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={2.4} blur={2.2} far={1.2} color="#04070f" />
      </group>
    </group>
  );
}
