/********************************************************************
 * Taken from https://www.khanacademy.org/computer-programming/gold-ore/6112506425786368
 * See live demo there.
*********************************************************************/

// call resetProgram if you're making any changes to what is rendered so that it will rerender the scene with those changes.  Otherwise, don't call it so that when youpress "restart" or make any other minor change to the program that doesn't have to do with the rendering, it restarts where you left off last time
var resetProgram = function () {
    Program.frames = [];
    Program.loadingAnimation = true;
    Program.currentFrame = 0;
    Program.loadingFrame = 0;
    Program.redrawing = false;
    Program.res = undefined;
};
resetProgram();

// Z axis is depth.  Positive is into the screen
/** Delag Variables **/
// Delag Variables (see blue comments below for explanations)
/**
 * res
        - the resolution of the image
        - lower = faster but blurrier
        - higher = slower but sharper

 * maxRes
        - if you increase res each time a frame is drawn, this tells
        you when to stop.  It's the maximum resolution it will get.
        - lower = faster load time, but blurrier final image
        - higher = longer load time, but sharper final image

 * numFrames
        - how many frames you want to render
        - lower = shorter animation but less load time
        - higher = longer animation but more load time

* maxLoopTime
        - how many milliseconds the drawing loop will run before 
        it pauses until the end of the frame
        - lower = better but takes a bit longer to load
        - higher = slightly faster load time, but more lag and badness (keep it < 50)
        - the ideal value is 1000 divided by your target frame rate
      
**/
var ores = 100;
var maxRes = width*2;
var numFrames = round(80*Math.PI); // enough frames for 1 rotation
var maxLoopTime = 50;

// For the animation
if (Program.currentFrame === undefined) { Program.currentFrame = 0; }
if (Program.loadingFrame === undefined) { Program.loadingFrame = 0; }
if (Program.res === undefined) { Program.res = ores; }

/** Usefull Functions **/
// These functions are mutch faster approximations of acos and atan
var acos2 = function (x) {
    var negate = x < 0;
    x = abs(x);
    var ret = -0.0187293;
    ret = ret * x;
    ret = ret + 0.0742610;
    ret = ret * x;
    ret = ret - 0.2121144;
    ret = ret * x;
    ret = ret + 1.5707288;
    ret = ret * sqrt(1.0-x);
    ret = ret - 2 * negate * ret;
    return negate * 3.14159265358979 + ret;
};
var fast_atan2 = function (y,x) {
    var PI_FLOAT = Math.PI;
    var PIBY2_FLOAT = Math.PI/2;
    if ( x === 0.0 )
	{
		if ( y > 0.0 ) { return PIBY2_FLOAT; }
		if ( y === 0.0 ) { return 0.0; }
		return -PIBY2_FLOAT;
	}
	var atn;
	var z = y/x;
	if ( abs( z ) < 1.0 )
	{
		atn = z/(1.0 + 0.28*z*z);
		if ( x < 0.0 )
		{
			if ( y < 0.0 ) { return atn - PI_FLOAT; }
			return atn + PI_FLOAT;
		}
	}
	else
	{
		atn = PIBY2_FLOAT - z/(z*z + 0.28);
		if ( y < 0.0 ) { return atn - PI_FLOAT; }
	}
	return atn;
};

// Converts a vector to spherical coordinates
var vect2Sph = function (x,y,z, isNormalized) {
    var r;
    if (isNormalized) { r = 1; }
    else { r = sqrt(x*x + y*y + z*z); }
    var theta = acos2(z/r);
    var psi = fast_atan2(y,x);
    return [r,theta,psi];
};

var sqrt2PI = sqrt(2*Math.PI); // used for computing the bell curve

// Maps a pixel from one resolution to another
var mapPixel = function (x,y, w1,h1, w2,h2) {
    return [map(x,0,w1,0,w2), map(y,0,h1,0,h2)];
};

// Background if there's no intersection
var background1 = function (x,y) {
    var d = 4000/dist(x,y,ores/2,ores/2);
    return [d,d,d];
};

noiseDetail(7,0.5);

