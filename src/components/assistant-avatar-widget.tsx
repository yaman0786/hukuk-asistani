import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { LegalAssistantBot } from "@/components/3d/legal-assistant-bot";

/**
 * Always-visible 3D mascot in the corner of the app, distinct from the
 * full-screen r3f-legal-universe backdrop (which sits behind page content
 * and is largely covered by it). Hidden on small screens to save space.
 */
export function AssistantAvatarWidget() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-5 right-5 z-40 hidden h-40 w-36 sm:block"
    >
      <div className="absolute inset-x-0 bottom-2 mx-auto h-6 w-20 rounded-full bg-primary/25 blur-xl" />
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ fov: 32, position: [0.6, 1.1, 3.2] }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[2, 3, 2]} intensity={14} color="#d8b455" />
        <pointLight position={[-2, 0.5, 1.5]} intensity={6} color="#4f7fe0" />
        <Suspense fallback={null}>
          <LegalAssistantBot position={[0, -0.85, 0]} scale={0.62} />
        </Suspense>
      </Canvas>
    </div>
  );
}
