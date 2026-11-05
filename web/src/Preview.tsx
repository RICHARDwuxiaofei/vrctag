// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
import { translate, type Language } from "./i18n";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { geometry, type Design } from "./model";
export function Preview({
  design,
  avatar,
  view,
  avatarPreview = true,
  language = "zh",
}: {
  design: Design | null;
  avatar: string;
  view: number;
  avatarPreview?: boolean;
  language?: Language;
}) {
  const host = useRef<HTMLDivElement>(null);
  const width = design?.size?.[0] ?? 120;
  const height = design?.size?.[1] ?? 38;
  const sizeRef = useRef([width, height]);
  sizeRef.current = [width, height];
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailure("此设备无法启动 WebGL。请开启浏览器硬件加速后重试。");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor("#172222", 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "可旋转的 3D 名牌");
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(35, 1, 1, 1000);
    camera.position.set(0, -28, 155);
    cameraRef.current = camera;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 95;
    controls.maxDistance = 300;
    controls.target.set(0, 0, 1.5);
    controlsRef.current = controls;
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight("#ffffff", 3);
    light.position.set(-40, 60, 100);
    scene.add(light);
    const fill = new THREE.DirectionalLight("#ffffff", 1);
    fill.position.set(40, -30, -30);
    scene.add(fill);
    const resize = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      const fit =
        (Math.max(sizeRef.current[1], sizeRef.current[0] / camera.aspect) /
          (2 * Math.tan(THREE.MathUtils.degToRad(17.5)))) *
        1.18;
      camera.position.set(0, -fit * 0.14, fit);
      controls.minDistance = fit * 0.5;
      controls.maxDistance = fit * 3;
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let frame = 0,
      frames = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, camera);
      if (++frames % 30 === 0)
        el.dataset.previewResources = JSON.stringify(renderer.info.memory);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      cameraRef.current = null;
      controlsRef.current = null;
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, []);
  useEffect(() => {
    const camera = cameraRef.current,
      controls = controlsRef.current;
    if (!camera || !controls) return;
    const fit =
      (Math.max(height, width / camera.aspect) /
        (2 * Math.tan(THREE.MathUtils.degToRad(17.5)))) *
      1.18;
    camera.position.set(0, view % 2 ? 0 : -fit * 0.14, fit);
    controls.minDistance = fit * 0.5;
    controls.maxDistance = fit * 3;
    controls.target.set(0, 0, 1.5);
    controls.update();
  }, [view, width, height]);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !design) return;
    const group = new THREE.Group();
    group.name = "Printable";
    for (const p of design.parts) {
      const mesh = new THREE.Mesh(
        geometry(p),
        new THREE.MeshStandardMaterial({
          color: p.color,
          roughness: 0.65,
          metalness: 0.05,
          flatShading: true,
        }),
      );
      mesh.name = p.name;
      group.add(mesh);
    }
    scene.add(group);
    return () => {
      scene.remove(group);
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    };
  }, [design]);
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !design || !avatarPreview || !avatar) return;
    const avatarBack = design.previewAvatar ?? design.parts.find((p) => p.name === "Avatar_Back");
    if (!avatarBack) return;
    let disposed = false;
    let mesh: THREE.Mesh | undefined;
    let sourceImage: HTMLImageElement | undefined;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const finish = () => {
      if (disposed) return;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      mesh = new THREE.Mesh(
        (() => {
          const back = avatarBack;
          const z = Math.max(...back.vertices.map((v) => v[2]));
          const top = {
            ...back,
            triangles: back.triangles.filter((t) =>
              t.every((i) => Math.abs(back.vertices[i][2] - z) < 1e-5),
            ),
            vertices: back.vertices.map(
              ([x, y]) => [x, y, z + 0.04] as [number, number, number],
            ),
          };
          const minX = Math.min(...back.vertices.map((v) => v[0]));
          const minY = Math.min(...back.vertices.map((v) => v[1]));
          const width = Math.max(...back.vertices.map((v) => v[0])) - minX;
          const height = Math.max(...back.vertices.map((v) => v[1])) - minY;
          const g = geometry(top);
          g.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(
              top.vertices.flatMap(([x, y]) => [
                (x - minX) / width,
                (y - minY) / height,
              ]),
              2,
            ),
          );
          return g;
        })(),
        new THREE.MeshBasicMaterial({ map: texture }),
      );
      // Avatar geometry already uses model coordinates, including the dot recess.
      scene.add(mesh);
    };
    if (avatar) {
      const image = new Image();
      sourceImage = image;
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        ctx.drawImage(
          image,
          (image.width - size) / 2,
          (image.height - size) / 2,
          size,
          size,
          0,
          0,
          512,
          512,
        );
        finish();
      };
      image.src = avatar;
    }
    return () => {
      disposed = true;
      if (sourceImage) {
        sourceImage.onload = null;
        sourceImage.src = "";
      }
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.map?.dispose();
        material.dispose();
      }
    };
  }, [avatar, design, avatarPreview]);
  return (
    <div ref={host} className="canvas-host">
      {failure && (
        <p role="alert" className="webgl-error">
          {translate(language, failure)}
        </p>
      )}
    </div>
  );
}
