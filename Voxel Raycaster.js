/*****************************************
* Taken from https://www.khanacademy.org/computer-programming/voxel-engine/5457174184394752
* See there for live demo
*****************************************/

/**
 * @CREDIT:
 * 3D line walker algorithm adapted from http://www.redblobgames.com/grids/line-drawing.html
 * Raycaster algorithm baced off of http://lodev.org/cgtutor/raycasting.html
**/
// Debuggin function
var pr = function (data) {
    _clearLogs ();
    println (data);
};

// Creates a 3D world map[z][y][x]
var worldMap = [];
for (var i = 0; i < 200; i ++) {
    worldMap.push([]);
    for (var j = 0; j < 20; j ++) {
        worldMap[i].push([]);
        for (var k = 0; k < 200; k ++) {
            var c1 = i===0||i===19||j===0||j===19||k===0||k===19;
            var c2 = (i===9||i===10||i===11)&&(j===9||j===10||j===11)&&(k===9||k===10||k===11);
            var c3 = (j===19);
            var c4 = j > 19-floor(noise(i*0.1,k*0.1)*15+5);
            if (c4) {
                if (j < 9) {
                    worldMap[i][j].push(floor(random(2))+1);
                }
                else {
                    worldMap[i][j].push(3);
                }
            }
            else {
                worldMap[i][j].push(0);
            }
        }
    }
}

var colorScheme = {
    1 : [68, 163, 49],
    2 : [104, 161, 50],
    3 : [83, 127, 214],
};

// A function for rotateing a point.  X and y don't have to be x and y coordinates.  They can be any pair of coordinates like y,z or x,z depending on what axis you want to rotate on
var rotate3D = function (x,y,angle,ox,oy) {
    ox = ox || 0;
    oy = oy || 0;
    
    var oldx = x;
    x = cos(angle) * (x-ox) - sin(angle) * (y-oy) + ox;
    y = sin(angle) * (oldx-ox) + cos(angle) * (y-oy) + oy;
    return [x,y];
};

