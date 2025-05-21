import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
const {
  Engine,
  World,
  Bodies,
  Body,
  Runner,
  Events,
  Svg,
  Mouse,
  MouseConstraint
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

/* 🎨 Blob shapes */
const wrappers = [...document.querySelectorAll(".blob-wrapper")].filter((w) =>
  w.querySelector(".blob")?.getAttribute("d")?.trim()
);

const blobs = [];

wrappers.forEach((w) => {
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
    body = Bodies.circle(baseX, -Math.random() * 300 - r, r, {
      restitution: 0.45,
      friction: 0.3,
      frictionAir: 0.04,
      density: 0.002
    });
  }

  /* 💤 No dormir nunca */
  body.isSleeping = false;
  body.sleepThreshold = Infinity;

  World.add(world, body);
  blobs.push({ wrapper: w, body, baseX, baseY });
});

/* 🌀 Aura opcional — empuje con cursor cerca */
const container = document.querySelector(".container");
let cursor = { x: null, y: null };

container.addEventListener("pointermove", (e) => {
  const rect = container.getBoundingClientRect();
  cursor.x = e.clientX - rect.left;
  cursor.y = e.clientY - rect.top;
});
container.addEventListener("pointerleave", () => {
  cursor.x = cursor.y = null;
});

const AURA_RADIUS = 220;
const AURA_FORCE = 0.7;

/* 🖱️ Drag & Drop */
const mouse = Mouse.create(container);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false }
  }
});
World.add(world, mouseConstraint);

/* ▶ Run engine */
Runner.run(Runner.create(), engine);

/* 🔁 Loop */
Events.on(engine, "afterUpdate", () => {
  blobs.forEach(({ wrapper, body, baseX, baseY }) => {
    /* Aura force */
    if (cursor.x != null) {
      const dx = body.position.x - cursor.x;
      const dy = body.position.y - cursor.y;
      const d = Math.hypot(dx, dy);
      if (d < AURA_RADIUS && d > 1) {
        const m = AURA_FORCE * Math.pow(1 - d / AURA_RADIUS, 2);
        Body.applyForce(body, body.position, {
          x: (dx / d) * m,
          y: (dy / d) * m
        });
      }
    }

    /* Sync transform */
    const dx = body.position.x - baseX;
    const dy = body.position.y - baseY;
    wrapper.style.transform = `translate(${dx}px, ${dy}px) rotate(${body.angle}rad)`;
    wrapper.style.transformOrigin = "center center";
  });
});
