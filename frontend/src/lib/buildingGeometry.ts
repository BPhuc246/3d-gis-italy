export type BuildingInput = {
  slug: string; footprintLengthM: number; footprintWidthM: number; heightM: number;
  longitude: number; latitude: number; headingDeg: number;
  porticoWidthM?: number; porticoDepthM?: number; porticoCenterNorthM?: number;
};
type V = [number, number, number];
export type BuildingMesh = {
  position: number[]; normal: number[];
  components: { faces: number[]; color: string }[];
};

// Small procedural meshes: shared materials, no textures, downloads or animation.
export function makeBuildingMesh(place: BuildingInput): BuildingMesh {
  const length = Math.min(300, Math.max(5, Number(place.footprintLengthM) || 25));
  const width = Math.min(300, Math.max(5, Number(place.footprintWidthM) || 20));
  const height = Math.min(100, Math.max(5, Number(place.heightM) || 20));
  const colors = place.slug === 'colosseum' ? ['#c9ad8a', '#dec6a4', '#a28d73', '#d5be94']
    : place.slug === 'pantheon' ? ['#d4c9b3', '#e4d8bd', '#aa9d88', '#b6aa93']
    : ['#d7c9ad', '#e7d9be', '#bca989', '#c9b18c'];
  const result: BuildingMesh = { position: [], normal: [], components: colors.map(color => ({ color, faces: [] })) };
  function triangle(a: V, b: V, c: V, material = 0, normals?: [V, V, V]) {
    const u = b.map((n, i) => n - a[i]), v = c.map((n, i) => n - a[i]);
    const cross: V = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const magnitude = Math.hypot(...cross);
    if (magnitude < 1e-8) return;
    const normal = cross.map(n => n / magnitude);
    const first = result.position.length / 3;
    result.position.push(...a, ...b, ...c);
    result.normal.push(...(normals?.[0] ?? normal), ...(normals?.[1] ?? normal), ...(normals?.[2] ?? normal));
    result.components[material].faces.push(first, first + 1, first + 2);
  }
  function quad(a: V, b: V, c: V, d: V, material = 0) {
    triangle(a, b, c, material); triangle(a, c, d, material);
  }
  function box(x: number, y: number, z: number, w: number, d: number, h: number, material = 0) {
    const p: V[] = [[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z],
      [x-w/2,y-d/2,z+h],[x+w/2,y-d/2,z+h],[x+w/2,y+d/2,z+h],[x-w/2,y+d/2,z+h]];
    [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7],[3,2,1,0]].forEach(([a,b,c,d]) => quad(p[a],p[b],p[c],p[d],material));
  }
  function ring(rx: number, ry: number, innerX: number, innerY: number, z: number, h: number, material = 0, start = 0, end = Math.PI * 2, segments = 48) {
    const p = (x: number, y: number, a: number, elevation: number): V => [x*Math.cos(a),y*Math.sin(a),elevation];
    for (let i=0; i<segments; i++) {
      const a=start+(end-start)*i/segments, b=start+(end-start)*(i+1)/segments;
      quad(p(rx,ry,a,z),p(rx,ry,b,z),p(rx,ry,b,z+h),p(rx,ry,a,z+h),material);
      quad(p(innerX,innerY,b,z),p(innerX,innerY,a,z),p(innerX,innerY,a,z+h),p(innerX,innerY,b,z+h),material);
      quad(p(rx,ry,a,z+h),p(rx,ry,b,z+h),p(innerX,innerY,b,z+h),p(innerX,innerY,a,z+h),material);
    }
    if (end-start < Math.PI*2-.01) {
      quad(p(innerX,innerY,start,z),p(rx,ry,start,z),p(rx,ry,start,z+h),p(innerX,innerY,start,z+h),material);
      quad(p(rx,ry,end,z),p(innerX,innerY,end,z),p(innerX,innerY,end,z+h),p(rx,ry,end,z+h),material);
    }
  }
  function cylinder(x: number, y: number, z: number, radius: number, h: number, material = 0, segments = 12) {
    for(let i=0;i<segments;i++) {
      const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
      const p=(t:number,e:number):V=>[x+radius*Math.cos(t),y+radius*Math.sin(t),e];
      quad(p(a,z),p(b,z),p(b,z+h),p(a,z+h),material);
      triangle([x,y,z+h],p(a,z+h),p(b,z+h),material);
    }
  }
  // Fill a rectangular facade section around a real arched opening.
  function arch(section: number, opening: number, spring: number, top: number, depth: number, map: (x:number,y:number,z:number)=>V, material=0) {
    const radius=opening/2;
    const panel=(x0:number,z0:number,x1:number,z1:number,x2:number,z2:number,x3:number,z3:number) => {
      quad(map(x3,depth/2,z3),map(x2,depth/2,z2),map(x1,depth/2,z1),map(x0,depth/2,z0),material);
      quad(map(x0,-depth/2,z0),map(x1,-depth/2,z1),map(x2,-depth/2,z2),map(x3,-depth/2,z3),material);
    };
    panel(-section/2,0,-radius,0,-radius,top,-section/2,top);
    panel(radius,0,section/2,0,section/2,top,radius,top);
    for(let i=0;i<8;i++) {
      const a=Math.PI-i*Math.PI/8,b=Math.PI-(i+1)*Math.PI/8;
      const x0=radius*Math.cos(a),x1=radius*Math.cos(b),z0=spring+radius*Math.sin(a),z1=spring+radius*Math.sin(b);
      panel(x0,z0,x1,z1,x1,top,x0,top);
      quad(map(x0,depth/2,z0),map(x1,depth/2,z1),map(x1,-depth/2,z1),map(x0,-depth/2,z0),material);
    }
    for(const x of [-radius,radius]) quad(map(x,-depth/2,0),map(x,depth/2,0),map(x,depth/2,spring),map(x,-depth/2,spring),2);
    for(const x of [-section/2,section/2]) quad(map(x,-depth/2,0),map(x,-depth/2,top),map(x,depth/2,top),map(x,depth/2,0),material);
    quad(map(-section/2,-depth/2,top),map(-section/2,depth/2,top),map(section/2,depth/2,top),map(section/2,-depth/2,top),1);
  }
  if(place.slug==='colosseum') {
    const rx=length/2,ry=width/2,bays=40,tierH=height*.265;
    ring(rx+1.5,ry+1.5,rx-6,ry-6,0,1.5,1);
    for(let tier=0;tier<3;tier++) {
      for(let i=0;i<bays;i++) {
        // A lower surviving section breaks the perfect cylindrical silhouette.
        if(tier>0 && i>=23 && i<35) continue;
        const a=(i+.5)*Math.PI*2/bays;
        const cx=(rx-tier*.45)*Math.cos(a),cy=(ry-tier*.45)*Math.sin(a);
        const tx=-rx*Math.sin(a),ty=ry*Math.cos(a),norm=Math.hypot(tx,ty);
        const tangent=[tx/norm,ty/norm],outward=[tangent[1],-tangent[0]];
        const span=norm*Math.PI*2/bays*1.015;
        arch(span,span*.69,tierH*.44,tierH,3.8,(x,y,z)=>[cx+tangent[0]*x+outward[0]*y,cy+tangent[1]*x+outward[1]*y,1.5+tier*tierH+z]);
      }
      ring(rx-tier*.45+2,ry-tier*.45+2,rx-5,ry-5,1.5+(tier+1)*tierH,.9,1, tier===0 ? 0 : 35*Math.PI*2/bays, tier===0 ? Math.PI*2 : (23+bays)*Math.PI*2/bays);
    }
    ring(rx-1.2,ry-1.2,rx-5,ry-5,1.5+3*tierH,height*.14,0,35*Math.PI*2/bays,(23+bays)*Math.PI*2/bays);
    for(let tier=0;tier<4;tier++) {
      const outer=.86-tier*.09,inner=outer-.085;
      ring(rx*outer,ry*outer,rx*inner,ry*inner,1.5,3+(3-tier)*3.4,tier%2 ? 3 : 2);
    }
    ring(rx*.47,ry*.43,0,0,.12,.35,3);
  } else if(place.slug==='arch-of-constantine') {
    const scale=length/25;
    const depth=width*.8;
    box(0,0,0,length,width,.7,1);
    for(const [cx,section,opening,spring] of [[-8.4,8.2,4.5,6.2],[0,8.6,6.4,9.0],[8.4,8.2,4.5,6.2]]) {
      arch(section*scale,opening*scale,spring*height/21,height*.72,depth,(x,y,z)=>[cx*scale+x,y,z+.7]);
    }
    box(0,0,height*.72+.7,length,depth*1.1,.7,1);
    box(0,0,height*.72+1.4,length*.96,depth,height*.21,0);
    box(0,0,height*.93+1.4,length,depth*1.1,.55,1);
    for(const x of [-10.4,-4.65,4.65,10.4]) for(const side of [-1,1]) {
      cylinder(x*scale,side*width*.40,.7,.55*scale,height*.60,1,10);
      box(x*scale,side*width*.40,height*.60,1.7*scale,1.4*scale,.8,1);
      box(x*scale,side*width*.40,.5,1.6*scale,1.4*scale,.65,2);
    }
    for(const side of [-1,1]) box(0,side*(depth/2+.05),height*.79,length*.43,.15,height*.11,1);
  } else {
    const radius=width/2,drum=height*.5;
    cylinder(0,0,0,radius,drum,0,48);
    ring(radius*1.025,radius*1.025,radius*.95,radius*.95,drum-1,1.4,1);
    // Smooth normals on a continuous low-poly dome, with an actual oculus.
    const bands=10,sectors=48,domeH=height*.43;
    const p=(theta:number,phi:number):V=>[radius*Math.sin(theta)*Math.cos(phi),radius*Math.sin(theta)*Math.sin(phi),drum+domeH*Math.cos(theta)];
    const n=(theta:number,phi:number):V=>{const v:V=[Math.sin(theta)*Math.cos(phi)/radius,Math.sin(theta)*Math.sin(phi)/radius,Math.cos(theta)/domeH];const m=Math.hypot(...v);return v.map(x=>x/m) as V;};
    for(let j=0;j<bands;j++) for(let i=0;i<sectors;i++) {
      const t=.12+(Math.PI/2-.12)*j/bands,u=.12+(Math.PI/2-.12)*(j+1)/bands;
      const a=i*Math.PI*2/sectors,b=(i+1)*Math.PI*2/sectors;
      triangle(p(t,a),p(u,a),p(u,b),3,[n(t,a),n(u,a),n(u,b)]);
      triangle(p(t,a),p(u,b),p(t,b),3,[n(t,a),n(u,b),n(t,b)]);
    }
    ring(radius*.12,radius*.12,radius*.095,radius*.095,drum+domeH*.992-.3,.45,1);
    const porchW=place.porticoWidthM ?? length*.78,porchD=place.porticoDepthM ?? width*.43;
    const porchY=place.porticoCenterNorthM ?? radius+porchD*.28,colH=height*.31;
    box(0,porchY,0,porchW+.4,porchD+.4,1,1);
    for(let row=0;row<2;row++) for(let i=0;i<8;i++) {
      const x=-porchW*.45+i*porchW*.9/7,y=porchY+porchD*.34-row*porchD*.61;
      cylinder(x,y,1,.62,colH,1,10);
      box(x,y,colH+1,1.65,1.65,.7,1);
      cylinder(x,y,.9,.85,.45,2,10);
    }
    const z=colH+1.7,peak=z+height*.105;
    box(0,porchY,z,porchW+1.5,porchD,.75,1);
    for(const side of [-1,1]) triangle([-porchW/2,porchY+side*porchD/2,z+.75],[porchW/2,porchY+side*porchD/2,z+.75],[0,porchY+side*porchD/2,peak],side===1 ? 1 : 0);
    quad([-porchW/2,porchY-porchD/2,z+.75],[0,porchY-porchD/2,peak],[0,porchY+porchD/2,peak],[-porchW/2,porchY+porchD/2,z+.75],2);
    quad([0,porchY-porchD/2,peak],[porchW/2,porchY-porchD/2,z+.75],[porchW/2,porchY+porchD/2,z+.75],[0,porchY+porchD/2,peak],2);
  }
  const a=(Number(place.headingDeg)||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  for(let i=0;i<result.position.length;i+=3) {
    const x=result.position[i],y=result.position[i+1],nx=result.normal[i],ny=result.normal[i+1];
    result.position[i]=x*c+y*s;result.position[i+1]=-x*s+y*c;
    result.normal[i]=nx*c+ny*s;result.normal[i+1]=-nx*s+ny*c;
  }
  return result;
}

export function modelMask(place: BuildingInput): number[][] {
  const angle=(Number(place.headingDeg)||0)*Math.PI/180;
  const halfX=Number(place.footprintLengthM)/2+6,halfY=Number(place.footprintWidthM)/2+6;
  const north=place.slug==='pantheon' ? Math.max(halfY,(place.porticoCenterNorthM ?? halfY)+(place.porticoDepthM ?? 20)/2+6) : halfY;
  return [[-halfX,-halfY],[-halfX,north],[halfX,north],[halfX,-halfY],[-halfX,-halfY]].map(([x,y])=>{
    const east=x*Math.cos(angle)+y*Math.sin(angle),north=-x*Math.sin(angle)+y*Math.cos(angle);
    return [place.longitude+east/(111320*Math.cos(place.latitude*Math.PI/180)),place.latitude+north/111320];
  });
}