/****************
 * 3D GRAPHICS
****************/
/** Materials and Textures **/
// This function returns the color of light reflecting off a material at a certain angle
/*
- r is the amount of red    (0-1)
- g is the amount of green  (0-1)
- b is the amount of blue   (0-1)
- gloss determines how glossy the material is.  The intensity of the light reflected back to the camera given the angle between the ray of light and the expected reflection ray follows a bell curve for which gloss is the standard deviation

- (lx,ly,lz) is the position of the light
- (ix,iy,iz) is the position of the intersection point
- (nx,ny,nz) is the normal of the intersected point
- (cx,cy,cz) is the position of the camera (or point receiving the light)
*/
var reflectLight = function (
    r,g,b, gloss,
    lx,ly,lz,
    ix,iy,iz,
    nx,ny,nz,
    cx,cy,cz
) 
{
    // A normalized vector pointing from the light toward the intersection
    var vlx,vly,vlz,vlm; 
    vlx = ix - lx;
    vly = iy - ly;
    vlz = iz - lz;
    vlm = sqrt(vlx*vlx + vly*vly + vlz*vlz);
    
    // Normalize the light vector
    vlx /= vlm;
    vly /= vlm;
    vlz /= vlm;
    
    // A normalized vector pointing from the camera toward the intersection
    var vcx, vcy, vcz, vcm;
    vcx = ix - cx;
    vcy = iy - cy;
    vcz = iz - cz;
    vcm = sqrt(vcx*vcx + vcy*vcy + vcz*vcz);
    
    // Normalize the camera vector
    vcx /= vcm;
    vcy /= vcm;
    vcz /= vcm;
    
    // Get the dot product between the light vector and the normal
    var dot = vlx*nx + vly*ny + vlz*nz;
    
    // Get the reflected ray of light
    var vlrx, vlry, vlrz, vlrm;
    vlrx = vlx - 2*dot*nx;
    vlry = vly - 2*dot*ny;
    vlrz = vlz - 2*dot*nz;
    
    // Get the dot product between the camera and the reflected ray of light
    dot = vlrx*vcx + vlry*vcy + vlrz*vcz;
    
    // Get the angle from the dot product
    var angle = acos2(dot);
    
    // Get the intensity of the light using a bell curve
    var intensity = 1 / 
        (gloss * sqrt(2*Math.PI)) *
        pow(
            Math.E,
            -0.5 * sq( (angle) / gloss )
        );
    
    // Return the color
    return [
        intensity * r,
        intensity * g,
        intensity * b
    ];
};


// Diffuse Shaders
var LambertShader = {
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    )
    {
        return max(dot1,0);
    }
};
var DiffuseShader = LambertShader;
var OrenNayarShader = function (roughness, albedo) {
    this.sigma = roughness;
    this.rho = albedo;
    
    // Precompute calculations for later
    var s = this.sigma*this.sigma;
    this.A = 1 - 0.5 * s / (s + 0.33);
    this.B = 0.45 * s / (s + 0.09);
};
OrenNayarShader.prototype = {
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    )
    {
        var n = vect2Sph(nx,ny,nz);
        var Li = vect2Sph(vlx,vly,vlz),
            ri = 1,
            θi = acos2(dot1),//Li[1] - n[1],
            φi = Li[2] - n[2];
        var Lr = vect2Sph(rx,ry,rz),
            rr = Lr[0],
            θr = Lr[1] - n[1],
            φr = Lr[2] - n[2];
            
        var ρ = this.rho;
        var σ = this.sigma;
        
        var α = max(θi, θr);
        var β = min(θi, θr);
        
        var A = this.A;
        var B = this.B;
        var E0 = this.E0;
        
        var i = (ρ/Math.PI) * Math.cos(θi) * (A + (B*max(0,Math.cos(φi - φr)) * Math.sin(α) * Math.tan(β)));
        
        return max(i,0);
    }
};

