// Taken from https://www.khanacademy.org/computer-programming/ray-tracer/5975635851100160
// See life demo there.
var normalize = function (v) {
    var m = 1/sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    return [v[0]*m, v[1]*m, v[2]*m];
};
var rot = function (v, a, a2) {
    var cosa = cos(a);
    var sina = sin(a);
    var ovx = v[1];
    v[1] = v[1]*cosa - v[2]*sina;
    v[2] = ovx*sina + v[2]*cosa;
    
    cosa = cos(a2);
    sina = sin(a2);
    var ovx = v[0];
    v[0] = v[0]*cosa - v[1]*sina;
    v[1] = ovx*sina + v[1]*cosa;
    
    return v;
};
var cross = function (a,b) {
    return [
        a[1]*b[2] - a[2]*b[1],
        -(a[0]*b[2] - a[2]*b[0]),
        a[0]*b[1] - a[1]*b[0]
    ];
};
var dot = function (a,b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
};

var INTERSECTION_ID = -1;
var castRay = function (ox,oy,oz, dx,dy,dz) {
    var d = Infinity;
    var nx = 0,
        ny = 0,
        nz = 0;
    // ROOM INTERSECTION
    var mx = 1/dx,
        my = 1/dy,
        mz = 1/dz;
    
    var s = 10;
    // y-facing walls
    var dw = (s-oy)*my;
    if (dw > 0.01) { d = dw; ny = -1; INTERSECTION_ID = 0; }
    dw = -(s+oy)*my;
    if (dw > 0.01 && dw < d) { d = dw; ny = 1; INTERSECTION_ID = 1; }
    
    // x-facing walls
    dw = (s-ox)*mx;
    if (dw > 0.01 && dw < d) { d = dw; nx = -1; ny = 0; INTERSECTION_ID = 2; }
    dw = -(s+ox)*mx;
    if (dw > 0.01 && dw < d) { d = dw; nx = 1; ny = 0; INTERSECTION_ID = 3; }
    
    // z-facing walls
    dw = (s-oz)*mz;
    if (dw > 0.01 && dw < d) { d = dw; nz = -1; ny = 0; nx = 0; INTERSECTION_ID = 4; }
    dw = -(s+oz)*mz;
    if (dw > 0.01 && dw < d) { d = dw; nz = 1; ny = 0; nx = 0; INTERSECTION_ID = 5; }
    
    // Box
    ox += 3;
    oy -= 4;
    oz -= 3;
    var boxSizeX = 1.5,
        boxSizeY = 2,
        boxSizeZ = 1;
    var nnx = mx*ox,
        nny = my*oy,
        nnz = mz*oz;
    var kx = Math.abs(mx)*boxSizeX,
        ky = Math.abs(my)*boxSizeY,
        kz = Math.abs(mz)*boxSizeZ;
    var t1x = -nnx - kx,
        t1y = -nny - ky,
        t1z = -nnz - kz;
    var t2x = -nnx + kx,
        t2y = -nny + ky,
        t2z = -nnz + kz;
    var tN = max( max( t1x, t1y ), t1z );
    var tF = min( min( t2x, t2y ), t2z );
    if (!(tN > tF || tF < 0)) {
        d = min(d, tN);
        d = min(d, tF);
        INTERSECTION_ID = 6;
        nx = 0;
        ny = 0;
        nz = 0;
        if (t1x > t1y && t1x > t1z) { nx = 1; }
        else if (t1y > t1z) { ny = -1; }
        else { nz = -1; }
    }
    
    return [abs(d), nx,ny,nz];
};

var getRay = function (x,y, cx,cy,cz, lx,ly,lz, z) {
    var f = normalize([lx-cx, ly-cy, lz-cz]);
    var r = normalize(cross([0,0,1],f));
    var u = cross(f,r);
    var i = [
        f[0]*z + x*r[0] + y*u[0],
        f[1]*z + x*r[1] + y*u[1],
        f[2]*z + x*r[2] + y*u[2]
    ];
    return normalize(i);
};

