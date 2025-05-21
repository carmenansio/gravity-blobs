/*  👇 Pega esto como <script type="module">  — HTML y CSS no cambian  */
import Matter from "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm";
import decomp from "https://cdn.jsdelivr.net/npm/poly-decomp@0.3.0/+esm";
window.decomp = decomp;

const { Engine, World, Bodies, Body, Runner, Events, Svg } = Matter;

const WIDTH = 1024, HEIGHT = 512;

/* Motor con gravedad “visible” */
const engine = Engine.create();
engine.gravity.y     = 1;     // hacia abajo
engine.gravity.scale = 0.01;  // 10× más aceleración que la default
const world = engine.world;

/* Suelo y paredes */
World.add(world, [
  Bodies.rectangle(WIDTH/2, HEIGHT+30, WIDTH, 60, { isStatic:true }),
  Bodies.rectangle(-30,      HEIGHT/2, 60, HEIGHT,{ isStatic:true }),
  Bodies.rectangle(WIDTH+30, HEIGHT/2, 60, HEIGHT,{ isStatic:true })
]);

/* Blobs -> polígonos */
const wrappers = [...document.querySelectorAll(".blob-wrapper")]
                 .filter(w => w.querySelector(".blob")?.getAttribute("d"));

const blobs = wrappers.map(w => {
  const path   = w.querySelector(".blob");
  const verts  = Svg.pathToVertices(path, 25);
  const box    = path.getBBox();
  const baseX  = box.x + box.width /2;
  const baseY  = box.y + box.height/2;

  let body = Bodies.fromVertices(
    baseX,
    -Math.random()*300 - box.height,
    verts,
    { restitution:0.45, friction:0.3, frictionAir:0.04, density:0.002 },
    true
  );
  if (Array.isArray(body)) body = Body.create({ parts: body });
  World.add(world, body);

  /* Empujón al hover */
  w.addEventListener("pointerenter", () => {
    const IMPULSE = 0.1, R = 160;
    blobs.forEach(({ body: b }) => {
      const dx=b.position.x-body.position.x,
            dy=b.position.y-body.position.y,
            d =Math.hypot(dx,dy);
      if(d>0 && d<R){
        const m=IMPULSE*(1-d/R);
        Body.applyForce(b,b.position,{x:dx/d*m,y:dy/d*m});
      }
    });
    Body.applyForce(body, body.position, { x:0, y:-IMPULSE*4 });
  });

  return { group:w, body, baseX, baseY };
});

/* Run motor */
Runner.run(Runner.create(), engine);

/* Sincronizar SVG */
Events.on(engine,"afterUpdate",()=>{
  blobs.forEach(({group,body,baseX,baseY})=>{
    const dx=body.position.x-baseX,
          dy=body.position.y-baseY;
    group.style.transform=`translate(${dx}px,${dy}px) rotate(${body.angle}rad)`;
    group.style.transformOrigin="center center";
  });
});