// Specular shaders
var PhongShader = function (shininess, brightness) {
    this.alpha = shininess;
    this.ks = brightness;
};
PhongShader.prototype = {
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    )
    {
        return max(this.ks * pow(max(dot2,0), this.alpha),0);
    }
};
var GaussianShader = function (smoothness, brightness) {
    this.m = constrain(smoothness,0,1);
    this.brightness = brightness;
};
GaussianShader.prototype = {
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    )
    {
        // Find the vector (H) halfway between vl and r
        var hx = (vlx + rx) / 2,
            hy = (vly + ry) / 2,
            hz = (vlz + rz) / 2,
            hm = sqrt(hx*hx + hy*hy + hz*hz);
        hx /= hm;
        hy /= hm;
        hz /= hm;
        
        // Get the angle between that vector and the normal
        var c = acos2(hx*nx + hy*ny + hz*nz);
        
        // Return a guassian distribution
        return max(
            pow(Math.E, -sq(c/this.m)) * this.brightness,
            0);
    }
};

// Mix shaders
var MixShader = function (shader1, shader2, weight) {
    this.shader1 = shader1;
    this.shader2 = shader2;
    this.weight = weight;
};
MixShader.prototype = {
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    )
    {
        var a = this.shader1.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        var b = this.shader2.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        return max(lerp(a,b, this.weight),0);
    }
};

var AddShader = function (shader1, shader2) {
    this.shader1 = shader1;
    this.shader2 = shader2;
};
AddShader.prototype = {
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    )
    {
        var a = this.shader1.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        var b = this.shader2.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        return max(a+b,0);
    }
};

var Material = function (r,g,b, shader) {
    this.r = r;
    this.g = g;
    this.b = b;
    
    this.or = this.r;
    this.og = this.g;
    this.ob = this.b;
    
    this.shader = shader;
};
Material.prototype = {
    // Returns the intensity of light reflected off the material
    /*
        - dot1: the dot product between the light vector and the normal
        - dot2: the dot product between the camera vector and the reflect light
        - vlx, vly, vlz: the vector pointing from the light toward the intersection
        - nx, ny, nz: the normal of the surface
        - rx, ry, rz: the camera's ray
        - vlrx, vlry, vlrz: the direction of the reflected light
    */
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    ) 
    {
        var i = this.shader.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        return [
            i * this.r,
            i * this.g,
            i * this.b
        ];
    },
    rgbEdit : function (lift) {
        this.r = this.or + lift;
        this.g = this.og + lift;
        this.b = this.ob + lift;
    },
};

var MixMat = function (mat1, mat2, weight) {
    this.mat1 = mat1;
    this.mat2 = mat2;
    this.weight = weight;
};
MixMat.prototype = {
    getIntensity : function (
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
    ) 
    {
        var a = this.mat1.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        var b = this.mat2.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        return [
            lerp(a[0], b[0], this.weight),
            lerp(a[1], b[1], this.weight),
            lerp(a[2], b[2], this.weight)
        ];
    },
};

/** Scene **/
var shapes = [];
var lghts = [];

var lumens = 6000; // the intensity of one unit of light
var ambiance = 0.00003; // how many lumens of ambiant lighting there should be
lghts.push({
    x:-26,
    y:-30,
    z:32,
    c:[1,1,1],
});
lghts.push({
    x:0,
    y:43,
    z:60,
    c:[0.6,0.4,0.2],
});
lghts.push({
    x:-30,
    y:-53,
    z:60,
    c:[0.3,0.2,0.5],
});

