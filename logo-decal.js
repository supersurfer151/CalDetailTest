// Sticks the Callahan Detail logo onto a vehicle like vinyl: a decal projected onto the body so it follows
// the curves. Used by the car and boat viewers on both the live site and v2.
//   spots: [{ from: Vector3 (a point outside the vehicle), to: Vector3 (aim point), size: height in scene units }]
// Returns the decal meshes (already added to `parent`) so viewers can dim/fade them with the part they sit on.
import * as THREE from "three";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";

const cache = new Map();
function loadTexture(url) {
  if (!cache.has(url)) cache.set(url, new THREE.TextureLoader().loadAsync(url).then((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }));
  return cache.get(url);
}

export async function addLogos(parent, targets, spots, { url, opacity = 0.96 } = {}) {
  const tex = await loadTexture(url);
  const aspect = tex.image.width / tex.image.height;
  const ray = new THREE.Raycaster();
  const up = new THREE.Vector3(0, 1, 0), m = new THREE.Matrix4(), out = [];
  for (const s of spots) {
    ray.set(s.from, s.to.clone().sub(s.from).normalize());
    const hit = ray.intersectObjects(targets, false).find((h) => h.object.visible && h.face);
    if (!hit) continue;
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (n.dot(ray.ray.direction) > 0) n.negate();                 // make the normal face the camera side
    // projector: +z along the surface normal, up as close to world-up as the surface allows
    m.lookAt(hit.point.clone().add(n), hit.point, up);
    const orient = new THREE.Euler().setFromRotationMatrix(m);
    const geo = new DecalGeometry(hit.object, hit.point, orient, new THREE.Vector3(s.size * aspect, s.size, s.size * 0.5));
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, opacity, depthWrite: false, roughness: 0.35, metalness: 0,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.45,   // reads as crisp white vinyl in the dark studio
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    });
    const decal = new THREE.Mesh(geo, mat);
    decal.renderOrder = 2;
    decal.userData.logo = true;
    parent.add(decal);
    out.push(decal);
  }
  return out;
}
