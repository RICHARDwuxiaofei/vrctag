// SPDX-License-Identifier: MIT
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { geometry, type Design } from "./model";

// glTF uses meters; printable model coordinates use millimeters.
export async function exportBlender(design: Design, avatar: string): Promise<ArrayBuffer> {
  const scene = new THREE.Scene();
  const tag = new THREE.Group();
  tag.name = "VRC_Tag";
  tag.scale.setScalar(0.001);
  scene.add(tag);
  try {
    for (const part of design.parts) {
      const mesh = new THREE.Mesh(geometry(part), new THREE.MeshStandardMaterial({ color: part.color, roughness: 0.65 }));
      mesh.name = part.name;
      tag.add(mesh);
    }
    const back = design.previewAvatar ?? design.parts.find(part => part.name === "Avatar_Back");
    if (avatar && back) {
      const image = new Image();
      image.src = avatar;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 512;
      const side = Math.min(image.width, image.height);
      canvas.getContext("2d")!.drawImage(image, (image.width-side)/2, (image.height-side)/2, side, side, 0, 0, 512, 512);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const z = Math.max(...back.vertices.map(v => v[2]));
      const minX = Math.min(...back.vertices.map(v => v[0])), minY = Math.min(...back.vertices.map(v => v[1]));
      const width = Math.max(...back.vertices.map(v => v[0]))-minX, height = Math.max(...back.vertices.map(v => v[1]))-minY;
      const top = { ...back, triangles: back.triangles.filter(t => t.every(i => Math.abs(back.vertices[i][2]-z)<1e-5)), vertices: back.vertices.map(([x,y]) => [x,y,z+0.04] as [number,number,number]) };
      const g = geometry(top);
      g.setAttribute("uv", new THREE.Float32BufferAttribute(top.vertices.flatMap(([x,y]) => [(x-minX)/width,(y-minY)/height]),2));
      const photo = new THREE.Mesh(g, new THREE.MeshBasicMaterial({map:texture}));
      photo.name = "Avatar_Photo_Preview";
      tag.add(photo);
    }
    const output = await new GLTFExporter().parseAsync(scene, {binary:true});
    if (!(output instanceof ArrayBuffer)) throw Error("GLB export failed");
    return output;
  } finally {
    tag.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const material = object.material as THREE.MeshStandardMaterial;
        material.map?.dispose();
        material.dispose();
      }
    });
  }
}