var render = function (ro, rd, rec) {
    rec = rec === undefined ? 5 : rec;
    
    if (rec <= 0) { return [0,0,0]; }
    
    var d = castRay(ro[0],ro[1],ro[2], rd[0],rd[1],rd[2]);
    
    var mat = [0.4, 0.4, 0.4];
    if (INTERSECTION_ID === 5) { return [6,6,6]; }
    if (INTERSECTION_ID === 4 || INTERSECTION_ID === 1) { mat = [0.9,0.2,0.2]; }
    else if (INTERSECTION_ID === 3 || INTERSECTION_ID === 2) { mat = [0.2,0.9,0.2]; }
    
    var nro = [
        ro[0] + rd[0]*d[0],
        ro[1] + rd[1]*d[0],
        ro[2] + rd[2]*d[0]
    ];
    var nrd;
    // Make sure the ray is never going into the surface by finding the midray between the normal and the random ray
    if (INTERSECTION_ID === 6) {
        mat = [0.9, 0.9, 0.9];
        var dott = rd[0]*d[1] + rd[1]*d[2] + rd[2]*d[3];
        nrd = [
            rd[0] - 2*dott*d[1],
            rd[1] - 2*dott*d[2],
            rd[2] - 2*dott*d[3]
        ];
    }
    else {
        nrd = normalize([random(-1,1), random(-1,1), random(-1,1)]);
        nrd = [
            (d[1]+nrd[0]) / 2,
            (d[2]+nrd[1]) / 2,
            (d[3]+nrd[2]) / 2
        ];
    }
    nrd = normalize(nrd);
    
    var dt = d[1]*nrd[0] + d[2]*nrd[1] + d[3]*nrd[2];
    
    if (dt <= 0) { return [0,0,0]; }
    var c = render(nro, nrd, rec - 1);
    var d2 = dt;
    
    return [
        c[0]*d2 * mat[0],
        c[1]*d2 * mat[1],
        c[2]*d2 * mat[2]
    ];
};

var img = createGraphics(width,height, P2D);
img.background(0);
var samples = 0;
draw = function() {
    img.loadPixels();
    var p = img.imageData.data;
    var plen = p.length;
    
    var i, x,y;
    var rd, col, v;
    
    var cam = [0.3,-1,0];
    var lookat = [0,0,0];
    var zoom = 1;
    
    var fra = (samples-1)/samples;
    var frb = 1/samples;
    
    for (i = 0; i < plen; i += 4) {
        x = ((i / 4) % width + random()) / width * 2 - 1;
        y = ((i / 4 / width) + random()) / height* 2 - 1;
        
        rd = getRay(x,y, cam[0],cam[1],cam[2], lookat[0],lookat[1],lookat[2], zoom);
        col = render(cam, rd);
        
        v = p[i+0]; v = (v*fra + frb*col[0]*255); p[i+0] = v+0.5;
        v = p[i+1]; v = (v*fra + frb*col[1]*255); p[i+1] = v+0.5;
        v = p[i+2]; v = (v*fra + frb*col[2]*255); p[i+2] = v+0.5;
        
    }
    
    img.updatePixels();
    samples ++;
    
    image(img, 0,0);
};

// From https://www.khanacademy.org/computer-programming/glass-cubes-3/4839551921045504
var optimize = function(){
    var str = optimize.caller.toString();
    var os = optimize.toString();
    var i = str.indexOf(os);
    str = str.slice(0, i) + function(){setup();} + str.slice(i+os.length);
    
    str = str
    .replace(/(__)env__\.\$(\w+) = /g, "const $$$2 = ")
    .replace(/(__)env__\.\$(\w+)/g, "$$$2")
    .replace(/var\s+\$(\w+)/g, "const $$$1")
    .replace(/(__)env__\.KAInfiniteLoopProtect\(.*\);/g, "")
    .replace(/(__)env__\.KAInfiniteLoopCount = 0;/g, "")
    .replace(/(__)env__\.KAInfiniteLoopCount > 1000/g, "")
    .replace(/(__)env__\.KAInfiniteLoopCount\+\+;\s+if \(\) {\s+}\n/g, "")
    .replace(/(__)env__\.KAInfiniteLoopSetTimeout\(\d+\);\n/g, "");
    
    var optimized = Object.constructor("__env__", "\"use strict\"; return (" + str + ")")(this);
    
    var nil = function(){};
    setup = draw = nil;
    noLoop();
    optimized();
};optimize();
