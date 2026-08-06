import { useEffect, useRef } from "react";

const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
  float t = u_time * 0.06;
  vec2 p = uv * 1.5;
  float grid = abs(sin(p.x * 3.0 + t) * sin(p.y * 3.0 - t));
  float beam = 0.5 + 0.5 * sin((p.x + p.y) * 1.8 + t);
  float focus = exp(-length(uv - u_pointer * 0.35) * 2.5);
  float stars = step(0.995, hash(floor(uv * 18.0)));
  vec3 navy = vec3(0.018, 0.028, 0.065);
  vec3 gold = vec3(0.76, 0.55, 0.16);
  vec3 blue = vec3(0.08, 0.28, 0.62);
  vec3 color = navy + blue * (grid * 0.035 + focus * 0.045);
  color += gold * (beam * 0.012 + stars * 0.08);
  float vignette = smoothstep(1.45, 0.15, length(uv));
  gl_FragColor = vec4(color * vignette, 0.62);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL shader oluşturulamadı");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader derlenemedi";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

/**
 * Shared low-cost 3D atmosphere. It renders only while active and falls back
 * silently when WebGL2 is unavailable. It never captures pointer events.
 */
export function Smart3DEnvironment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    let frame = 0;
    let active = true;
    let visible = true;
    let lastInteraction = performance.now();
    let pointer = { x: 0, y: 0 };
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const pointerUniform = gl.getUniformLocation(program, "u_pointer");
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1 : 1.5);
      canvas.width = Math.max(1, Math.floor(innerWidth * ratio));
      canvas.height = Math.max(1, Math.floor(innerHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      lastInteraction = performance.now();
      active = true;
      if (!frame && visible) frame = requestAnimationFrame(render);
    };
    const move = (event: PointerEvent) => {
      pointer = { x: event.clientX / innerWidth * 2 - 1, y: -(event.clientY / innerHeight * 2 - 1) };
      lastInteraction = performance.now();
      active = true;
      if (!frame && visible) frame = requestAnimationFrame(render);
    };
    const render = (now: number) => {
      frame = 0;
      if (!active || !visible) return;
      gl.uniform1f(time, prefersReduced ? 0 : now);
      gl.uniform2f(pointerUniform, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      active = !prefersReduced && now - lastInteraction < 900;
      if (active) frame = requestAnimationFrame(render);
    };
    const visibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) {
        lastInteraction = performance.now();
        active = true;
        if (!frame) frame = requestAnimationFrame(render);
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    resize();
    addEventListener("resize", resize, { passive: true });
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", visibility);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="smart-3d-environment"
    />
  );
}