// Sphere
var Sphere = function (x,y,z, r, texture) {
    this.x = x;
    this.y = y;
    this.z = z;
    
    this.r = r;
    
    this.rotate(0,0);
    
    this.tex = texture;
    this.UV = [0,0,0];
};
Sphere.prototype = {
    rotate : function (x,y) {
        this.rotX = x;
        this.rotY = y;
        
        this.sinX = Math.sin(this.rotX);
        this.cosX = Math.cos(this.rotX);
        
        this.sinY = Math.sin(this.rotY);
        this.cosY = Math.cos(this.rotY);
    },
    getIntersection : function (
        rox, roy, roz,
        rx, ry, rz
    )
    {
        var sx = this.x,
            sy = this.y,
            sz = this.z,
            sr = this.r;
        
        var t,t0,t1;
        var a,b,c, rash; // for the quadratic formula
        a = 1; // because the ray is normalized
        b = (2*rox*rx - 2*rx*sx) + (2*roy*ry - 2*ry*sy) + (2*roz*rz - 2*rz*sz);
        c = (rox*rox - 2*rox*sx + sx*sx) + (roy*roy - 2*roy*sy + sy*sy) + (roz*roz - 2*roz*sz + sz*sz) - sr*sr;
        rash = b*b - 4*a*c;
        
        // If there is no intersection
        if (rash < 0) { return Infinity; }
        // If there is an intersection
        else {
            t0 = (-b + sqrt(rash)) / (2*a);
            t1 = (-b - sqrt(rash)) / (2*a);
            
            // If they're both behind the ray's origin
            if (t0 < 0 && t1 < 0) { return Infinity; }
            // If t0 is behind the ray's origin, set t to whichever's smaller, t or t1
            else if (t0 < 0) { t = t1 < t ? t1 : t; }
            // If t1 is behind the ray's oirigin, set t to whichever's smaller, t or t0
            else if (t1 < 0) { t = t0 < t ? t0 : t; }
            // If they're both in front of the camera, set t to whichever of the three is smallest
            else { t = (t < t0) ? ((t < t1) ? t : t1) : (t0 < t1 ? t0 : t1); }
            
            return t;
        }
    },
    getNormal : function (x,y,z, tx,ty,tz) {
        tx = tx === undefined ? this.UV[0] : tx;
        ty = ty === undefined ? this.UV[1] : ty;
        tz = tz === undefined ? this.UV[2] : tz;
        var n = [
            (this.x - x) / this.r,
            (this.y - y) / this.r,
            (this.z - z) / this.r
        ];
        n = this.tex.getNormal(tx,ty,tz, n[0],n[1],n[2]);
        return n;
    },
    pointIsInside : function (x,y,z) {
        x -= this.x;
        y -= this.y;
        z -= this.z;
        return x*x + y*y + z*z <= this.r*this.r;
    },
    isShadow : function (rox,roy,roz, rx,ry,rz) {
        return false; // for now, we're not worrying about shadows
    },
    getMaterial : function (x,y,z) {
        x = x === undefined ? this.UV[0] : x;
        y = y === undefined ? this.UV[1] : y;
        z = z === undefined ? this.UV[2] : z;
        return this.tex.getMaterial(x,y,z);
    },
    unwrap : function (x,y,z) {
        var tx = x-this.x, ty = y-this.y, tz = z-this.z;
    
        var t = [
            ty * this.cosX - tz * this.sinX,
            tz * this.cosX + ty * this.sinX
        ];
        ty = t[0]; tz = t[1];
        
        t = [
            tz * this.cosY - tx * this.sinY,
            tx * this.cosY + tz * this.sinY
        ];
        tz = t[0]; tx = t[1];
        
        tx = tx / this.r;
        ty = ty / this.r;
        tz = tz / this.r;
        
        if (this.tex.type === "3D") { this.UV = [tx,ty,tz]; return this.UV; }
        
        var a = fast_atan2(tz,tx);
        if (a < 0) { a += 2*Math.PI; }
        var u = a/(Math.PI);
        var v = acos2(ty/this.r)/Math.PI;
        
        this.UV = [u,v,1];
        return this.UV;
    }, // takes a point on the shape and returns the UV
};


/** Load the Scene Data **/
var shad1 = new AddShader(new OrenNayarShader(1,5), new GaussianShader(0.3, 0.1));
var shad2 = new MixShader(new OrenNayarShader(0,2), new GaussianShader(0.3, 5), 0.5);

var mat1 = new Material(0.2,0.25,0.23, shad1);
var mat2 = new Material(0.988,0.76078,0.2, shad2);
var mmat = new MixMat(mat1, mat2, 0);

