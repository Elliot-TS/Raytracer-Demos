# Raytracer-Demos
Demo Ray marchers, Ray tracers, and Path tracers that I've made in order to learn about rendering

## Textured Raycaster
https://www.khanacademy.org/computer-programming/raycaster-3d/6164665312018432

![Textured Raycaster Image](https://github.com/Elliot-TS/Raytracer-Demos/blob/main/Textured%20Raycaster.png)

Raycasting is a technique for using a 2D map to create a fake-3D environment by performing ray casting in 2D to display what a 2D character would see in the map, and then each point on the 2D view is extended vertically according to how far away the wall is.  This creates an easy 3D effect, but it is limited in that the environment can only contain walls laid out on a 2D grid, and the player cannot look up or down.

## Voxel Raycaster
https://www.khanacademy.org/computer-programming/voxel-engine/5457174184394752

![Voxel Raycaster Image](https://github.com/Elliot-TS/Raytracer-Demos/blob/main/Voxel%20Raycaster.png)

After learning about raycasting, I wondered if it was possible to extend the same algorithm to a truely 3D voxel map.  Turns out, you can!

## Gold Ore

https://www.khanacademy.org/computer-programming/gold-ore/6112506425786368

![Gold Ore Image](https://github.com/Elliot-TS/Raytracer-Demos/blob/main/Gold%20Ore%20Demo.png)

Here I am experimenting with different kinds of BRDFs to create the gold and stone materials.  A BRDF describes how light interacts with a particular material, such as how much the light reflects and how much the light scatters in every direction.

## Ray Marcher Water Bottle

https://www.shadertoy.com/view/wsByWD

![Ray Marcher Image](https://github.com/Elliot-TS/Raytracer-Demos/blob/main/Ray%20Marcher%20Demo.png)

Ray marching is an algorithm for finding where a ray emitting from the camera intersects with one of the objects in the scene.  In ray marching, the objects are mathematically described by a function that tells you how far away any point in 3D space is from the surface of shape.  Complex shapes are often built up from smaller shapes by combining the distance functions for simpler shapes and by folding space to create many shapes out of one.  Here I created a model of my water bottle, complete with all it's characteristic bumps and dents!

## Path Tracer

https://www.khanacademy.org/computer-programming/ray-tracer/5975635851100160

![Path Tracer Demo](https://github.com/Elliot-TS/Raytracer-Demos/blob/main/Path%20Tracing%20Demo.png)

Here I implement the path tracing algorithm to track light rays as they bounce around the scnee.  Even with this extremely simple version of the algorithm, I'm able to simulate soft shadows, bounce lighting, color bleeding, and caustics.
