/* ———  Imports & setup idénticos ——— */
import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
import decomp from "https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/+esm";
window.decomp = decomp;
const { Engine, World, Bodies, Body, Runner, Events, Svg } = Matter;

const WIDTH = 1024, HEIGHT = 512;

/* Motor con gravedad visible */
const engine = Engine.create({
  gravity: { x:0, y:1, scale:0.01 },
  positionIterations:10, velocityIterations:8
});
const world = engine.world;

/* Paredes */
World.add(world, [
  Bodies.rectangle(WIDTH/2, HEIGHT+30, WIDTH, 60, { isStatic:true }),
  Bodies.rectangle(-30, HEIGHT/2, 60, HEIGHT, { isStatic:true }),
  Bodies.rectangle(WIDTH+30, HEIGHT/2, 60, HEIGHT, { isStatic:true })
]);

/* Blobs → cuerpo poligonal o círculo fallback */
const wrappers = [...document.querySelectorAll(".blob-wrapper")]
                 .filter(w => w.querySelector(".blob")?.getAttribute("d"));
const blobs = [];

wrappers.forEach(w=>{
  const path = w.querySelector(".blob");
  const box  = path.getBBox();
  const baseX= box.x+box.width/2, baseY= box.y+box.height/2;
  let body;
  try{
    const verts = Svg.pathToVertices(path,20);
    if(verts.length>=3){
      body = Bodies.fromVertices(
        baseX, -Math.random()*300-box.height, verts,
        {restitution:0.45, friction:0.3, frictionAir:0.04, density:0.002},
        true
      );
      if(Array.isArray(body)) body = Body.create({parts:body});
    }
  }catch{}
  if(!body){
    const r=Math.max(box.width,box.height)/2;
    body=Bodies.circle(baseX,-Math.random()*300-r,r,
      {restitution:0.45, friction:0.3, frictionAir:0.04, density:0.002});
  }
  World.add(world,body);
  blobs.push({wrapper:w, body, baseX, baseY});
});

/* —— NUEVO: “aura” de empuje alrededor del cursor —— */
const container = document.querySelector(".container");
let cursor = { x: null, y: null };
container.addEventListener("pointermove", e=>{
  const rect = container.getBoundingClientRect();
  cursor.x = (e.clientX - rect.left);   // coords en píxeles del recinto
  cursor.y = (e.clientY - rect.top);
});
container.addEventListener("pointerleave", ()=>{ cursor.x = cursor.y = null; });

const AURA_RADIUS = 160;   // px
const AURA_FORCE  = 0.12;  // intensidad base

/* —— Motor — run —— */
Runner.run(Runner.create(), engine);

/* —— Sincronizar SVG y aplicar fuerza de cursor cada frame —— */
Events.on(engine,"afterUpdate",()=>{
  blobs.forEach(({wrapper,body,baseX,baseY})=>{
    /* 1. Fuerza del cursor */
    if(cursor.x!=null){
      const dx = body.position.x - cursor.x;
      const dy = body.position.y - cursor.y;
      const d  = Math.hypot(dx,dy);
      if(d < AURA_RADIUS && d > 1){
        const m = AURA_FORCE * (1 - d / AURA_RADIUS);
        Body.applyForce(body, body.position, { x:(dx/d)*m, y:(dy/d)*m });
      }
    }
    /* 2. Dibujar */
    const offX = body.position.x - baseX;
    const offY = body.position.y - baseY;
    wrapper.style.transform =
      `translate(${offX}px,${offY}px) rotate(${body.angle}rad)`;
    wrapper.style.transformOrigin="center center";
  });
});