// Defines the camera
var Camera = function (config) {
    config = config || {};
    
    // Position and Direction
    this.pos = config.position || new PVector (0,0,0);
    this.dir = new PVector (0,0,1);
    this.dir.normalize ();
    this.odir = this.dir.get();
    
    // Field of View
    this.xFov = 0.66;
    this.yFov = 0.66;
    
    // Screen Reselution
    var d = 1;
    this.res = [width/d,height/d];
    
    // Camera Plane Vectors
    this.u = new PVector (1,0,0);
    this.u.normalize();
    this.u.mult(this.xFov);
    this.v = new PVector (0,1,0);
    this.v.normalize();
    this.v.mult(this.yFov);
    
    this.ou = this.u.get();
    this.ov = this.v.get();
    
    // Rotation
    this.rotAngle = [0,0,0];
};
Camera.prototype = {
    draw : function () {
        stroke(0);
        strokeWeight (5);
        point(this.pos.x,this.pos.y);
        
        stroke (2);
        line (this.pos.x,this.pos.y,this.pos.x+(this.dir.x)*50,this.pos.y+(this.dir.y)*50);
        stroke (2);
        line (this.pos.x+(this.dir.x-this.u.x)*50,this.pos.y+(this.dir.y-this.u.y)*50,this.pos.x+(this.dir.x+this.u.x)*50,this.pos.y+(this.dir.y+this.u.y)*50);
        line (this.pos.x+(this.dir.x-this.v.x)*50,this.pos.y+(this.dir.y-this.v.y)*50,this.pos.x+(this.dir.x+this.v.x)*50,this.pos.y+(this.dir.y+this.v.y)*50);
        
        var px = frameCount%this.res[0];
        var py = floor(frameCount/this.res[0])%this.res[1];
        
        var ray = this.getRay(px,py);
        stroke (1);
        line (this.pos.x,this.pos.y,this.pos.x+(this.dir.x+ray.x)*50,this.pos.y+(this.dir.y+ray.y)*50);
    }, // Drawing a 2D camera for debugging purposes
    render : function () {
        var ray;
        
        // Prepares the imageData.data
        loadPixels ();
        var p = imageData.data;
        var plen = p.length;
        var i = 0, ii = 0, index; // indeces to keep track of where in the imageData.data array we are
        var px,py; // pixelX and pixelY coordinates represent which pixels we are looping through
        var wid=this.res[0],hei=this.res[1],w=width,h=height; // The width and height of the rectangle we are looping through and drawing on, and of the canvas
        var scaX = w/wid, scaY = h/hei; // Unneeded scale values to map the px and py coordinates as if the reselution of the screen were the same as the canvas (the corner of the screen is at 400,400 even if it is only 10 pixel square)
        
        var ri; // rayIntersection
        var col = []; // Color
        var world = worldMap; // WolrdMap allias
        
        // Loops through all the pixels in the rect we want to draw in
        while (i < wid*hei) {
            px = ii % wid; // finds the pixel's x coordinate
            // skips the rest of each row of pixels after we loop through the entire width that we want
            if (px >= wid-1) {
                ii += w-wid;
            }
            py = ~~(i/wid); // finds the pixel's y coordinate
            
            //px *= scaX; py *= scaY; // commented out
            
            ray = this.getRay(px,py, px === 100 && py === 100 && frameCount === 10);
            
            ri = this.getRayIntersection (ray,world, px === 100 && py === 100 && frameCount === 10); // ri = [collitionX,collitionY,collotionZ,sideOfTheBoxThatTheRayHit]
            
            // if the ray hit something
            if (ri[0] !== false) {
                col = this.getPointColor (ri, world); // col is the color of the point at ri
                index = ii * 4; // index in the imageData.data loop we are at
                // Colors the screen
                p[index|0] = col[0];
                p[index|1] = col[1];
                p[index|2] = col[2];
            }
            
            // Incriments i and ii
            i ++;
            ii ++;
        }
        updatePixels (); // Uploads the imageData.data array to the pixels on the screen
        
        // Old version of all this
        /*
        var wid = this.res[0], hei = this.res[1];
        var res = 20;
        
        var ri,col=[];
        var world = worldMap;
        noStroke ();
        for (var i = 0; i < width; i += res) {
            for (var j = 0; j < height; j += res) {
                ri = this.getRayIntersection (i,j,world);
                if (ri[0] !== false) {
                    col = this.getPointColor (ri, world);
                    fill (col[0],col[1],col[2]);
                    rect (i,j,res,res);
                }
            }
        }*/
        
        return get(0,0,wid,hei); // Returns a picture of the part of the canvas that we colored in
    }, // Renders the scene
    rotateZ : function (angle) {
        this.rotAngle[0] += angle;
        angle = this.rotAngle[0];
        var pos = rotate3D(this.dir.x,this.dir.y,angle);
        this.dir.x = pos[0];
        this.dir.y = pos[1];
        var pos = rotate3D(this.u.x,this.u.y,angle);
        this.u.x = pos[0];
        this.u.y = pos[1];
        var pos = rotate3D(this.v.x,this.v.y,angle);
        this.v.x = pos[0];
        this.v.y = pos[1];
    }, // Rotates the camera
    rotateY : function (angle) {
        this.rotAngle[1] += angle;
        angle = this.rotAngle[1];
        var pos = rotate3D(this.dir.x,this.dir.z,angle);
        this.dir.x = pos[0];
        this.dir.z = pos[1];
        var pos = rotate3D(this.u.x,this.u.z,angle);
        this.u.x = pos[0];
        this.u.z = pos[1];
        var pos = rotate3D(this.v.x,this.v.z,angle);
        this.v.x = pos[0];
        this.v.z = pos[1];
    },
    rotateX : function (angle) {
        this.rotAngle[2] += angle;
        angle = this.rotAngle[2];
        var pos = rotate3D(this.dir.y,this.dir.z,angle);
        this.dir.y = pos[0];
        this.dir.z = pos[1];
        var pos = rotate3D(this.u.y,this.u.z,angle);
        this.u.y = pos[0];
        this.u.z = pos[1];
        var pos = rotate3D(this.v.y,this.v.z,angle);
        this.v.y = pos[0];
        this.v.z = pos[1];
    },
    rotate : function (az,ay,ax) {
        this.dir = this.odir.get();
        this.u = this.ou.get();
        this.v = this.ov.get();
        this.rotateX (ax);
        this.rotateY (ay);
        this.rotateZ (az);
    },
    getRay : function (px,py, condition) {
        // U and V are two parallel vectors that are parallel to the viewing direction.  They define the viewing plane.  The x and y coordinates of the ray from the camera through px and py on the viewing plane is found by adding x (px along vector U) and y (py along vecor V)
        var x = {
            x:lerp(-this.u.x,this.u.x,px/this.res[0]),
            y:lerp(-this.u.y,this.u.y,px/this.res[0]),
            z:lerp(-this.u.z,this.u.z,px/this.res[0])
        };
        var y = {
            x:lerp(-this.v.x,this.v.x,py/this.res[1]),
            y:lerp(-this.v.y,this.v.y,py/this.res[1]),
            z:lerp(-this.v.z,this.v.z,py/this.res[1])
        };
        var ray = {
            x:x.x+y.x,
            y:x.y+y.y,
            z:x.z+y.z};
        
        if (condition) {
            println(x.x+" "+x.y+" "+x.z);
        }
        return ray;
    }, // Sends a ray from the camera through px and py on the viewing plane
    getRayIntersection : function (ray,world, condition) {
    
        // defines the start and end positions of the ray
        var x1 = this.pos.x,
            y1 = this.pos.y-1,
            z1 = this.pos.z;
        var x2 = ray.x+this.dir.x+this.pos.x,
            y2 = ray.y+this.dir.y+y1,
            z2 = ray.z+this.dir.z+this.pos.z;
            
        x1 = floor(x1); y1 = floor(y1); z1 = floor(z1); // Makes sure that the ray always starts (and thus ends) on a whole integer
        
        // sets up an intersection variable
        var intersection = false;
        
        // x, y, and z distances and whether to step forward or backward in each direction
        var dx = x2-x1, sx = dx > 0 ? 1 : -1;
        var dy = y2-y1, sy = dy > 0 ? 1 : -1;
        var dz = z2-z1, sz = dz > 0 ? 1 : -1;
        
        // nextDistanceX, nextDistanceY, and nextDistanceZ
        var ndx,ndy,ndz;
        
        // the x,y,and z distances are made positive
        dx = Math.abs(dx);
        dy = Math.abs(dy);
        dz = Math.abs(dz);
        
        // side variable (1 = top, 1.5 = front, 2 = side)
        var side = 1;
        
        var thing = false; // some thing for debugging
        if (dx < 0.2 && dy < 0.2) {
            thing = true;
        }
        var count = 0; // also for debugging
        
        // loops through each "pixel" (integer) on the ray
        var ix = 0, iy = 0, iz = 0; // for knowing which way to go next
        while (!intersection) {
            count ++;
            // defines the nextDistances
            ndx = (0.5+ix)/dx;
            ndy = (0.5+iy)/dy;
            ndz = (iz+0.5)/dz;
            
            // if the nextDistanceX is the smallest distance
            if (ndx < ndy && ndx < ndz) {
                // next step is horizontal
                x1 += sx; // moves the "start" of the ray in the x direction
                ix++; // adds the ix variable for finding what step is next
                side = 2+(sx-1)/3; // if there is a collision on this step, it will be on the x side of the box since an x step was last
            } 
            // if the nextDistanceY is the smallest distance
            else if (ndy < ndz) {
                // next step is vertical
                y1 += sy; // etc.
                iy++;
                side = 1-(sy-1)/3;
            }
            else {
                z1 += sz;
                iz += 1;
                side = 1.5+(sz-1)/3;
            }
            
            // If our point alogn the ray is outside of the world
            if (x1 < 0 || y1 < 0 || z1 < 0 || z1 >= world.length || y1 >= world[0].length || x1 >= world[0][0].length) {
                break; // let's bail
            }
            // otherwise
            else {
                // there is an intersection if the value of worldMap at index [zAlongTheRay][yAlongTheRay][xAlongTheRay] is a positive number grater than 0
                intersection = world[z1][y1][x1] > 0;
                // if there is an intersection, that's it.  Otherwise, continue on with the loop
            }
        }
        
        
        // If there was an intersection (and the ray didn't just go off the world)
        if (intersection) {
            return [x1,y1,z1,side]; // then return the x,y, and z coordintate of the box it intersected with as well as the side that it hit
        }
        // If it went out of the world
        else {
            return [false,false,false,false]; // return a list of a bunch of false's just to make our point clear
        }
    }, // Finds where the line intersects something
    getPointColor : function (pt, world) {
        // This is where the real math comes it with the rendering equation.  But instead I cheat and just return a red color divided by the side of the box that the ray hit
        var c = colorScheme[worldMap[pt[2]][pt[1]][pt[0]]];
        return [c[0]/pt[3],c[1]/pt[3],c[2]/pt[3]];
    }, // Gets the color of a point in the world
};

var keys = {};
// Define a new camera
var cam = new Camera ({
    position : new PVector (10,8,10),
});
cam.rotate (0,0,0);
draw = function() {
    background (255); // color everything white
    //_clearLogs ();
    image (cam.render (),0,0,400,400); // and then draw over it with the image returned by the camera's render function
    
    if (mouseIsPressed) {
        cam.rotate (0,-(pmouseX-mouseX)*Math.PI/10,-(pmouseY-mouseY)*Math.PI/10);
    }
    
};