var tex1 = {
    type : "3D", // the texture just takes in the cartessian point of intersection rather than UVs
    getHeightMap : function (x,y,z) {
        var s = 1;
        var h = noise(  x*s,
                        y*s,
                        z*s);
        return h;
    },
    getMaterial : function (x,y,z) {
        var h = this.getHeightMap(x,y,z);
        if (h < 0.47) { return mat2; }
        
        mat1.rgbEdit(0.3-h/2);
        
        return mat1;
    },
    getNormal : function (x,y,z, nx,ny,nz) {
        var h1 = this.getHeightMap(x-1,y,  z);
        var h2 = this.getHeightMap(x+1,y,  z);
        var h3 = this.getHeightMap(x,  y-1,z);
        var h4 = this.getHeightMap(x,  y+1,z);
        var h5 = this.getHeightMap(x,  y,z-1);
        var h6 = this.getHeightMap(x,  y,z+1);
        
        var sx = (h2-h1)/3;
        var sy = (h4-h3)/3;
        var sz = (h6-h5)/3;
        
        var h = 15;
        var gh = this.getHeightMap(x,y,z);
        if (gh < 0.47) { h /= (-1); }
        
        nx += sx*h;
        ny += sy*h;
        nz += sz*h;
        var m = sqrt(nx*nx + ny*ny + nz*nz);
        nx /= m;
        ny /= m;
        nz /= m;
        
        return [nx,ny,nz];
    },
};

shapes.push(new Sphere(0,0,100,30, tex1));

// Camera
var Camera = function (x,y,z, angleZ,angleY) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.angle = [angleZ, angleY];
    
    this.fov = 80; // field of view
    this.rz = 1 / tan(this.fov / 2); // distance between the viewing plane and the camera's origin
    
    // Precomupted cosine and sine values make later computations much faster
    this.computeTrig();
};
Camera.prototype = {
    // Precomputes cosine and sine values to make later computations much faster
    computeTrig : function () {
        this.cosZ = cos(this.angle[0]);
        this.sinZ = sin(this.angle[0]);
        this.cosY = cos(this.angle[1]);
        this.sinY = sin(this.angle[1]);
    },
};
var cam = new Camera(0,0,0, 0,0);

/** Render **/
// casts a ray into the scene and finds its first intersection point
/*
- (rox, roy, roz) is the ray origin
- (rx, ry, rz) is the ray's direction
*/
var castRay = function (
    rox, roy, roz,
    rx, ry, rz
) 
{
    var s = shapes;
    
    // Loop through each shape and find the closest intersection point
    var t = Infinity, t0; // t is the percent along the ray (rx,ry,rz) that the intersection is
    var obj = null; // obj is the object that the ray first intersects
    for (var i = 0; i < s.length; i++) {
        t0 = s[i].getIntersection(rox,roy,roz, rx,ry,rz);
        if (t0 < t) { obj = s[i]; t = t0; }
    }
    
    return [t, obj];
};

