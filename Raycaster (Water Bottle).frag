// Taken from https://www.shadertoy.com/view/wsByWD
// See live demo there
#define MAX_STEPS 1000
#define MAX_DIST 1000.
#define SURF_DIST .001


// noise (from https://www.shadertoy.com/view/3d23z1)
float N21(vec2 p) {
    return fract(sin(p.x*100.+p.y*6574.)*5647.);
}

float SmoothNoise(vec2 uv) {
    vec2 lv = fract(uv);
    vec2 id = floor(uv);
    
    lv = lv*lv*(3.-2.*lv);
    
    float bl = N21(id);
    float br = N21(id+vec2(1,0));
    float b = mix(bl, br, lv.x);
    
    float tl = N21(id+vec2(0,1));
    float tr = N21(id+vec2(1,1));
    float t = mix(tl, tr, lv.x);
    
    return mix(b, t, lv.y);
}

float SmoothNoise2(vec2 uv, int octaves) {
    float c = SmoothNoise(uv*2.);
    
    float sca;
    float mag = 1.;
    for (int i = 1; i < 3; i++) {
    	sca = pow(2.,float(i+1));
        mag += 1./sca;
        c += SmoothNoise(uv*sca) / sca;
    }
    c /= mag;
    
    return c;
}



mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5*(b-a)/k, 0., 1.);
    return mix(b,a,h) - k*h*(1.0-h);
}

// Materials
struct MATE {
	vec3 col;
    vec3 specCol; // vec3(1) to reflect light color, col to reflect object color
    float diff;
    float spec;
};
MATE mate1;
MATE mate2;

// Shapes
int HIT_OBJECT; // keeps track of which object was hit
float sdSphere (vec3 p, float r) {
	return length(p)-r;
}
float sdCapsule (vec3 p, vec3 a, vec3 b, float radius) {
	vec3 ab = b-a;
    vec3 ap = p-a;
    
    float t = dot(ab, ap) / dot(ab, ab);
    t = clamp(t, 0., 1.);
    
    vec3 c = a + t*ab;
    float d = length(p-c) - radius;
    return d;
}
float sdTorus (vec3 p, vec2 r) {
	float x = length(p.xz) - r.x;
    return length(vec2(x, p.y)) - r.y;
}
float dBox(vec3 p, vec3 s) {
    p = abs(p)-s;
	return length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);
}
float sdCylinder (vec3 p, vec3 a, vec3 b, float radius) {
	vec3 ab = b-a;
    vec3 ap = p-a;
    
    float t = dot(ab, ap) / dot(ab, ab);
    
    vec3 c = a + t*ab;
    float x = length(p-c) - radius;
    float y = (abs(t-.5)-.5) * length(ab);
    float e = length(max(vec2(x,y), 0.));
    float i = min(max(x,y), 0.);
    return e+i;
}
float sdPlane (vec3 p, vec3 normal) {
	return dot(p, normalize(normal));
}

// Boolean Opperations
float boolSubtract(float d1, float d2) {
	return max(-d2, d1);
}
float boolIntersect(float d1, float d2) {
	return max(d1, d2);
}
float boolUnion(float d1, float d2, float smoothness) {
	return smin(d1, d2, smoothness);
}
float boolMix(float d1, float d2, float amount) {
	return mix(d1, d2, amount);
}

