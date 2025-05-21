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

/* 🧱 Paredes del contenedor */
World.add(world, [
  Bodies.rectangle(WIDTH / 2, HEIGHT + 30, WIDTH, 60, { isStatic: true }), // suelo
  Bodies.rectangle(-30, HEIGHT / 2, 60, HEIGHT, { isStatic: true }), // izquierda
  Bodies.rectangle(WIDTH + 30, HEIGHT / 2, 60, HEIGHT, { isStatic: true }) // derecha
]);

/* ⚙️ Blobs con animaciones específicas */
const animationNames = ["angry", "sad", "laughing"];
const src =
  "https://lottie.host/294b684d-d6b4-4116-ab35-85ef566d4379/VkGHcqcMUI.lottie";

const wrappers = document.querySelectorAll(".blob-wrapper");
const container = document.querySelector(".container");

const blobs = [];

animationNames.forEach((name, i) => {
  const wrapper = wrappers[i];
  const canvas = wrapper.querySelector("canvas");

  // Tamaño base del blob
  const size = 100 + Math.random() * 40;
  canvas.width = canvas.height = size;

  // Posición inicial dentro del contenedor
  const x = 150 + i * 250;
  const y = -100;

  // Iniciar player Lottie
  const player = new DotLottie({
    canvas,
    src,
    loop: true,
    autoplay: true,
    renderer: "canvas",
    animationName: name
  });

  // Crear cuerpo físico (círculo)
  const body = Bodies.circle(x, y, size / 2, {
    restitution: 0.45,
    friction: 0.3,
    frictionAir: 0.04,
    density: 0.002
  });

  body.isSleeping = false;
  body.sleepThreshold = Infinity;

  World.add(world, body);

  // Guardamos referencia para sincronizar transform
  blobs.push({ wrapper, body });
});

/* 🖱️ Drag real con colisiones */
const mouse = Mouse.create(container);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false }
  }
});
World.add(world, mouseConstraint);

/* ▶ Iniciar el motor */
Runner.run(Runner.create(), engine);

/* 🔁 Loop visual para transformar el wrapper */
Events.on(engine, "afterUpdate", () => {
  blobs.forEach(({ wrapper, body }) => {
    wrapper.style.transform = `translate(${body.position.x}px, ${body.position.y}px) rotate(${body.angle}rad)`;
    wrapper.style.transformOrigin = "center center";
  });
});
