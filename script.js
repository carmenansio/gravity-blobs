/*──────────────────────────────────────────────────────────────
  Matter.js + poly-decomp (ESM)
──────────────────────────────────────────────────────────────*/
import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
import decomp from "https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/+esm";
window.decomp = decomp;                   // requerido por Matter

const {
  Engine, World, Bodies, Body,
  Runner, Events, Svg
} = Matter;

/*──────────────────────────────────────────────────────────────
  Constantes del recinto
──────────────────────────────────────────────────────────────*/
const WIDTH  = 1024;
const HEIGHT = 512;

/*──────────────────────────────────────────────────────────────
  1 · Motor con gravedad visible
──────────────────────────────────────────────────────────────*/
const engine = Engine.create();
engine.gravity.y     = 1;     // dirección ↓
engine.gravity.scale = 0.01;  // ≈ 36 px/s²

const world = engine.world;

/*──────────────────────────────────────────────────────────────
  2 · Paredes y suelo
──────────────────────────────────────────────────────────────*/
World.add(world, [
  Bodies.rectangle(WIDTH/2, HEIGHT+30, WIDTH, 60, { isStatic:true }),  // suelo
  Bodies.rectangle(-30,      HEIGHT/2,  60, HEIGHT, { isStatic:true }),// izq
  Bodies.rectangle(WIDTH+30, HEIGHT/2,  60, HEIGHT, { isStatic:true }) // der
]);

/*──────────────────────────────────────────────────────────────
  3 · Blobs → cuerpos poligonales (fallback círculo)
──────────────────────────────────────────────────────────────*/
const wrappers = [...document.querySelectorAll(".blob-wrapper")]
                 .filter(w => w.querySelector(".blob")?.getAttribute("d"));

const blobs = [];

wrappers.forEach(w => {
  const path  = w.querySelector(".blob");
  const box   = path.getBBox();
  const baseX = box.x + box.width /2;
  const baseY = box.y + box.height/2;

  /* intento poligonal */
  let body = null;
  try {
    const verts = Svg.pathToVertices(path, 25);     // muestreo 25 px
    if (verts.length >= 3) {
      body = Bodies.fromVertices(
        baseX, -Math.random()*300 - box.height, verts,
        {
          restitution:0.45, friction:0.3, frictionAir:0.04, density:0.002
        },
        true
      );
      /* fromVertices puede devolver array de partes */
      if (Array.isArray(body)) body = Body.create({ parts: body });
    }
  } catch(e){ body = null; }

  /* fallback: círculo inscrito */
  if (!body) {
    const r = Math.max(box.width, box.height)/2;
    body = Bodies.circle(
      baseX, -Math.random()*300 - r, r,
      { restitution:0.45, friction:0.3, frictionAir:0.04, density:0.002 }
    );
  }
  World.add(world, body);

  blobs.push({ group:w, body, baseX, baseY });
});

/*──────────────────────────────────────────────────────────────
  4 · Impulso radial al ‘hover’
──────────────────────────────────────────────────────────────*/
const IMPULSE = 0.12;
const RANGE   = 170;

blobs.forEach(({ group, body: origin }) => {
  group.addEventListener("pointerenter", () => {

    blobs.forEach(({ body }) => {
      const dx = body.position.x - origin.position.x;
      const dy = body.position.y - origin.position.y;
      const d  = Math.hypot(dx, dy);
      if (d > 0 && d < RANGE) {
        const m = IMPULSE * (1 - d / RANGE);
        Body.applyForce(body, body.position,
          { x: (dx/d)*m, y: (dy/d)*m });
      }
    });

    /* empuje extra hacia arriba */
    Body.applyForce(origin, origin.position, { x:0, y: -IMPULSE*4 });
  });
});

/*──────────────────────────────────────────────────────────────
  5 · Arrancar motor y runner
──────────────────────────────────────────────────────────────*/
const runner = Runner.create();
Runner.run(runner, engine);

/*──────────────────────────────────────────────────────────────
  6 · Sincronizar SVG ↔ Matter en cada frame
──────────────────────────────────────────────────────────────*/
Events.on(engine, "afterUpdate", () => {
  blobs.forEach(({ group, body, baseX, baseY }) => {
    const dx = body.position.x - baseX;
    const dy = body.position.y - baseY;
    group.style.transform = `translate(${dx}px,${dy}px) rotate(${body.angle}rad)`;
    group.style.transformOrigin = "center center";
  });
});