// renders the scene
var render = function (x,y, wid,hei) {
    // Shapes
    var s = shapes;
    // Lights
    var l = lghts;
    // Camera
    var cx = cam.x,
        cy = cam.y,
        cz = cam.z;
    
    var cosZ = cam.cosZ, cosY = cam.cosY;
    var sinZ = cam.sinZ, sinY = cam.sinY;
    
    var fov = cam.fov;
    
    // Define a ray starting at the camera's origin and passing through a particular pixel on the viewing plane
    // rx and ry are x and y mapped to a value between -1 and 1
    // rz is related to the field of view
    var rx = (x / wid * 2 - 1);
    var ry = (y / hei * 2 - 1);
    var rz = cam.rz;
    var rm; // magnitude for normalization later
    
    // Rotate the ray according to the camera's rotation
    var orx = rx, ory = ry, orz = rz;
    rx = orx * cosZ - orz * sinZ;
    rz = orx * sinZ + orz * cosZ;
    
    ry = ory * cosY - orz * sinY;
    rz*= ory * sinY + orz * cosY;
    
    // Normalize the ray
    rm = sqrt(rx*rx + ry*ry + rz*rz);
    rx /= rm;
    ry /= rm;
    rz /= rm;
    
    // Get the nearest intersection point
    var intersection = castRay(cx,cy,cz, rx,ry,rz);
    var t = intersection[0];
    var obj = intersection[1];
    
    if (t === Infinity) {
        return background1(x,y);
    }
    
    // Get the intersection as a vector
    var vcx = rx*t,
        vcy = ry*t,
        vcz = rz*t;
    
    // Get the intersection as a point
    var ix = cx + vcx,
        iy = cy + vcy,
        iz = cz + vcz;
    
    // Unwrap the intersection point to texture coordinates
    var t = obj.unwrap(ix,iy,iz);
    
    // Get the normals
    var n = obj.getNormal(ix,iy,iz),
        nx = n[0],
        ny = n[1],
        nz = n[2];
        
    // Find out what material we're using (especially important for textured objects)
    var mat = obj.getMaterial(t[0],t[1],t[2]);
    
    // Loop through all the lights and add together the total intensity that the point should be
    var ri = 0,
        gi = 0,
        bi = 0; // Red, green, and blue intensities
    var intensity; // an array of the intensities of each color component for each light
    var lx,ly,lz; // The position of each light
    var vlx, vly, vlz, vlm; // Vector from the light to the intersection point
    var vlrx, vlry, vlrz; // Vector for reflected light
    var dot1, dot2; // two dot products for later
    var col;
    for (var i = 0; i < l.length; i++) {
        // Get the position of the light
        lx = l[i].x;
        ly = l[i].y;
        lz = l[i].z;
        
        // If the light's inside the sphere, skip it
        if (obj.pointIsInside(lx,ly,lz)) { continue; }
        
        // Get the vector from the light to the intersection point (vector A - B points toward A)
        vlx = ix - lx;
        vly = iy - ly;
        vlz = iz - lz;
        vlm = sqrt(vlx*vlx + vly*vly + vlz*vlz);
        
        // Normalize the light vector
        vlx /= vlm;
        vly /= vlm;
        vlz /= vlm;
        
        // Check if this is a shadow ray
        if(obj.isShadow(lx,ly,lz, vlx,vly,vlz)) { continue; }
        
        // Get the dot product between bectors vl and n
        dot1 = vlx*nx + vly*ny + vlz*nz;
        
        // Checks if the shape is casting a shadow on itself
        if (dot1 < 0) { continue; }
        
        // Get the reflected ray of light
        vlrx = vlx - 2*dot1*nx;
        vlry = vly - 2*dot1*ny;
        vlrz = vlz - 2*dot1*nz;
        
        // Get the dot product between the camera ray and the reflected ray of light
        dot2 = -vlrx*rx - vlry*ry - vlrz*rz;
        
        intensity = mat.getIntensity(
            dot1, dot2,
            vlx,vly,vlz,
            nx,ny,nz,
            rx,ry,rz,
            vlrx,vlry,vlrz
        );
        intensity = max(intensity,0);
        var vlm2 = 1 / (vlm*vlm);
        
        ri += intensity[0] * l[i].c[0] * vlm2 * lumens;
        gi += intensity[1] * l[i].c[1] * vlm2 * lumens;
        bi += intensity[2] * l[i].c[2] * vlm2 * lumens;
    }
    
    
    ri += ambiance * lumens * max(mat.r,0);
    gi += ambiance * lumens * max(mat.g,0);
    bi += ambiance * lumens * max(mat.b,0);
    
    return [ri*255,gi*255,bi*255];
};

/****************
 * 2D GRAPHICS
(actually drawing
the rendered image)
****************/

/* Draw the Image */

var _lastIndex = 0; // allows the loop to exit if it is taking too long.  NOTE: to test if an image has finished rendering, check if _lastIndex === 0.
var _lastImg; // stores the last loaded or partially loaded image
_lastImg = undefined; // makes sure that it starts out undefined when you press "Restart"