// Render
float GetDist(vec3 p) {
    vec2 t = -vec2(-6,-4);
    float pd = 1e20;//dot(p, normalize(vec3(0,1,0)))+1.;
    
    // Bottle
    vec3 cp = p;
    
    float ang = atan(cp.x,cp.z);
    float dent = 5.*cos(ang*5.) * smoothstep(0.1,0.03,cp.y)*cos(cp.y*20.) * smoothstep(-0.3,0.03, cp.y) * (sin(ang*cos(ang*3.))-1.)*0.01;
    cp.x -= (dent) * cos(ang);
    cp.z += (dent) * sin(ang);
    
	float r = .2 + (sin(cp.y*3.14+0.5)*0.5+0.5)*0.04;
    float roundness = (1.3-cp.y)*0.02 + 0.05;
    float bd = sdCylinder(cp, vec3(0), vec3(0,1,0), r-roundness)-roundness;
    
    // Cap
    cp = p;
    cp.y -= 1.;
    cp.y *= (1.-cp.x)*0.2 + 0.8;
    cp.y += 1.;
    r = 0.211 + smoothstep(1., 1.2, cp.y)*.01;
    roundness = 0.01;
    float cd = sdCylinder(cp, vec3(0,1,0), vec3(0,1.2,0), r-roundness)-roundness;
    cd *= .5;
    
    // Cap Inside
    cp = p;
    cp.y -= 1.2;
    
    // sphere
    r = 0.2;
    float sd = sdSphere(cp, 0.21);
    
    // plane
    cp = p;
    cp.y += cp.x*0.03;
    float cpd = dot(cp, vec3(0,-1,0)) + 1.175;
    sd = smin(sd, cpd, -0.005);
    
    cd = smin(cd, -sd, -0.01);
    
    // mouth piece
    cp = p;
    cp.y -= 1.17;
    cp.y *= 0.5;
    cp.z *= cp.x*4.;
    cp.x -= .175;
    sd = sdSphere(cp, 0.03);
    
    cd = smin(cd, -sd, -0.01);
    
    // button
    cp = p;
    cp.y -= 1.05;
    
    cp.x += .23;
    cp.yz *= 1. + clamp(pow(0.04-cp.x, 4.),0.,1.)*10000.*vec2(1.,2.);
    roundness = clamp(0.04-cp.x,0.01,0.015);
    float bnd = dBox(cp, vec3(.03,.15,.1)-roundness)-roundness;
    
    bnd = smin(-bd+0.03, bnd, -0.01);
    
    bnd /= 10.;
    cd = smin(cd, bnd, 0.02);
    
    float d = pd;
    if (bd < cd) { HIT_OBJECT = 0; d = min(d,bd); }
    else { HIT_OBJECT = 1; d = min(d,cd); }
    return d;
}

vec3 GetNormal (vec3 p) {
	float d = GetDist(p);
    vec2 e = vec2(.001, 0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}

float RayMarch (vec3 ro, vec3 rd) {
	float dO = 0.;
    for (int i = 0; i < MAX_STEPS; i ++) {
    	vec3 p = ro + dO*rd;
        float dS = GetDist(p);
        dO += dS;
        if (dS < SURF_DIST || abs(dO) > MAX_DIST) { break; }
    }
    return dO;
}

struct LIGHT {
	vec3 pos;
    vec3 col;
};

vec3 GetLight (vec3 p, vec3 camPos, MATE mate, LIGHT light) {
    vec3 lightPos = light.pos;
    vec3 lightCol = light.col;
    
    vec3 l = normalize(lightPos - p);
    vec3 n = GetNormal(p);
    vec2 rl = reflect(l.xz, n.xz);
    
    float diff = clamp(dot(n, l)*.5+.5, 0., 1.);
    float spec = clamp(dot(normalize(p.xz-camPos.xz), rl)*.5+.5, 0., 1.)*1.3;
    spec = pow(spec, 8.);
    float d = RayMarch(p+n*SURF_DIST*2., l);
   	if (/*p.y < SURF_DIST && */d < length(lightPos-p)) {diff *= 0.2; spec *= 0.2; }
    
	return ((diff*mate.diff+0.2)*mate.col*lightCol + spec*mate.specCol*mate.spec*lightCol);
}

vec3 GetRay(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = p+f*z,
        i = c + uv.x*r + uv.y*u,
        d = normalize(i-p);
    return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from -1 to 1)
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
	vec2 m = iMouse.xy/iResolution.xy - vec2(0.5,0);
    vec3 col = vec3(0);
    
    vec3 ro = vec3(0.5, 2, -1);
    ro.yz *= Rot(-m.y*1.5);
    ro.xz *= Rot(-m.x*6.2831);
    
    vec3 rd = GetRay(uv, ro, vec3(-0.,0.75,0), 1.3); 
    
    
    mate1.col = vec3(0.7);
    mate1.specCol = vec3(1);
    mate1.diff = 1.;
    mate1.spec = 0.5;
    
    mate2.col = vec3(0.3);
    mate2.specCol = vec3(1);
    mate2.diff = 1.;
    mate2.spec = 0.01;
    
    float d = RayMarch(ro, rd);
    
    MATE hitMate;
    if (HIT_OBJECT == 0) { hitMate = mate1; }
    else { hitMate = mate2; }
    
    if (d < MAX_DIST) {
        vec3 p = ro + rd * d;
        
        LIGHT light1;
        light1.pos = vec3(3,4.,-2);
        light1.col = vec3(1,0.9,0.9);
        
        LIGHT light2;
        light2.pos = vec3(-2,2, -1);
        light2.col = vec3(0.3,0.5,0.5);
        
        LIGHT light3;
        light3.pos = vec3(0,-0.5,2);
        light3.col = vec3(0.2,0.2,0.2);
        
        col = GetLight(p, ro, hitMate, light1);
        col += GetLight(p, ro, hitMate, light2);
        col += GetLight(p, ro, hitMate, light2);
        col /= 3.;
    }
    // Output to screen
    fragColor = vec4(col,1.0);
}
