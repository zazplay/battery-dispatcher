import * as THREE from 'three';

/* Renderer + camera + studio lighting for the site model. Ported from the mockup's <three-d-stage>:
   the camera is auto-framed to the object's bounds and stays static (no orbit) unless enableOrbit() is called. */

/** Direction from the scene towards the (static) camera; buildSite offsets the bolt sprites along it. */
export const VIEW_DIR = new THREE.Vector3(1, 0.55, 1.25).normalize();
/** Same breakpoint as the phone layout in styles.css. */
export const isPhone = () => window.innerWidth <= 700;

// The scene is built once on mount; hot-module replacement can leave a stale renderer behind, so reload the page instead.
if (import.meta.hot) import.meta.hot.accept(() => location.reload());

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private key: THREE.DirectionalLight;
  private ground: THREE.Mesh;
  private ro: ResizeObserver;
  private object?: THREE.Object3D;
  private orbit = { theta: 0.675, phi: 1.24, dist: 10, target: new THREE.Vector3(), vTheta: 0, ready: false, enabled: false };
  private dragging = false;
  private sphere?: THREE.Sphere;
  private box?: THREE.Box3;
  private phoneBox?: THREE.Box3;
  private shiftX = 0;
  private shiftY = 0;

  constructor(container: HTMLElement) {
    // preserveDrawingBuffer was only needed by the design tool's screenshots; off, it renders cleaner and cheaper
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    // 1.5× supersampling like the second mockup: takes the jagged edges off the cables and panel frames
    renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * 1.5, 3));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // the second mockup's softer, filmic look
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 500);
    this.camera.position.set(3, 2.2, 4);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0002;
    this.key = key;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xfff4e6, 0.5);
    fill.position.set(-5, 3, -4);
    this.scene.add(fill);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.18 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.ground = ground;
    this.scene.add(ground);

    let lastW = 0, lastH = 0;
    const fit = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      if (w === lastW && h === lastH) return; // ResizeObserver can fire without a real size change
      lastW = w; lastH = h;
      renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.frameObject(); // keep the whole object in view when the box changes shape
    };
    fit();
    this.ro = new ResizeObserver(fit);
    this.ro.observe(container);
  }

  /** Show the object: rest it on the ground, frame the camera, size the shadow camera.
   *  `shiftX` / `shiftY` nudge the framing as a fraction of the object's radius: positive = object appears further left / lower.
   *  `phoneBox` — a tighter box to frame on narrow screens (the rest of the object may run off the edges). */
  setObject(object: THREE.Object3D, { shiftX = 0, shiftY = 0, phoneBox }: { shiftX?: number; shiftY?: number; phoneBox?: THREE.Box3 } = {}) {
    if (this.object) this.scene.remove(this.object);
    this.object = object;
    object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !o.userData.noShadow) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(object);
    if (!box.isEmpty()) {
      this.ground.position.y = box.min.y;
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      this.sphere = sphere;
      this.box = box;
      this.phoneBox = phoneBox;
      this.shiftX = shiftX;
      this.shiftY = shiftY;
      this.frameObject();

      const span = sphere.radius * 1.05;
      this.key.position.copy(sphere.center).addScaledVector(new THREE.Vector3(4, 7, 5).normalize(), sphere.radius * 2);
      this.key.target.position.copy(sphere.center);
      if (!this.key.target.parent) this.scene.add(this.key.target);
      const sh = this.key.shadow;
      sh.camera.near = sphere.radius * 0.5;
      sh.camera.far = sphere.radius * 3.5;
      sh.mapSize.set(4096, 4096);
      sh.map?.dispose();
      sh.map = null;
      sh.bias = -0.0005;
      sh.normalBias = sphere.radius * 0.002;
      sh.camera.left = -span;
      sh.camera.right = span;
      sh.camera.top = span;
      sh.camera.bottom = -span;
      sh.camera.updateProjectionMatrix();
    }
    this.scene.add(object);
  }

  /** Place the camera so the whole object fits the box with a margin: project the 8 corners of its bounds,
   *  re-centre on them and pull back until they sit inside 90 % of the frame. A few passes converge. */
  private frameObject() {
    const sphere = this.sphere, cam = this.camera;
    const phone = isPhone();
    const box = phone && this.phoneBox ? this.phoneBox : this.box;
    if (!sphere || !box) return;
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z),
    );
    const tanV = Math.tan((cam.fov * Math.PI) / 360), tanH = tanV * cam.aspect;
    const MARGIN = phone ? 1.0 : 1.04; // desktop: bounds go 4 % past the frame — the site fills the box, the far corners of the cable loop run off the edges
    const o = this.orbit;
    o.target.copy(sphere.center);
    o.dist = sphere.radius / Math.min(tanV, tanH);
    o.ready = true;
    const p = new THREE.Vector3(), camRight = new THREE.Vector3(), camUp = new THREE.Vector3();
    for (let pass = 0; pass < 5; pass++) {
      cam.near = Math.max(o.dist / 100, 0.01);
      cam.far = o.dist * 100;
      cam.updateProjectionMatrix();
      this.updateCamera();
      cam.updateMatrixWorld(true);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const c of corners) {
        p.copy(c).project(cam);
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      }
      camRight.setFromMatrixColumn(cam.matrixWorld, 0);
      camUp.setFromMatrixColumn(cam.matrixWorld, 1);
      // move the target so the projected bounds are centred, then scale the distance to fit
      o.target.addScaledVector(camRight, ((minX + maxX) / 2) * o.dist * tanH).addScaledVector(camUp, ((minY + maxY) / 2) * o.dist * tanV);
      o.dist *= Math.max((maxX - minX) / 2 / MARGIN, (maxY - minY) / 2 / MARGIN);
    }
    o.target.addScaledVector(camRight, -sphere.radius * this.shiftX).addScaledVector(camUp, sphere.radius * this.shiftY);
    cam.near = Math.max(o.dist / 100, 0.01);
    cam.far = o.dist * 100;
    cam.updateProjectionMatrix();
    this.updateCamera();
  }

  private updateCamera() {
    const o = this.orbit;
    if (!o.ready) return;
    if (o.enabled && !this.dragging) {
      o.theta += o.vTheta;
      o.vTheta *= 0.9;
      if (Math.abs(o.vTheta) < 1e-4) o.vTheta = 0;
    }
    if (o.enabled) {
      const sp = Math.sin(o.phi);
      this.camera.position.set(
        o.target.x + o.dist * sp * Math.sin(o.theta),
        o.target.y + o.dist * Math.cos(o.phi),
        o.target.z + o.dist * sp * Math.cos(o.theta),
      );
    } else {
      this.camera.position.copy(o.target).addScaledVector(VIEW_DIR, o.dist);
    }
    this.camera.lookAt(o.target);
  }

  /** Optional: let the visitor rotate the view by dragging (off by default — the landing keeps a fixed view). */
  enableOrbit() {
    const el = this.renderer.domElement;
    const o = this.orbit;
    o.enabled = true;
    el.style.touchAction = 'pan-y';
    el.style.cursor = 'grab';
    let last: { x: number; y: number } | null = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      last = { x: e.clientX, y: e.clientY };
      this.dragging = true;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* older browsers */
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      o.vTheta = -dx * 0.005;
      o.theta += o.vTheta;
      o.phi = Math.min(1.45, Math.max(0.35, o.phi - dy * 0.004));
    });
    const up = () => {
      last = null;
      this.dragging = false;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  /** Run `fn` before every rendered frame; pass null to stop. */
  setAnimationLoop(fn: (() => void) | null) {
    this.renderer.setAnimationLoop(
      fn
        ? () => {
            fn();
            this.updateCamera();
            this.renderer.render(this.scene, this.camera);
          }
        : null,
    );
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
