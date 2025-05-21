import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
import decomp from "https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/+esm";
window.decomp = decomp;

const {
  Engine, World, Bodies, Body, Runner, Events, Svg
} = Matter;

const WIDTH = 1024;
const HEIGHT = 512;

const engine = Engine.create({
  gravity: { x: 0, y: 1, scale: 0.01 },
  positionIterations: 10,
  velocityIterations: 8
});
const world = engine.world;

/* 🧱 Suelo y paredes */
World.add(world, [
  Bodies.rectangle(WIDTH / 2, HEIGHT + 30, WIDTH, 60, { isStatic: true }),
  Bodies.rectangle(-30, HEIGHT / 2, 60, HEIGHT, { isStatic: true }),
  Bodies.rectangle(WIDTH + 30, HEIGHT / 2, 60, HEIGHT, { isStatic: true })
]);

/* 🎨 Convertir blobs SVG en cuerpos físicos */
const wrappers = [...document.querySelectorAll(".blob-wrapper")]
  .filter(w => w.querySelector(".blob")?.getAttribute("d")?.trim());

const container = document.querySelector(".container");
const blobs = [];

wrappers.forEach(w => {
  const path = w.querySelector(".blob");
  const box = path.getBBox();
  const baseX = box.x + box.width / 2;
  const baseY = box.y + box.height / 2;
  let body;

  try {
    const verts = Svg.pathToVertices(path, 20);
    if (verts.length >= 3) {
      body = Bodies.fromVertices(
        baseX,
        -Math.random() * 300 - box.height,
        verts,
        { restitution: 0.45, friction: 0.3, frictionAir: 0.04, density: 0.002 },
        true
      );
      if (Array.isArray(body)) body = Body.create({ parts: body });
    }
  } catch {}

  if (!body) {
    const r = Math.max(box.width, box.height) / 2;
    body = Bodies.circle(
      baseX,
      -Math.random() * 300 - r,
      r,
      { restitution: 0.45, friction: 0.3, frictionAir: 0.04, density: 0.002 }
    );
  }

  // No dormir nunca
  body.isSleeping = false;
  body.sleepThreshold = Infinity;

  World.add(world, body);

  // 🐁 Empujón en dirección contraria al cursor
  w.addEventListener("pointerenter", (e) => {
    const rect = container.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    const dx = body.position.x - pointerX;
    const dy = body.position.y - pointerY;
    const dist = Math.hypot(dx, dy) || 1;

    const force = 0.8;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    Body.applyForce(body, body.position, { x: fx, y: fy });

    // Opcional: giro loco al salir
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 2);
  });

  blobs.push({ wrapper: w, body, baseX, baseY });
});

/* ▶ Iniciar motor */
Runner.run(Runner.create(), engine);

/* 🔁 Sincronizar blobs cada frame */
Events.on(engine, "afterUpdate", () => {
  blobs.forEach(({ wrapper, body, baseX, baseY }) => {
    const dx = body.position.x - baseX;
    const dy = body.position.y - baseY;
    wrapper.style.transform = `translate(${dx}px, ${dy}px) rotate(${body.angle}rad)`;
    wrapper.style.transformOrigin = "center center";
  });
});
