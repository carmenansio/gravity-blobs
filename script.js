/*──────────────────────────────────────────────────────────────
  1 · Imports — Matter.js + poly-decomp (imprescindible para polígonos)
──────────────────────────────────────────────────────────────*/
import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
import decomp from "https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/+esm";
window.decomp = decomp;                     // Matter lo busca en global

const {
  Engine, World, Bodies, Body,
  Runner, Events, Svg
} = Matter;

/*──────────────────────────────────────────────────────────────
  2 · Constantes → coinciden con tu <svg viewBox="0 0 1024 512">
──────────────────────────────────────────────────────────────*/
const WIDTH  = 1024;
const HEIGHT = 512;

/*──────────────────────────────────────────────────────────────
  3 · Motor      — gravedad & precisión de colisiones
──────────────────────────────────────────────────────────────*/
const engine = Engine.create({
  gravity: { x: 0, y: 1, scale: 0.01 }, // ≈ 36 px/s²
  positionIterations  : 10,             // más corrección de penetración
  velocityIterations  : 8,
  constraintIterations: 4
});
const world = engine.world;

/*──────────────────────────────────────────────────────────────
  4 · Recinto: suelo + laterales
──────────────────────────────────────────────────────────────*/
World.add(world, [
  Bodies.rectangle(WIDTH / 2, HEIGHT + 30, WIDTH, 60, { isStatic: true }), // suelo
  Bodies.rectangle(-30,        HEIGHT/2, 60, HEIGHT, { isStatic: true }), // izq
  Bodies.rectangle(WIDTH + 30, HEIGHT/2, 60, HEIGHT, { isStatic: true })  // der
]);

/*──────────────────────────────────────────────────────────────
  5 · Crear blobs ⇒ cuerpo poligonal real (fallback = círculo)
──────────────────────────────────────────────────────────────*/
const wrappers = [...document.querySelectorAll(".blob-wrapper")]
                 .filter(w => w.querySelector(".blob")?.getAttribute("d")?.trim());

const blobs = [];

wrappers.forEach(wrapper => {
  const path   = wrapper.querySelector(".blob");
  const box    = path.getBBox();
  const baseX  = box.x + box.width  / 2;
  const baseY  = box.y + box.height / 2;

  /* Intento de polígono (20-25 px precisión suele bastar) */
  let body;
  try {
    const verts = Svg.pathToVertices(path, 20);
    if (verts.length >= 3) {
      body = Bodies.fromVertices(
        baseX,
        -Math.random() * 300 - box.height,     // nacen “en el cielo”
        verts,
        { restitution: 0.45, friction: 0.3, frictionAir: 0.04, density: 0.002 },
        true                                    // true ⇒ convex auto-decomp
      );
      if (Array.isArray(body)) body = Body.create({ parts: body });
    }
  } catch { /* silencio: body seguirá undefined y caeremos al fallback */ }

  /* Fallback círculo inscrito si el path es problemático */
  if (!body) {
    const r = Math.max(box.width, box.height) / 2;
    body = Bodies.circle(
      baseX,
      -Math.random() * 300 - r,
      r,
      { restitution: 0.45, friction: 0.3, frictionAir: 0.04, density: 0.002 }
    );
  }

  World.add(world, body);
  blobs.push({ wrapper, body, baseX, baseY });
});

/*──────────────────────────────────────────────────────────────
  6 · Impulso radial al pasar el cursor
──────────────────────────────────────────────────────────────*/
const PUSH = 0.12;          // fuerza base
const RANGE = 170;          // radio de acción

blobs.forEach(({ wrapper, body: origin }) => {
  wrapper.addEventListener("pointerenter", () => {
    blobs.forEach(({ body }) => {
      const dx = body.position.x - origin.position.x;
      const dy = body.position.y - origin.position.y;
      const d  = Math.hypot(dx, dy);
      if (d > 0 && d < RANGE) {
        const f = PUSH * (1 - d / RANGE);
        Body.applyForce(body, body.position, { x: (dx/d)*f, y: (dy/d)*f });
      }
    });
    Body.applyForce(origin, origin.position, { x: 0, y: -PUSH * 4 });
  });
});

/*──────────────────────────────────────────────────────────────
  7 · Arrancar motor
──────────────────────────────────────────────────────────────*/
const runner = Runner.create();
Runner.run(runner, engine);

/*──────────────────────────────────────────────────────────────
  8 · Sincronizar cada frame: posición física → SVG
──────────────────────────────────────────────────────────────*/
Events.on(engine, "afterUpdate", () => {
  blobs.forEach(({ wrapper, body, baseX, baseY }) => {
    const dx = body.position.x - baseX;
    const dy = body.position.y - baseY;
    wrapper.style.transform = `translate(${dx}px, ${dy}px) rotate(${body.angle}rad)`;
    wrapper.style.transformOrigin = "center center";
  });
});