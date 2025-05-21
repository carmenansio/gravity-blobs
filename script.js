/* 1 ·  Matter.js en modo ESM */
import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
const { Engine, World, Bodies, Body, Runner, Events } = Matter;

/* 2 ·  Dimensiones del viewBox */
const WIDTH = 1024;
const HEIGHT = 512;

/* 3 ·  Motor y gravedad */
const engine = Engine.create({ gravity: { x: 0, y: 1 } });
const world = engine.world;

/* 4 ·  Paredes - el suelo ahora es más alto (60 px) */
World.add(world, [
  Bodies.rectangle(WIDTH / 2, HEIGHT + 30, WIDTH, 60, { isStatic: true }), // suelo
  Bodies.rectangle(-30, HEIGHT / 2, 60, HEIGHT, { isStatic: true }), // izq
  Bodies.rectangle(WIDTH + 30, HEIGHT / 2, 60, HEIGHT, { isStatic: true }) // der
]);

/* 5 ·  Blobs → círculos */
const groups = [...document.querySelectorAll(".blob-wrapper")].filter((g) =>
  g.querySelector(".blob")?.getAttribute("d")
);

/* guardamos path coords originales para restarlas luego */
const blobs = groups.map((g) => {
  const path = g.querySelector(".blob");
  const box = path.getBBox();
  const radius = Math.max(box.width, box.height) / 2;
  const baseX = box.x + box.width / 2;
  const baseY = box.y + box.height / 2;

  const body = Bodies.circle(
    baseX,
    -Math.random() * 300 - radius, // nace fuera de vista
    radius,
    { restitution: 0.4, friction: 0.3, frictionAir: 0.05, density: 0.002 }
  );
  World.add(world, body);

  /* evento hover → impulso */
  g.addEventListener("pointerenter", () => {
    const IMPULSE = 0.08,
      R = 120;
    blobs.forEach(({ body: ob }) => {
      const dx = ob.position.x - body.position.x,
        dy = ob.position.y - body.position.y,
        d = Math.hypot(dx, dy);
      if (d > 0 && d < R) {
        const m = IMPULSE * (1 - d / R);
        Body.applyForce(ob, ob.position, { x: (dx / d) * m, y: (dy / d) * m });
      }
    });
    Body.applyForce(body, body.position, { x: 0, y: -IMPULSE * 4 });
  });

  return { g, body, baseX, baseY };
});

/* 6 ·  Correr motor */
Runner.run(Runner.create(), engine);

/* 7 ·  Sincronizar SVG ←→ Matter (restando baseX/baseY) */
Events.on(engine, "afterUpdate", () => {
  blobs.forEach(({ g, body, baseX, baseY }) => {
    const dx = body.position.x - baseX;
    const dy = body.position.y - baseY;
    g.style.transform = `translate(${dx}px,${dy}px) rotate(${body.angle}rad)`;
    g.style.transformOrigin = "center center";
  });
});