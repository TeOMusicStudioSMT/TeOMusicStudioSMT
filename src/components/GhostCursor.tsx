// src/components/GhostCursor.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore - ignorujemy błędy typów dla przykładów Three.js
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
// @ts-ignore
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
// @ts-ignore
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
// @ts-ignore
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import './GhostCursor.css';

type GhostCursorProps = {
    className?: string;
    style?: React.CSSProperties;
    trailLength?: number;
    inertia?: number;
    grainIntensity?: number;
    bloomStrength?: number;
    bloomRadius?: number;
    bloomThreshold?: number;
    brightness?: number;
    color?: string;
    mixBlendMode?: React.CSSProperties['mixBlendMode'];
    edgeIntensity?: number;
    maxDevicePixelRatio?: number;
    fadeDelayMs?: number;
    fadeDurationMs?: number;
    zIndex?: number;
};

const GhostCursor: React.FC<GhostCursorProps> = ({
    className,
    style,
    trailLength = 50,
    inertia = 0.5,
    grainIntensity = 0.05,
    bloomStrength = 0.1,
    bloomRadius = 1.0,
    bloomThreshold = 0.025,
    brightness = 1,
    color = '#B19EEF',
    mixBlendMode = 'screen',
    edgeIntensity = 0,
    maxDevicePixelRatio = 0.5,
    fadeDelayMs,
    fadeDurationMs,
    zIndex = 10
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const composerRef = useRef<any | null>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const bloomPassRef = useRef<any | null>(null);
    const filmPassRef = useRef<any | null>(null);
    const trailBufRef = useRef<THREE.Vector2[]>([]);
    const headRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const currentMouseRef = useRef(new THREE.Vector2(0.5, 0.5));
    const velocityRef = useRef(new THREE.Vector2(0, 0));
    const fadeOpacityRef = useRef(1.0);
    const lastMoveTimeRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
    const pointerActiveRef = useRef(false);

    const isTouch = useMemo(
        () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
        []
    );

    const fadeDelay = fadeDelayMs ?? (isTouch ? 500 : 1000);
    const fadeDuration = fadeDurationMs ?? (isTouch ? 1000 : 1500);

    const baseVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

    const fragmentShader = `
    uniform float iTime;
    uniform vec3  iResolution;
    uniform vec2  iMouse;
    uniform vec2  iPrevMouse[MAX_TRAIL_LENGTH];
    uniform float iOpacity;
    uniform float iScale;
    uniform vec3  iBaseColor;
    uniform float iBrightness;
    uniform float iEdgeIntensity;
    varying vec2  vUv;

    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f *= f * (3. - 2. * f);
      return mix(mix(hash(i + vec2(0.,0.)), hash(i + vec2(1.,0.)), f.x),
                 mix(hash(i + vec2(0.,1.)), hash(i + vec2(1.,1.)), f.x), f.y);
    }
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<5;i++){
        v += a * noise(p);
        p = m * p * 2.0;
        a *= 0.5;
      }
      return v;
    }
    vec3 tint1(vec3 base){ return mix(base, vec3(1.0), 0.15); }
    vec3 tint2(vec3 base){ return mix(base, vec3(0.8, 0.9, 1.0), 0.25); }

    vec4 blob(vec2 p, vec2 mousePos, float intensity, float activity) {
      vec2 q = vec2(fbm(p * iScale + iTime * 0.1), fbm(p * iScale + vec2(5.2,1.3) + iTime * 0.1));
      vec2 r = vec2(fbm(p * iScale + q * 1.5 + iTime * 0.15), fbm(p * iScale + q * 1.5 + vec2(8.3,2.8) + iTime * 0.15));

      float smoke = fbm(p * iScale + r * 0.8);
      float radius = 0.5 + 0.3 * (1.0 / iScale);
      float distFactor = 1.0 - smoothstep(0.0, radius * activity, length(p - mousePos));
      float alpha = pow(smoke, 2.5) * distFactor;

      vec3 c1 = tint1(iBaseColor);
      vec3 c2 = tint2(iBaseColor);
      vec3 color = mix(c1, c2, sin(iTime * 0.5) * 0.5 + 0.5);

      return vec4(color * alpha * intensity, alpha * intensity);
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy / iResolution.xy * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
      vec2 mouse = (iMouse * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);

      vec3 colorAcc = vec3(0.0);
      float alphaAcc = 0.0;

      vec4 b = blob(uv, mouse, 1.0, iOpacity);
      colorAcc += b.rgb;
      alphaAcc += b.a;

      for (int i = 0; i < MAX_TRAIL_LENGTH; i++) {
        vec2 pm = (iPrevMouse[i] * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
        float t = 1.0 - float(i) / float(MAX_TRAIL_LENGTH);
        t = pow(t, 2.0);
        if (t > 0.01) {
          vec4 bt = blob(uv, pm, t * 0.8, iOpacity);
          colorAcc += bt.rgb;
          alphaAcc += bt.a;
        }
      }

      colorAcc *= iBrightness;

      vec2 uv01 = gl_FragCoord.xy / iResolution.xy;
      float edgeDist = min(min(uv01.x, 1.0 - uv01.x), min(uv01.y, 1.0 - uv01.y));
      float distFromEdge = clamp(edgeDist * 2.0, 0.0, 1.0);
      float k = clamp(iEdgeIntensity, 0.0, 1.0);
      float edgeMask = mix(1.0 - k, 1.0, distFromEdge);

      float outAlpha = clamp(alphaAcc * iOpacity * edgeMask, 0.0, 1.0);
      gl_FragColor = vec4(colorAcc, outAlpha);
    }
  `;

    const FilmGrainShader = useMemo(() => {
        return {
            uniforms: {
                tDiffuse: { value: null },
                iTime: { value: 0 },
                intensity: { value: grainIntensity }
            },
            vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float iTime;
        uniform float intensity;
        varying vec2 vUv;
        float hash1(float n){ return fract(sin(n)*43758.5453); }
        void main(){
          vec4 color = texture2D(tDiffuse, vUv);
          float n = hash1(vUv.x*1000.0 + vUv.y*2000.0 + iTime) * 2.0 - 1.0;
          color.rgb += n * intensity * color.rgb;
          gl_FragColor = color;
        }
      `
        };
    }, [grainIntensity]);

    const UnpremultiplyPass = useMemo(
        () =>
            new ShaderPass({
                uniforms: { tDiffuse: { value: null } },
                vertexShader: `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
                fragmentShader: `
          uniform sampler2D tDiffuse;
          varying vec2 vUv;
          void main(){
            vec4 c = texture2D(tDiffuse, vUv);
            float a = max(c.a, 1e-5);
            vec3 straight = c.rgb / a;
            gl_FragColor = vec4(clamp(straight, 0.0, 1.0), c.a);
          }
        `
            }),
        []
    );

    function calculateScale(el: HTMLElement) {
        const r = el.getBoundingClientRect();
        const base = 600;
        const current = Math.min(Math.max(1, r.width), Math.max(1, r.height));
        return Math.max(0.5, Math.min(2.0, current / base));
    }

    useEffect(() => {
        const host = containerRef.current;
        if (!host) return;

        const renderer = new THREE.WebGLRenderer({
            antialias: !isTouch,
            alpha: true,
            depth: false,
            stencil: false,
            powerPreference: isTouch ? 'low-power' : 'high-performance',
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        });
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;

        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const geom = new THREE.PlaneGeometry(2, 2);

        const maxTrail = Math.max(1, Math.floor(trailLength));
        trailBufRef.current = Array.from({ length: maxTrail }, () => new THREE.Vector2(0.5, 0.5));
        headRef.current = 0;

        const baseColor = new THREE.Color(color);

        const material = new THREE.ShaderMaterial({
            defines: { MAX_TRAIL_LENGTH: maxTrail },
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector3(1, 1, 1) },
                iMouse: { value: new THREE.Vector2(0.5, 0.5) },
                iPrevMouse: { value: trailBufRef.current.map(v => v.clone()) },
                iOpacity: { value: 1.0 },
                iScale: { value: 1.0 },
                iBaseColor: { value: new THREE.Vector3(baseColor.r, baseColor.g, baseColor.b) },
                iBrightness: { value: brightness },
                iEdgeIntensity: { value: edgeIntensity }
            },
            vertexShader: baseVertexShader,
            fragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        materialRef.current = material;

        const mesh = new THREE.Mesh(geom, material);
        scene.add(mesh);

        const composer = new EffectComposer(renderer);
        composerRef.current = composer;
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloomStrength, bloomRadius, bloomThreshold);
        bloomPassRef.current = bloomPass;
        composer.addPass(bloomPass);

        const filmPass = new ShaderPass(FilmGrainShader as any);
        filmPassRef.current = filmPass;
        composer.addPass(filmPass);
        composer.addPass(UnpremultiplyPass);

        const resize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);

            renderer.setSize(w, h);
            renderer.setPixelRatio(dpr);
            composer.setSize(w, h);
            composer.setPixelRatio(dpr);

            if (materialRef.current) {
                materialRef.current.uniforms.iResolution.value.set(w * dpr, h * dpr, 1);
                materialRef.current.uniforms.iScale.value = calculateScale(host);
            }
            bloomPass.setSize(w * dpr, h * dpr);
        };

        window.addEventListener('resize', resize);
        resize();

        const start = performance.now();
        const animate = () => {
            const now = performance.now();
            const t = (now - start) / 1000;

            const mat = materialRef.current;
            if (!mat) return;

            if (pointerActiveRef.current) {
                velocityRef.current.set(
                    currentMouseRef.current.x - mat.uniforms.iMouse.value.x,
                    currentMouseRef.current.y - mat.uniforms.iMouse.value.y
                );
                mat.uniforms.iMouse.value.copy(currentMouseRef.current);
                fadeOpacityRef.current = 1.0;
            } else {
                velocityRef.current.multiplyScalar(inertia);
                mat.uniforms.iMouse.value.add(velocityRef.current);
                const dt = now - lastMoveTimeRef.current;
                if (dt > fadeDelay) {
                    const k = Math.min(1, (dt - fadeDelay) / fadeDuration);
                    fadeOpacityRef.current = Math.max(0, 1 - k);
                }
            }

            // Trail update
            const N = trailBufRef.current.length;
            headRef.current = (headRef.current + 1) % N;
            trailBufRef.current[headRef.current].copy(mat.uniforms.iMouse.value);

            // Update Uniforms array
            const arr = mat.uniforms.iPrevMouse.value;
            for (let i = 0; i < N; i++) {
                const srcIdx = (headRef.current - i + N) % N;
                arr[i].copy(trailBufRef.current[srcIdx]);
            }

            mat.uniforms.iOpacity.value = fadeOpacityRef.current;
            mat.uniforms.iTime.value = t;
            if (filmPassRef.current) filmPassRef.current.uniforms.iTime.value = t;

            composerRef.current.render();
            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        const onPointerMove = (e: PointerEvent) => {
            const x = e.clientX / window.innerWidth;
            const y = 1 - (e.clientY / window.innerHeight);
            currentMouseRef.current.set(x, y);
            pointerActiveRef.current = true;
            lastMoveTimeRef.current = performance.now();
        };

        window.addEventListener('pointermove', onPointerMove);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
            window.removeEventListener('pointermove', onPointerMove);
            if (host && renderer.domElement) host.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className={`ghost-cursor ${className ?? ''}`} style={{ ...style, mixBlendMode, zIndex }} />;
};

export default GhostCursor;