import React, { useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { WallpaperId } from '../../types';

interface ShaderWallpaperProps {
  shaderId: WallpaperId;
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADERS: Record<string, string> = {
  'shader-obsidian': `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;
varying vec2 vUv;

// Simplex-style noise helper
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
  vec2 mouse = (u_mouse - 0.5) * 0.4;
  uv += mouse;

  float t = u_time * 0.15;
  float n1 = snoise(uv * 1.8 + vec2(t * 0.4, t * 0.3));
  float n2 = snoise(uv * 3.5 - vec2(t * 0.2, -t * 0.3) + vec2(n1 * 0.5));
  float n3 = snoise(uv * 5.0 + vec2(n2 * 0.4));

  float plasma = (n1 + n2 * 0.5 + n3 * 0.25) * 0.5 + 0.5;
  float centerDist = length(uv);
  float vignette = smoothstep(1.2, 0.2, centerDist);

  // Deep Obsidian Dark Base with Glowing Accent Filaments
  vec3 bg = vec3(0.035, 0.035, 0.045);
  vec3 glowColor = u_accent * 1.2;
  vec3 secondaryGlow = vec3(u_accent.b, u_accent.r, u_accent.g) * 0.6;

  float filament = smoothstep(0.48, 0.62, plasma) * smoothstep(0.72, 0.58, plasma);
  vec3 col = mix(bg, glowColor, pow(plasma, 2.8) * 0.45);
  col += secondaryGlow * filament * 0.6;
  col *= vignette;

  gl_FragColor = vec4(col, 1.0);
}
`,

  'shader-cyberwaves': `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec2 mouse = (u_mouse - 0.5) * 0.3;
  uv.x -= mouse.x * 0.5;

  float horizon = -0.05 + mouse.y * 0.2;
  vec3 col = vec3(0.04, 0.03, 0.06);

  if (uv.y < horizon) {
    // 3D Perspective Floor Grid
    float depth = 1.0 / (horizon - uv.y);
    vec2 gridUv = vec2(uv.x * depth * 0.8, depth * 0.5 + u_time * 0.6);
    vec2 grid = abs(fract(gridUv - 0.5) - 0.5) / fwidth(gridUv);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);

    float fog = clamp((horizon - uv.y) * 4.0, 0.0, 1.0);
    vec3 gridColor = u_accent * 1.5;
    col = mix(col, gridColor, line * 0.5 * (1.0 - fog * 0.4));
    col += u_accent * 0.15 * (1.0 / depth);
  } else {
    // Cyber Sky with Star Glow
    float starfield = fract(sin(dot(uv * 80.0, vec2(12.9898, 78.233))) * 43758.5453);
    if (starfield > 0.985) {
      col += vec3(0.6, 0.7, 1.0) * ((starfield - 0.985) / 0.015) * 0.7;
    }
    float sunDist = length(vec2(uv.x, uv.y - horizon - 0.25));
    float glow = 0.04 / (sunDist + 0.08);
    col += u_accent * glow * 0.7;
  }

  // Horizon Neon Beam
  float horizonBeam = exp(-abs(uv.y - horizon) * 60.0);
  col += u_accent * horizonBeam * 0.9;

  gl_FragColor = vec4(col, 1.0);
}
`,

  'shader-chroma': `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  
  float t = u_time * 0.2;
  for(int i = 1; i < 4; i++) {
    float fi = float(i);
    p.x += 0.3 / fi * sin(fi * 2.5 * p.y + t + u_mouse.x * 2.0);
    p.y += 0.3 / fi * cos(fi * 2.5 * p.x + t + u_mouse.y * 2.0);
  }

  float r = sin(p.x + p.y + 1.0) * 0.5 + 0.5;
  float g = sin(p.x * 1.2 + 2.0) * 0.5 + 0.5;
  float b = sin(p.y * 1.2 + 4.0) * 0.5 + 0.5;

  vec3 baseColor = vec3(0.04, 0.04, 0.06);
  vec3 chroma = vec3(r * u_accent.r, g * u_accent.g, b * u_accent.b) * 0.8;
  vec3 col = mix(baseColor, chroma, 0.45);

  gl_FragColor = vec4(col, 1.0);
}
`,

  'shader-aurora': `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  float t = u_time * 0.3;
  float wave1 = sin(p.x * 2.0 + t) * 0.25;
  float wave2 = cos(p.x * 1.5 - t * 0.7) * 0.2;
  float wave3 = sin(p.x * 3.2 + t * 1.2 + u_mouse.x) * 0.15;
  
  float dist = abs(p.y - (wave1 + wave2 + wave3));
  float intensity = exp(-dist * 4.0);

  vec3 col = vec3(0.02, 0.02, 0.04);
  vec3 auroraCol1 = u_accent;
  vec3 auroraCol2 = vec3(0.0, 0.9, 0.7); // cyan emerald aurora
  vec3 auroraCol = mix(auroraCol1, auroraCol2, sin(p.x + t) * 0.5 + 0.5);

  col += auroraCol * intensity * 0.75;
  col += u_accent * 0.08 * (1.0 - uv.y);

  gl_FragColor = vec4(col, 1.0);
}
`,

  'shader-matrix': `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;

float rand(vec2 n) { 
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float cols = 60.0;
  vec2 grid = vec2(floor(uv.x * cols), uv.y);
  
  float speed = 0.5 + rand(vec2(grid.x, 1.0)) * 0.8;
  float drop = fract(uv.y + u_time * speed * 0.2 + rand(vec2(grid.x, 3.0)));
  
  float head = smoothstep(0.96, 1.0, drop);
  float tail = pow(drop, 4.0);
  
  vec3 col = vec3(0.02, 0.02, 0.035);
  vec3 streamColor = mix(u_accent, vec3(0.3, 1.0, 0.6), 0.3);
  col += streamColor * (tail * 0.4 + head * 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`,

  'shader-quantum': `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_accent;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 mouse = (u_mouse - 0.5) * 0.4;
  uv += mouse;

  float r = length(uv);
  float a = atan(uv.y, uv.x);
  
  float spiral = sin(a * 4.0 + r * 12.0 - u_time * 0.8) * 0.5 + 0.5;
  float vortex = 0.08 / (r + 0.08);

  vec3 col = vec3(0.03, 0.03, 0.04);
  col += u_accent * spiral * vortex * 0.35;
  col += vec3(u_accent.b, u_accent.g, u_accent.r) * 0.15 * vortex;

  gl_FragColor = vec4(col, 1.0);
}
`,
};

export const ShaderWallpaper: React.FC<ShaderWallpaperProps> = ({ shaderId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { accentConfig } = useOS();
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { powerPreference: 'low-power', alpha: false, antialias: false });
    if (!gl) return;

    const fragmentSource = FRAGMENT_SHADERS[shaderId] || FRAGMENT_SHADERS['shader-obsidian'];

    // Compile Vertex Shader
    const vShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vShader, VERTEX_SHADER_SOURCE);
    gl.compileShader(vShader);

    // Compile Fragment Shader
    const fShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fShader, fragmentSource);
    gl.compileShader(fShader);

    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
      console.warn('GLSL Fragment Shader compilation error:', gl.getShaderInfoLog(fShader));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Shader Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full screen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uAccent = gl.getUniformLocation(program, 'u_accent');

    // Parse hex accent color to RGB
    const hexToRgb = (hex: string) => {
      const clean = hex.replace('#', '');
      const num = parseInt(clean, 16);
      return [(num >> 16) / 255, ((num >> 8) & 0xff) / 255, (num & 0xff) / 255];
    };

    const rgb = hexToRgb(accentConfig.primary);

    let animId: number;
    let lastFrameTime = 0;
    const targetFps = 35; // Throttled for low power and high UI responsiveness
    const frameInterval = 1000 / targetFps;
    const startTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = (currentTime: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const delta = currentTime - lastFrameTime;
      if (delta >= frameInterval) {
        lastFrameTime = currentTime - (delta % frameInterval);
        const elapsed = (currentTime - startTime) / 1000;
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uTime, elapsed);
        gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
        gl.uniform3f(uAccent, rgb[0], rgb[1], rgb[2]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vShader);
      gl.deleteShader(fShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [shaderId, accentConfig.primary]);

  return (
    <canvas
      ref={canvasRef}
      id="glsl-shader-wallpaper"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};
