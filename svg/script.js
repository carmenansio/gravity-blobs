import { DotLottie } from "https://esm.sh/@lottiefiles/dotlottie-web";
import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
import decomp from "https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/+esm";
window.decomp = decomp;

const {
  Engine,
  World,
  Bodies,
  Body,
  Runner,
  Events,
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

/* 📦 Blobs animados con dotLottie */
const animationNames = ["angry", "sad", "laughing"];
const src =
  "https://lottie.host/294b684d-d6b4-4116-ab35-85ef566d4379/VkGHcqcMUI.lottie";

const wrappers = document.querySelectorAll(".blob-wrapper");
const blobs = [];

animationNames.forEach((name, i) => {
  const wrapper = wrappers[i];
  const canvas = wrapper.querySelector("canvas");

  // reproducir segmento
  const player = new DotLottie({
    canvas,
    src,
    loop: true,
    autoplay: true,
    renderer: "canvas",
    animationName: name
  });

  const size = 100 + Math.random() * 50;
  canvas.width = canvas.height = size;

  const x = 200 + i * 200;
  const y = -Math.random() * 300;

  const body = Bodies.circle(x, y, size / 2, {
    restitution: 0.45,
    friction: 0.3,
    frictionAir: 0.04,
    density: 0.002
  });

  body.isSleeping = false;
  body.sleepThreshold = Infinity;

  World.add(world, body);
  blobs.push({ wrapper, body, baseX: x, baseY: y });
});

/* 🖱️ Drag & drop con colisiones */
const container = document.querySelector(".container");
const mouse = Mouse.create(container);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false }
  }
});
World.add(world, mouseConstraint);

/* ▶ Ejecutar motor */
Runner.run(Runner.create(), engine);

/* 🔁 Actualizar posición de blobs */
Events.on(engine, "afterUpdate", () => {
  blobs.forEach(({ wrapper, body, baseX, baseY }) => {
    const dx = body.position.x - baseX;
    const dy = body.position.y - baseY;
    wrapper.style.transform = `translate(${dx}px, ${dy}px) rotate(${body.angle}rad)`;
    wrapper.style.transformOrigin = "center center";
  });
});