var drawImage = function (wid, hei, img) {
    // Default width and height
    hei = hei || wid || height;
    wid = wid || width;
    
    // Loop timeout
    var mlt = maxLoopTime;
    var _millis = millis; // makes things a tiny bit faster
    var startMillis = _millis();
    
    // Create a blank new image
    var newImg = createGraphics(wid,hei, "P2D");
    newImg.background(0);
    var resize = false; // to know whether we're scaling up an image's resolution or not
    var owid = wid, ohei = hei;
    
    // If the img parameter is not left blank, either rescale it or just set newImg to it
    if (img !== undefined && wid === img.width && hei === img.height) { // if it hasn't yet finished loading this image
        newImg = img;
    }
    else if (img !== undefined) {
        resize = true;
        owid = img.width;
        ohei = img.height;
        img.loadPixels();
    }
    
    // Get the image's pixel data
    newImg.loadPixels();
    var _p = newImg.imageData.data;
    var plen = _p.length;
    var i,ii;
    
    // X and Y
    var x, y, xy;
    
    // Color of the pixel
    var col = [0,0,0];
    
    // Map Pixel
    var _mapPixel = mapPixel;
    for (i = _lastIndex; i < plen; i += 4) {
        // ~~ is faster than floor(), but only works on positive numbers
        x = ~~((i/4) % wid);
        y = ~~((i/4) / wid);
        
        // If we're trying to resize the image...
        if (resize) {
            // Map the pixel's position from the current resolution to the old resolution
            xy = _mapPixel(x,y, wid,hei, owid,ohei);
            x = round(xy[0]*100)/100; 
            y = round(xy[1]*100)/100;
            
            // If the mapped pixel isn't between one of the original pixels (i.e. is an integer), then just copy the old pixel
            if ((x % 1 === 0) && (y % 1 === 0)) {
                // ii is the index for the old image
                ii = ~~(y*owid + x)*4;
                _p[i]   = img.imageData.data[ii];
                _p[i+1] = img.imageData.data[ii+1];
                _p[i+2] = img.imageData.data[ii+2];
                _p[i+3] = img.imageData.data[ii+3];
                
                continue;
            }
        }
        // Map x and y to the original resolution (i.e. if this is the second or greater time increasing its resolution)
        xy = _mapPixel(x,y, owid,ohei, ores,ores);
        x=xy[0];y=xy[1];
        
        col = render(x,y, ores,ores);
        
        _p[i  ] = col[0];
        _p[i+1] = col[1];
        _p[i+2] = col[2];
        _p[i+3] = 255;
        
        // Exit if it's been taking too long
        if (_millis() - startMillis > mlt) {
            _lastIndex = i;
            break;
        }
    }
    
    // If the loop has finished and didn't time out
    if (i >= plen) {
        // Restart the _lastIndex counter
        _lastIndex = 0;
    }
    
    // Update the image's pixel data
    newImg.updatePixels();
    return newImg;
    
};

/* Draw the Animation */
// drawFunction replaces the main draw() function so because it get called only once per frame while the image is loading
var drawFunction;

if (Program.frames === undefined) { Program.frames = []; }
if (Program.loadingAnimation === undefined) { Program.loadingAnimation = true; }
if (Program.redrawing === undefined) { Program.redrawing = false; }

var drawAnimation = function () {
    if (Program.loadingAnimation) {
        
        // If it's time to render a new frame
        if (_lastIndex === 0) {
            // call the draw function
            drawFunction();
            
            // if the current frame has never been rendered before, set _lastImg to undefined
            if (!Program.redrawing) { _lastImg = undefined; }
            // otherwise, set _lastImg to the currentFrame
            else { _lastImg = Program.frames[Program.loadingFrame]; }
        }
        
        // Render the frame
        _lastImg = drawImage(Program.res,Program.res, _lastImg);
        
        // If the frame is finished rendering, push it to the frames array
        if (_lastIndex === 0) {
            Program.frames[Program.loadingFrame] = _lastImg;
            
            Program.loadingFrame ++;
            if (Program.loadingFrame >= numFrames) { 
                // If the animation is done
                if (Program.res >= maxRes) { Program.loadingAnimation = false; }
                else { Program.loadingFrame = 0; Program.redrawing = true; Program.res *= 2; }
            }
        }
    }
    
    if (Program.currentFrame < Program.frames.length) { // this should happen whenever one or more frames are rendered
        image(Program.frames[Program.currentFrame], 0,0, width,height);
    }
    
    // Increment the currentFrame tracker
    Program.currentFrame ++;
    if (Program.currentFrame >= Program.frames.length) { Program.currentFrame = 0; }
};

drawFunction = function () {
    var lf = Program.loadingFrame;
    shapes[0].rotate(lf/40,lf/20);
};


frameRate(30);
draw = function() {
    drawAnimation();
    if (Program.loadingAnimation) { text("Loading Frame "+Program.loadingFrame+" / "+numFrames+" at res = "+Program.res, 10,20); }
    else { text("Loading Complete", 10,20); }
    text("Frame Rate: "+round(this.__frameRate*10)/10,10,40);
};
