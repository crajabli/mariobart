import {FirstPersonCamera} from './first-person-camera';
import {Matrix4} from           './matrix';
import {Quaternion} from        './quaternion';
import {ShaderProgram} from     './shader-program';
import {Vector3} from           './vector';
import {VertexArray} from       './vertex-array';
import {VertexAttributes} from  './vertex-attributes';

import * as Cannon from 'cannon-es';
import * as gltf from './gltf';

let canvas: HTMLCanvasElement;
let cameraLeft: FirstPersonCamera;
let cameraRight: FirstPersonCamera;
let clipFromEye: Matrix4;
let shader: ShaderProgram;
let flatShader: ShaderProgram;
let vao: VertexArray;
let backgroundColor = new Vector3(0.5, 0.5, 0.8);
// Yoshi Controls
let yosh_turn = 0;
let yosh_move = 0;
let yosh_brake = 0;
// Toad Controls
let toad_turn = 0;
let toad_move = 0;
let toad_brake = 0;

let lastMillis = 0;
let terrain: Terrain;
let wheelVao: VertexArray;

let lightPositionWorld: Vector3;
let lightVao: VertexArray;

// Yoshi Model
let yoshiArray: VertexArray[] = [];
// Toad Model
let toadArray: VertexArray[] = [];

let toadTextureMap: {[id: number] : number; } = {};
let yoshiTextureMap: {[id: number] : number; } = {};
let treeTextureMap: {[id: number] : number; } = {};
let barnTextureMap: {[id: number] : number; } = {};
let windmillTextureMap: {[id: number] : number; } = {};
let finishTextureMap: {[id: number] : number; } = {};
let cowTextureMap: {[id: number] : number; } = {};




// let toadAlbedoMap: {[id: number] : Vector3; } = {}

// Scenery Models
let treeArray: VertexArray[] = [];
let barnArray: VertexArray[] = [];
let windmillArray: VertexArray[] = [];
let finishArray: VertexArray[] = [];
let cowArray: VertexArray[] = [];
let cowChassisArray: Cannon.Body[] = [];

// Cannon
let physics: Cannon.World;
let terrainBody: Cannon.Body;
let vehicleToad: Cannon.RaycastVehicle;
let vehicleYoshi: Cannon.RaycastVehicle;
let chassisToad: Cannon.Body;
let chassisYoshi: Cannon.Body;


import environmentModels from './cow_positions.json';

function renderEnvironment() {
  const treePosition = Matrix4.translate(820, 5, -260);
  // console.log(chassisToad.position);
  shader.setUniformMatrix4fv('worldFromModel', treePosition.toFloats());
  for (let i = 0; i < treeArray.length; i++) {
    shader.setUniform1i('crateTexture', 30);
    // shader.setUniform3f('albedo', 1, 0, 0);
    if (treeTextureMap[i] !== undefined)  {
      shader.setUniform1i('crateTexture', treeTextureMap[i]);
    }
    treeArray[i].bind();
    treeArray[i].drawIndexed(gl.TRIANGLES);
    treeArray[i].unbind();
  }

  const barnPosition = Matrix4.translate(720, 9.5, -270);
  shader.setUniformMatrix4fv('worldFromModel', barnPosition.toFloats());
  for (let i = 0; i < barnArray.length; i++) {
    shader.setUniform1i('crateTexture', 30);
    // shader.setUniform3f('albedo', 1, 0, 0);
    if (barnTextureMap[i] !== undefined)  {
      shader.setUniform1i('crateTexture', barnTextureMap[i]);
    }
    barnArray[i].bind();
    barnArray[i].drawIndexed(gl.TRIANGLES);
    barnArray[i].unbind();
  }

  const windMillPosition = Matrix4.translate(720, 10, -240);
  // console.log(windmillArray.length);
  shader.setUniformMatrix4fv('worldFromModel', windMillPosition.toFloats());
  for (let i = 0; i < windmillArray.length; i++) {
    shader.setUniform1i('crateTexture', 30);
    // shader.setUniform3f('albedo', 1, 0, 0);
    if (windmillTextureMap[i] !== undefined)  {
      shader.setUniform1i('crateTexture', windmillTextureMap[i]);
    }
    windmillArray[i].bind();
    windmillArray[i].drawIndexed(gl.TRIANGLES);
    windmillArray[i].unbind();
  }

  const finishPosition = Matrix4.translate(770, 10, -300);
  // console.log(finishArray.length)

  shader.setUniformMatrix4fv('worldFromModel', finishPosition.toFloats());
  for (let i = 0; i < finishArray.length; i++) {
    shader.setUniform1i('crateTexture', 30);
    // shader.setUniform3f('albedo', 1, 0, 0);
    if (finishTextureMap[i] !== undefined)  {
      shader.setUniform1i('crateTexture', finishTextureMap[i]);
    }
    finishArray[i].bind();
    finishArray[i].drawIndexed(gl.TRIANGLES);
    finishArray[i].unbind();
  }


  for (let cow of environmentModels.cows) {
    let cowPosition = Matrix4.translate(cow.x, cow.y, cow.z);
    shader.setUniformMatrix4fv('worldFromModel', cowPosition.toFloats());
    for (let i = 0; i < cowArray.length; i++) {
      shader.setUniform1i('crateTexture', 30);
      // shader.setUniform3f('albedo', 1, 0, 0);
      if (cowTextureMap[i] !== undefined)  {
        shader.setUniform1i('crateTexture', cowTextureMap[i]);
      }
      cowArray[i].bind();
      cowArray[i].drawIndexed(gl.TRIANGLES);
      cowArray[i].unbind();
    }
  }

}

async function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(backgroundColor.x, backgroundColor.y, backgroundColor.z, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  shader.setUniform1f('crateTexture', 30);

  if (chassisToad.position.almostEquals(chassisYoshi.position, 7)) {
    // chassisToad.applyForce(new Cannon.Vec3(100, 0, 100), chassisToad.position);
    // chassisYoshi.applyForce(new Cannon.Vec3(100, 0, 100), chassisYoshi.position);
    const thwomp: HTMLAudioElement = document.getElementById("collide") as HTMLAudioElement;
    thwomp.volume = 0.1;
    thwomp.play();
  }

  for (let cow of cowChassisArray) {
    if (chassisToad.position.almostEquals(cow.position, 7)) {
      chassisToad.applyForce(new Cannon.Vec3(0, 0, 100), chassisToad.position);
      const thwomp: HTMLAudioElement = document.getElementById("anvil") as HTMLAudioElement;
      thwomp.volume = 0.1;
      thwomp.play();
    }
    if (chassisYoshi.position.almostEquals(cow.position, 7)) {
      chassisYoshi.applyForce(new Cannon.Vec3(0, 0, 100), chassisYoshi.position);
      const thwomp: HTMLAudioElement = document.getElementById("anvil") as HTMLAudioElement;
      thwomp.volume = 0.1;
      thwomp.play();
    }
  }

  //                  T O A D
  gl.viewport(0, 0, canvas.width / 2, canvas.height);



  // Convert to eyeSpace using eyeFromWorld
  let lightPositionEye = (cameraLeft.eyeFromWorld.multiplyVector3(lightPositionWorld, 1)); //ahhhhhhhhhhhhhhhhhhhhhhh


  shader.bind();
  shader.setUniformMatrix4fv('clipFromEye', clipFromEye.toFloats());
  shader.setUniformMatrix4fv('eyeFromWorld', cameraLeft.eyeFromWorld.toFloats());
  shader.setUniformMatrix4fv('worldFromModel', Matrix4.identity().toFloats());
  shader.setUniform3f('lightPositionWorld', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);

  shader.setUniform3f('diffuseColor', 0.75, 0.75, 0.75);
  shader.setUniform1f('shininess', 20);
  shader.setUniform3f('specularColor', 0.2, 0.4, 0.1);
  shader.setUniform1f('ambientFactor', 0.4);

  renderEnvironment();

  shader.setUniformMatrix4fv('worldFromModel', Matrix4.identity().toFloats());



  // shader.setUniform3f('albedo', 0, 0.5, 0);

  // yoshiArray[0].bind();
  // yoshiArray[0].drawIndexed(gl.TRIANGLES);
  // yoshiArray[0].unbind();
  shader.setUniform1i('crateTexture', 25);
  yoshiArray[0].bind();
  yoshiArray[0].drawIndexed(gl.TRIANGLES);
  yoshiArray[0].unbind();
  shader.setUniform1i('crateTexture', 30);


  // shader.setUniform3f('albedo', 1, 0, 0);
  
  {
    const translater = Matrix4.translate(chassisToad.position.x, chassisToad.position.y, chassisToad.position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(chassisToad.quaternion.x, chassisToad.quaternion.y, chassisToad.quaternion.z, chassisToad.quaternion.w));
    const transform = translater.multiplyMatrix(rotater);
    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());


    for (let i = 0; i < toadArray.length; i++) {

      shader.setUniform1i('crateTexture', 30);
      // shader.setUniform3f('albedo', 1, 0, 0);
      if (toadTextureMap[i] !== undefined)  {
        shader.setUniform1i('crateTexture', toadTextureMap[i]);
      }
      // if (toadAlbedoMap[i] !== undefined) {
      //   shader.setUniform3f('albedo', toadAlbedoMap[i].x, toadAlbedoMap[i].y, toadAlbedoMap[i].z);
      // }
      toadArray[i].bind();
      toadArray[i].drawIndexed(gl.TRIANGLES);
      toadArray[i].unbind();
    }
  }
  // shader.setUniform1f('crateTexture', 5);

  
  for (let i = 0; i < 4; ++i) {
    const {position, quaternion} = vehicleToad.wheelInfos[i].worldTransform;
    const translater = Matrix4.translate(position.x, position.y, position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    const transform = translater.multiplyMatrix(rotater);
    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
    // if (i > 2) {
    // wheelVao.bind();
    // wheelVao.drawIndexed(gl.TRIANGLES);
    // wheelVao.unbind();
    // }

  }  

  {
    const translater = Matrix4.translate(chassisYoshi.position.x, chassisYoshi.position.y, chassisYoshi.position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(chassisYoshi.quaternion.x, chassisYoshi.quaternion.y, chassisYoshi.quaternion.z, chassisYoshi.quaternion.w));
    const transform = translater.multiplyMatrix(rotater);

    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
    // shader.setUniform1i('crateTexture', 1);

    // shader.setUniform1i('crateTexture', 0);
    // yoshiArray[0].bind();
    // yoshiArray[0].drawIndexed(gl.TRIANGLES);
    // yoshiArray[0].unbind();
    // shader.setUniform1i('crateTexture', 10);

    for (let i = 1; i < yoshiArray.length; i++) {
      shader.setUniform1i('crateTexture', 30);
      // shader.setUniform3f('albedo', 1, 0, 0);
      if (yoshiTextureMap[i] !== undefined)  {
        shader.setUniform1i('crateTexture', yoshiTextureMap[i]);
      }
      yoshiArray[i].bind();
      yoshiArray[i].drawIndexed(gl.TRIANGLES);
      yoshiArray[i].unbind();
    }

  }
  
  for (let i = 0; i < 4; ++i) {
    const {position, quaternion} = vehicleYoshi.wheelInfos[i].worldTransform;
    const translater = Matrix4.translate(position.x, position.y, position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    const transform = translater.multiplyMatrix(rotater);
    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
    wheelVao.bind();
    wheelVao.drawIndexed(gl.TRIANGLES);
    wheelVao.unbind();
  } 
  shader.unbind();

  //            Y O S H I 

  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  // Convert to eyeSpace using eyeFromWorld
  lightPositionEye = (cameraRight.eyeFromWorld.multiplyVector3(lightPositionWorld, 1)); //ahhhhhhhhhhhhhhhhhhhhhhh


  shader.bind();
  shader.setUniformMatrix4fv('clipFromEye', clipFromEye.toFloats());
  shader.setUniformMatrix4fv('eyeFromWorld', cameraRight.eyeFromWorld.toFloats());
  shader.setUniformMatrix4fv('worldFromModel', Matrix4.identity().toFloats());
  shader.setUniform3f('lightPositionWorld', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);

  shader.setUniform3f('diffuseColor', 0.75, 0.75, 0.75);
  shader.setUniform1f('shininess', 20);
  shader.setUniform3f('specularColor', 0.2, 0.4, 0.1);
  shader.setUniform1f('ambientFactor', 0.4);

  renderEnvironment();

  shader.setUniformMatrix4fv('worldFromModel', Matrix4.identity().toFloats());



  // shader.setUniform3f('albedo', 0, 0.5, 0);

  // yoshiArray[0].bind();
  // yoshiArray[0].drawIndexed(gl.TRIANGLES);
  // yoshiArray[0].unbind();
  shader.setUniform1i('crateTexture', 25);
  yoshiArray[0].bind();
  yoshiArray[0].drawIndexed(gl.TRIANGLES);
  yoshiArray[0].unbind();
  shader.setUniform1i('crateTexture', 10);


  // shader.setUniform3f('albedo', 1, 0, 0);

  {
    const translater = Matrix4.translate(chassisYoshi.position.x, chassisYoshi.position.y, chassisYoshi.position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(chassisYoshi.quaternion.x, chassisYoshi.quaternion.y, chassisYoshi.quaternion.z, chassisYoshi.quaternion.w));
    const transform = translater.multiplyMatrix(rotater);
    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());

    for (let i = 1; i < yoshiArray.length; i++) {
      shader.setUniform1i('crateTexture', 30);
      // shader.setUniform3f('albedo', 1, 0, 0);
      if (yoshiTextureMap[i] !== undefined)  {
        shader.setUniform1i('crateTexture', yoshiTextureMap[i]);
      }
      yoshiArray[i].bind();
      yoshiArray[i].drawIndexed(gl.TRIANGLES);
      yoshiArray[i].unbind();
    }

  }

  
  for (let i = 0; i < 4; ++i) {
    const {position, quaternion} = vehicleYoshi.wheelInfos[i].worldTransform;
    const translater = Matrix4.translate(position.x, position.y, position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    const transform = translater.multiplyMatrix(rotater);
    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
    wheelVao.bind();
    wheelVao.drawIndexed(gl.TRIANGLES);
    wheelVao.unbind();
  }  

  {
    const translater = Matrix4.translate(chassisToad.position.x, chassisToad.position.y, chassisToad.position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(chassisToad.quaternion.x, chassisToad.quaternion.y, chassisToad.quaternion.z, chassisToad.quaternion.w));
    const transform = translater.multiplyMatrix(rotater);
    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());

    for (let i = 0; i < toadArray.length; i++) {
      shader.setUniform1i('crateTexture', 30);
      if (toadTextureMap[i] !== undefined)  {
        shader.setUniform1i('crateTexture', toadTextureMap[i]);
        // console.log("texture mapped: " + i + " " + toadTextureMap[i] );
      }
      toadArray[i].bind();
      toadArray[i].drawIndexed(gl.TRIANGLES);
      toadArray[i].unbind();
    }

  }    
  shader.setUniform1f('crateTexture', 5);

  
  for (let i = 0; i < 4; ++i) {
    const {position, quaternion} = vehicleToad.wheelInfos[i].worldTransform;
    const translater = Matrix4.translate(position.x, position.y, position.z);
    const rotater = Matrix4.fromQuaternion(new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
    const transform = translater.multiplyMatrix(rotater);
    shader.setUniformMatrix4fv('worldFromModel', transform.toFloats());
    // if (i > 2) {
    //   wheelVao.bind();
    //   wheelVao.drawIndexed(gl.TRIANGLES);
    //   wheelVao.unbind();
    // }

  }  
  shader.unbind();
}


function onResizeWindow() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const aspectRatio = canvas.width / canvas.height;
  clipFromEye = Matrix4.perspective(45, aspectRatio, 0.1, 1000);
}

async function initialize() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2', {alpha: false}) as WebGL2RenderingContext;

  await initializeTextures();

 lightPositionWorld = new Vector3(450, 200, -350);
  // console.log(Matrix4);

  gl.enable(gl.DEPTH_TEST);

  const vertexSource = `

uniform mat4 worldFromModel;
uniform mat4 eyeFromWorld;
uniform mat4 clipFromEye;
in vec3 position;
in vec3 normal;

in vec2 texPosition;
out vec2 mixTexPosition;

out vec3 mixNormal;
out vec3 model_position_eye;

void main() {
  gl_Position = clipFromEye * eyeFromWorld * worldFromModel * vec4(position, 1.0);
  model_position_eye = (eyeFromWorld * worldFromModel * vec4(position, 1.0)).xyz;
  gl_PointSize = 3.0;
  mixNormal = (eyeFromWorld * worldFromModel * vec4(normal, 0.0)).xyz;
  mixTexPosition = texPosition;
}
    `;

  const fragmentSource = `
uniform vec3 diffuseColor;
uniform float shininess;
uniform vec3 specularColor;
uniform vec3 lightPositionWorld;
uniform float ambientFactor;

in vec3 mixNormal;
in vec3 model_position_eye;
uniform sampler2D crateTexture;
in vec2 mixTexPosition;

out vec4 fragmentColor;

void main() {
  vec3 lightDirection = normalize(lightPositionWorld - model_position_eye);
  vec3 normal = normalize(mixNormal);
  float litness = max(dot(lightDirection, normal), 0.0);

  vec3 albedo = texture(crateTexture, mixTexPosition).rgb;

  vec3 ambient = ambientFactor * albedo * diffuseColor;
  vec3 diffuse =  (1.0 - ambientFactor) * litness * albedo * diffuseColor;
  vec3 eyeDirection = normalize(-model_position_eye);
  vec3 reflectDirection = reflect(-lightDirection, normal);
  float specularity = pow(max(0.0, dot(reflectDirection, eyeDirection)), shininess);
  vec3 specular = specularity * specularColor;

  vec3 rgb = ambient + diffuse + specular;

  fragmentColor = vec4(rgb, 1.0);
  // fragmentColor = vec4(mixTexPosition, 0.0, 1.0);
  // fragmentColor = albedo;
  // fragmentColor = (fragmentColor + vec4(diffuse, 0));
}
  `;

  shader = new ShaderProgram(vertexSource, fragmentSource);
  await initializeTerrain();

  await initializeEnvironmentModels();

  await initializeYoshiChassisModel();
  await initializeToadChassModel();

  // console.log(yoshiArray.length);


  // initializeLight();


  await initializePhysics(new Cannon.Vec3(790, 10, -300), new Cannon.Vec3(760, 10, -300), 3);

  cameraLeft = new FirstPersonCamera(
    new Vector3(10, 12, -5),
    new Vector3(15, 10, -20),
    new Vector3(0, 1, 0)
  );
  cameraRight = new FirstPersonCamera(
    new Vector3(10, 12, -5),
    new Vector3(15, 10, -20),
    new Vector3(0, 1, 0)
  );

  // Event listeners
  window.addEventListener('resize', () => {
    onResizeWindow();
    render();
  });

  window.addEventListener('pointerdown', event => {
    document.body.requestPointerLock();
  });

  window.addEventListener('mousemove', event => {
    if (document.pointerLockElement) {
      render();
    }
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'd') {
      toad_turn = -1;
    } else if (event.key === 'a') {
      toad_turn = 1;
    } else if (event.key === 'w') {
      toad_move = 1;
    } else if (event.key === 's') {
      toad_move = -1;
    } else if (event.key === 'q') {
      dropAnvil("yoshi");
    } else if (event.key === 'r') {
      let pos = new Cannon.Vec3(chassisToad.position.x, 10, chassisToad.position.z)
      let pos2 = new Cannon.Vec3(chassisYoshi.position.x, 10, chassisYoshi.position.z)
      initializePhysics(pos, pos2, 3);
    } else if (event.key === 'e') {

    }
  });

  window.addEventListener('keyup', event => {
    if (event.key === 'd') {
      toad_turn = 0;
    } else if (event.key === 'a') {
      toad_turn = 0;
    } else if (event.key === 'w') {
      toad_move = 0;
    } else if (event.key === 's') {
      toad_move = 0;
    }
  });

  window.addEventListener('keydown', event => {
  if (event.key === "ArrowRight") {
    yosh_turn = -1;
  } else if (event.key === "ArrowLeft") {
    yosh_turn = 1;
  } else if (event.key === "ArrowUp") {
    yosh_move = 1;
  } else if (event.key === "ArrowDown") {
    yosh_move = -1;
  } else if (event.key === ".") {
    dropAnvil("toad");
  }
  });

  window.addEventListener('keyup', event => {
    if (event.key === "ArrowRight") {
      yosh_turn = 0;
    } else if (event.key === "ArrowLeft") {
      yosh_turn = 0;
    } else if (event.key === "ArrowUp") {
      yosh_move = 0;
    } else if (event.key === "ArrowDown") {
      yosh_move = 0;
    }
    });
  

  onResizeWindow();
  animate();
}


function animate() {
  let currentMillis = performance.now();
  let elapsedMillis = currentMillis - lastMillis;
  let back = new Cannon.Vec3(0, 0, 20);
  back = chassisToad.quaternion.vmult(back);
  back.y = 6;
  let from = chassisToad.position.vadd(back);
  cameraLeft = new FirstPersonCamera(
    new Vector3(from.x, from.y, from.z),
    new Vector3(chassisToad.position.x, chassisToad.position.y, chassisToad.position.z),
    new Vector3(0, 1, 0)
  );

  let backYosh = new Cannon.Vec3(0, 0, 20);
  backYosh = chassisYoshi.quaternion.vmult(backYosh);
  backYosh.y = 6;
  let fromYosh = chassisYoshi.position.vadd(backYosh);
  cameraRight = new FirstPersonCamera(
    new Vector3(fromYosh.x, fromYosh.y, fromYosh.z),
    new Vector3(chassisYoshi.position.x, chassisYoshi.position.y, chassisYoshi.position.z),
    new Vector3(0, 1, 0)
  );

  // console.log(chassisToad.position);
  vehicleYoshi.applyEngineForce(1000 * yosh_move, 2);
  vehicleYoshi.applyEngineForce(1000 * yosh_move, 3);
  vehicleYoshi.setSteeringValue(0.5 * yosh_turn, 0);
  vehicleYoshi.setSteeringValue(0.5 * yosh_turn, 1);
  vehicleYoshi.setBrake(100000 * yosh_brake, 0);
  vehicleYoshi.setBrake(100000 * yosh_brake, 1);
  vehicleYoshi.setBrake(100000 * yosh_brake, 2);
  vehicleYoshi.setBrake(100000 * yosh_brake, 3);

  vehicleToad.applyEngineForce(1000 * toad_move, 2);
  vehicleToad.applyEngineForce(1000 * toad_move, 3);
  vehicleToad.setSteeringValue(0.5 * toad_turn, 0);
  vehicleToad.setSteeringValue(0.5 * toad_turn, 1);
  vehicleToad.setBrake(100000 * toad_brake, 0);
  vehicleToad.setBrake(100000 * toad_brake, 1);
  vehicleToad.setBrake(100000 * toad_brake, 2);
  vehicleToad.setBrake(100000 * toad_brake, 3);

  physics.fixedStep();



  render();
  // renderEnvironment();
  lastMillis = currentMillis;
  requestAnimationFrame(animate);
  
}

async function readImage(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

class Terrain {
  width: number;
  depth: number;
  heights: number[];
  scale: number;

  constructor(width: number, depth: number, heights: number[]) {
    this.width = width;
    this.depth = depth;
    this.heights = heights;
    this.scale = 0.03;
  }

  vertexHeight(x: number, z: number) {
    return this.heights[z * this.width + x] * this.scale;
  }

  interpolateHeight(x: number, z: number) {
    const floorX = Math.floor(x);
    const floorZ = Math.floor(z);
    const fractionX = x - floorX;
    const fractionZ = z - floorZ;

    const nearLeftHeight = this.vertexHeight(floorX, floorZ);
    const nearRightHeight = this.vertexHeight(floorX + 1, floorZ);
    const nearMixHeight = (1 - fractionX) * nearLeftHeight + fractionX * nearRightHeight;

    const farLeftHeight = this.vertexHeight(floorX, floorZ + 1);
    const farRightHeight = this.vertexHeight(floorX + 1, floorZ + 1);
    const farMixHeight = (1 - fractionX) * farLeftHeight + fractionX * farRightHeight;

    const mixHeight = (1 - fractionZ) * nearMixHeight + fractionZ * farMixHeight;
    return mixHeight;
  }

  toTrimesh() {
    const positions = [];
    const normals = [];
    // const texCoords = [];
    for (let z = 0; z < this.depth; ++z) {
      for (let x = 0; x < this.width; ++x) {
        let y = this.vertexHeight(x, z);
        positions.push(x, y, -z);
        // texCoords.push(new Vector3(x, y, -z).normalize());
        // texCoords.push(x, z)

        let right;
        let up;
        if (x < this.width - 1 && z < this.depth - 1) {
          right = new Vector3(1, this.vertexHeight(x + 1, z) - y, 0);
          up = new Vector3(0, this.vertexHeight(x, z + 1) - y, 1);
        } else {
          right = new Vector3(-1, this.vertexHeight(x - 1, z) - y, 0);
          up = new Vector3(0, this.vertexHeight(x, z - 1) - y, -1);
        }
        const normal = up.cross(right).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    const indices: number[] = [];
    for (let z = 0; z < this.depth - 1; ++z) {
      let nextZ = z + 1;
      for (let x = 0; x < this.width - 1; ++x) {
        let nextX = x + 1;
        indices.push(
          z * this.width + x,
          z * this.width + nextX,
          nextZ * this.width + x,
        );
        indices.push(
          z * this.width + nextX,
          nextZ * this.width + nextX,
          nextZ * this.width + x,
        );
      }
    }

    return {
      positions,
      normals,
      indices
    };
  }

  toArrays() {
    const heights: number[][] = [];
    for (let x = 0; x < this.width; ++x) {
      let row: number[] = [];
      for (let z = 0; z < this.depth; ++z) {
        row.push(this.vertexHeight(x, z));
      }
      heights.push(row);
    }
    return heights;
  }
}

function imageToTerrain(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0, image.width, image.height);
  const pixels = context.getImageData(0, 0, image.width, image.height);

  const grays = new Array(image.width * image.height);
  for (let i = 0; i < image.width * image.height; ++i) {
    grays[i] = pixels.data[i * 4];
  }

  return new Terrain(image.width, image.height, grays);
}

async function initializeTerrain() {
  const image = await readImage('track.png');
  terrain = imageToTerrain(image);

  const mesh = terrain.toTrimesh();
  const attributes = new VertexAttributes();
  attributes.addAttribute('position', terrain.width * terrain.depth, 3, mesh.positions);
  attributes.addAttribute('normal', terrain.width * terrain.depth, 3, mesh.normals);
  attributes.addIndices(mesh.indices);
  vao = new VertexArray(shader, attributes);

  yoshiArray.push(vao);

  return terrain;
}

async function initializeYoshiChassisModel() {
  let yoshi = await gltf.readModel('bigYoshi2.gltf');

  for (let i = 0; i < yoshi.meshes.length; i++) {
    
    let mesh = yoshi.meshes[i];
    let attributes = new VertexAttributes();
    let texCoords = yoshi.meshes[i].texCoord;
    attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
    attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
    attributes.addAttribute('texPosition', texCoords!.count, 2, texCoords!.buffer);
    attributes.addIndices(mesh.indices!.buffer);
    yoshiArray.push(new VertexArray(shader, attributes));
  }

  let wheel = await gltf.readModel('wheely.gltf');
  let mesh = wheel.meshes[1];
  let attributes = new VertexAttributes();
  attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
  attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
  attributes.addIndices(mesh.indices!.buffer);
  wheelVao = new VertexArray(shader, attributes);
}

async function initializeToadChassModel() {
  let toad = await gltf.readModel('bigToad.gltf');

  for (let i = 0; i < toad.meshes.length; i++) {
    
    let mesh = toad.meshes[i];
    let attributes = new VertexAttributes();
    let texCoords = toad.meshes[i].texCoord;
    attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
    attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
    attributes.addIndices(mesh.indices!.buffer);
    attributes.addAttribute('texPosition', texCoords!.count, 2, texCoords!.buffer);
    toadArray.push(new VertexArray(shader, attributes));
  }
}


async function initializeEnvironmentModels() {
  let tree = await gltf.readModel('tree.gltf');

  for (let i = 0; i < tree.meshes.length; i++) {
    let mesh = tree.meshes[i];
    let attributes = new VertexAttributes();
    let texCoords = tree.meshes[i].texCoord;
    attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
    attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
    attributes.addIndices(mesh.indices!.buffer);
    attributes.addAttribute('texPosition', texCoords!.count, 2, texCoords!.buffer);
    treeArray.push(new VertexArray(shader, attributes));
  }

  let barn = await gltf.readModel('barn.gltf');

  for (let i = 0; i < barn.meshes.length; i++) {
    let mesh = barn.meshes[i];
    let attributes = new VertexAttributes();
    let texCoords = barn.meshes[i].texCoord;
    attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
    attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
    attributes.addIndices(mesh.indices!.buffer);
    attributes.addAttribute('texPosition', texCoords!.count, 2, texCoords!.buffer);
    barnArray.push(new VertexArray(shader, attributes));
  }

  let windmill = await gltf.readModel('windmill.gltf');

  for (let i = 0; i < windmill.meshes.length; i++) {
    let mesh = windmill.meshes[i];
    let attributes = new VertexAttributes();
    let texCoords = windmill.meshes[i].texCoord;
    attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
    attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
    attributes.addIndices(mesh.indices!.buffer);
    attributes.addAttribute('texPosition', texCoords!.count, 2, texCoords!.buffer);

    windmillArray.push(new VertexArray(shader, attributes));
  }

  let finish =  await gltf.readModel('finishLine.gltf');
  for (let i = 0; i < finish.meshes.length; i++) {
    let mesh = finish.meshes[i];
    let attributes = new VertexAttributes();
    let texCoords = finish.meshes[i].texCoord;
    attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
    attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
    attributes.addIndices(mesh.indices!.buffer);
    attributes.addAttribute('texPosition', texCoords!.count, 2, texCoords!.buffer);

    finishArray.push(new VertexArray(shader, attributes));
  }

  let cow =  await gltf.readModel('cow.gltf');
  for (let i = 0; i < cow.meshes.length; i++) {
    let mesh = cow.meshes[i];
    let attributes = new VertexAttributes();
    let texCoords = cow.meshes[i].texCoord;
    attributes.addAttribute('position', mesh.positions.count, mesh.positions.size, mesh.positions.buffer);
    attributes.addAttribute('normal', mesh.normals!.count, mesh.normals!.size, mesh.normals!.buffer);
    attributes.addIndices(mesh.indices!.buffer);
    attributes.addAttribute('texPosition', texCoords!.count, 2, texCoords!.buffer);

    cowArray.push(new VertexArray(shader, attributes));
  }
}

async function initializePhysics(position1: Cannon.Vec3, position2: Cannon.Vec3, car: number) {
  physics = new Cannon.World({
    gravity: new Cannon.Vec3(0, -11.81, 0),
  });
  physics.broadphase = new Cannon.SAPBroadphase(physics);
  physics.defaultContactMaterial.friction = 0.0;

  const groundMaterial = new Cannon.Material('ground');
  terrainBody = new Cannon.Body({
  type: Cannon.Body.STATIC,
  shape: new Cannon.Heightfield(terrain.toArrays(), {
    elementSize: 1,
  }),
  position: new Cannon.Vec3(0, 0, 0),
  material: groundMaterial,
  });
  terrainBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  physics.addBody(terrainBody);

  let chassisDimensions = new Vector3(3.5, 1, 6);
  const chassisShape = new Cannon.Box(new Cannon.Vec3(
    chassisDimensions.x * 0.5,
    chassisDimensions.y * 0.5,
    chassisDimensions.z * 0.5,
  ));

  let cowDimensions = new Vector3(3.5, 1, 6);
  let cowShape = new Cannon.Box(new Cannon.Vec3(
    cowDimensions.x * 0.5,
    cowDimensions.y * 0.5,
    cowDimensions.z * 0.5,
  ));
  
  let cowVehicleArray:Cannon.RaycastVehicle[] = [];

  for (let cow of environmentModels.cows) {
    // let cowPosition = Matrix4.translate(cow.x, cow.y, cow.z);
    // shader.setUniformMatrix4fv('worldFromModel', cowPosition.toFloats());
    let chassisCow = new Cannon.Body({
      // mass: 1,
      mass: 200000,
  
      angularDamping: 0.8,
      linearDamping: 0.1,
      position: new Cannon.Vec3(cow.x, cow.y, cow.z),
    });
    // console.log(chassisCow.position);
    chassisCow.addShape(cowShape);

    let vehicleCow = new Cannon.RaycastVehicle({
      chassisBody: chassisCow,
      indexRightAxis: 0,
      indexUpAxis: 1,
      indexForwardAxis: 2,
    });
    cowVehicleArray.push(vehicleCow);
    cowChassisArray.push(chassisCow);
  }





  chassisToad = new Cannon.Body({
    // mass: 1,
    mass: 250,

    angularDamping: 0.8,
    linearDamping: 0.1,
    position: position1,
  });

  chassisToad.quaternion.setFromEuler(0, Math.PI, 0);
  chassisToad.addShape(chassisShape);
  
  vehicleToad = new Cannon.RaycastVehicle({
    chassisBody: chassisToad,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });

  chassisYoshi = new Cannon.Body({
    // mass: 1,
    mass: 250,

    angularDamping: 0.8,
    linearDamping: 0.1,
    position: position2,
  });
  chassisYoshi.quaternion.setFromEuler(0, Math.PI, 0);
  chassisYoshi.addShape(chassisShape);

  vehicleYoshi = new Cannon.RaycastVehicle({
    chassisBody: chassisYoshi,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });
  
  // physics.addBody(chassisToad);
  const wheelOptions = {
    radius: 1,
    directionLocal: new Cannon.Vec3(0, -1, 0),
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    frictionSlip: 2.0,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.00001,
    axleLocal: new Cannon.Vec3(1, 0, 0),
    chassisConnectionPointLocal: new Cannon.Vec3(),
    maxSuspensionTravel: 0.1,
    customSlidingRotationalSpeed: -10,
    useCustomSlidingRotationalSpeed: true,
  };
  
  // Front left is wheel 0
  wheelOptions.chassisConnectionPointLocal.set(-0.2, 0.3, -2);
  vehicleToad.addWheel(wheelOptions);
  
  // Front right is wheel 1
  wheelOptions.chassisConnectionPointLocal.set(0.2, 0.3, -2);
  vehicleToad.addWheel(wheelOptions);
  
  // Back left is wheel 2
  wheelOptions.chassisConnectionPointLocal.set(-1.9, 0.3, 2);
  vehicleToad.addWheel(wheelOptions);
  
  // Back right is wheel 3
  wheelOptions.chassisConnectionPointLocal.set(1.9, 0.3, 2);
  vehicleToad.addWheel(wheelOptions);


  // Front left is wheel 0
  wheelOptions.chassisConnectionPointLocal.set(-0.2, 0.3, -2);
  vehicleYoshi.addWheel(wheelOptions);
  
  // Front right is wheel 1
  wheelOptions.chassisConnectionPointLocal.set(0.2, 0.3, -2);
  vehicleYoshi.addWheel(wheelOptions);
  
  // Back left is wheel 2
  wheelOptions.chassisConnectionPointLocal.set(-1.9, 0.3, 2);
  vehicleYoshi.addWheel(wheelOptions);
  
  // Back right is wheel 3
  wheelOptions.chassisConnectionPointLocal.set(1.9, 0.3, 2);
  vehicleYoshi.addWheel(wheelOptions);

  const wheelBodies: Cannon.Body[] = [];
  const wheelMaterial = new Cannon.Material('wheel');
  vehicleToad.wheelInfos.forEach(wheel => {
    const cylinderShape = new Cannon.Cylinder(wheel.radius, wheel.radius, 0.6, 20);
    const wheelBody = new Cannon.Body({
      mass: 0,
      material: wheelMaterial,
    });
    wheelBody.type = Cannon.Body.KINEMATIC;
    wheelBody.collisionFilterGroup = 0;
    const toad_quaternion = new Cannon.Quaternion().setFromEuler(0, -Math.PI / 2, 0);
    wheelBody.addShape(cylinderShape, new Cannon.Vec3(), toad_quaternion);
    wheelBodies.push(wheelBody);
    physics.addBody(wheelBody);
  })
  vehicleYoshi.wheelInfos.forEach(wheel => {
    const cylinderShape = new Cannon.Cylinder(wheel.radius, wheel.radius, 0.6, 20);
    const wheelBody = new Cannon.Body({
      mass: 0,
      material: wheelMaterial,
    });
    wheelBody.type = Cannon.Body.KINEMATIC;
    wheelBody.collisionFilterGroup = 0;
    const yosh_quaternion = new Cannon.Quaternion().setFromEuler(0, -Math.PI / 2, 0);
    wheelBody.addShape(cylinderShape, new Cannon.Vec3(), yosh_quaternion);
    wheelBodies.push(wheelBody);
    physics.addBody(wheelBody);
  })

  const wheelGroundContactMaterial = new Cannon.ContactMaterial(wheelMaterial, groundMaterial, {
    friction: 0.3,
    restitution: 0,
    contactEquationStiffness: 1000,
  });
  physics.addContactMaterial(wheelGroundContactMaterial);
  
  physics.addEventListener('postStep', () => {
  for (let i = 0; i < vehicleToad.wheelInfos.length; i++) {
    vehicleToad.updateWheelTransform(i);
    const transform = vehicleToad.wheelInfos[i].worldTransform;
    const wheelBody = wheelBodies[i];
    wheelBody.position.copy(transform.position);
    wheelBody.quaternion.copy(transform.quaternion);
  }
});
physics.addEventListener('postStep', () => {
  for (let i = 0; i < vehicleYoshi.wheelInfos.length; i++) {
    vehicleToad.updateWheelTransform(i);
    const transform = vehicleYoshi.wheelInfos[i].worldTransform;
    const wheelBody = wheelBodies[i];
    wheelBody.position.copy(transform.position);
    wheelBody.quaternion.copy(transform.quaternion);
  }
});
  
switch(car) {
  case 1:
    vehicleToad.addToWorld(physics);
    break;
  case 2:
    vehicleYoshi.addToWorld(physics);
    break;
  case 3:
    vehicleToad.addToWorld(physics);
    vehicleYoshi.addToWorld(physics);
    break;
  default:
    break;
}

// vehicleCow.addToWorld(physics);
for (let i = 0; i < cowVehicleArray.length; i++) {
  let cow = cowVehicleArray[i];
  // console.log("cow: " + cow);
  cow.addToWorld(physics);
}
}

function dropAnvil(racer: String) {
  const thwomp: HTMLAudioElement = document.getElementById("collide") as HTMLAudioElement;
  thwomp.volume = 0.1;
  thwomp.play();
  let chassisDimensions = new Vector3(3.5, 1, 6);
  const chassisShape = new Cannon.Box(new Cannon.Vec3(
    chassisDimensions.x * 0.5,
    chassisDimensions.y * 0.5,
    chassisDimensions.z * 0.5,
  ));

  let position = racer == "toad" ? chassisToad.position : chassisYoshi.position
  let chassisAnvil = new Cannon.Body({
    // mass: 1,
    mass: 200000000000,

    angularDamping: 0.8,
    linearDamping: 0.1,
    position: new Cannon.Vec3(position.x, position.y, position.z),
  });
  // console.log(chassisCow.position);
  chassisAnvil.addShape(chassisShape);

  let anvil = new Cannon.RaycastVehicle({
    chassisBody: chassisAnvil,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });

  anvil.addToWorld(physics)
}

function createTexture2d(image: any, textureUnit: number) {
  gl.activeTexture(textureUnit);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

async function initializeTextures(){
  createTexture2d(await readImage("grass.png"), gl.TEXTURE0);
  createTexture2d(await readImage("bigToadFace.png"), gl.TEXTURE1);
  createTexture2d(await readImage("bigToadHead.png"), gl.TEXTURE2);
  createTexture2d(await readImage("bigToadJacket.png"), gl.TEXTURE3);
  createTexture2d(await readImage("white.png"), gl.TEXTURE4);
  createTexture2d(await readImage("brown.png"), gl.TEXTURE5);
  createTexture2d(await readImage("toadSkin.png"), gl.TEXTURE6);
  createTexture2d(await readImage("blue.png"), gl.TEXTURE7);
  createTexture2d(await readImage("black.png"), gl.TEXTURE8);
  createTexture2d(await readImage("yoshiBody.png"), gl.TEXTURE9);
  createTexture2d(await readImage("yoshiCheek.png"), gl.TEXTURE10);
  createTexture2d(await readImage("yoshiEyeball.png"), gl.TEXTURE11);
  createTexture2d(await readImage("yoshiHead.png"), gl.TEXTURE12);
  createTexture2d(await readImage("yoshiNose.png"), gl.TEXTURE13);
  createTexture2d(await readImage("gray.png"), gl.TEXTURE14);
  createTexture2d(await readImage("green.png"), gl.TEXTURE15);
  createTexture2d(await readImage("red.png"), gl.TEXTURE16);
  createTexture2d(await readImage("Windmill Base Texture.png"), gl.TEXTURE17);
  createTexture2d(await readImage("Windmill Center Texture.png"), gl.TEXTURE18);
  createTexture2d(await readImage("Windmill Fan texture.png"), gl.TEXTURE19);
  createTexture2d(await readImage("cowBody.png"), gl.TEXTURE20);
  createTexture2d(await readImage("cowFace.png"), gl.TEXTURE21);
  createTexture2d(await readImage("cowHead.png"), gl.TEXTURE22);
  createTexture2d(await readImage("gold.png"), gl.TEXTURE23);
  createTexture2d(await readImage("flag.png"), gl.TEXTURE24);
  createTexture2d(await readImage("Leaf Texture.png"), gl.TEXTURE25);

  cowTextureMap[0] = 4;
  cowTextureMap[1] = 23;
  cowTextureMap[2] = 22;
  // cowTextureMap[3] = 4;
  cowTextureMap[4] = 21;
  cowTextureMap[5] = 20;
  cowTextureMap[6] = 4;
  cowTextureMap[7] = 4;
  cowTextureMap[8] = 4;
  // cowTextureMap[9] = 4;
  cowTextureMap[10] = 6;
  cowTextureMap[11] = 6;
  // cowTextureMap[12] = 4;
  // cowTextureMap[13] = 4;
  // cowTextureMap[14] = 4;
  // cowTextureMap[15] = 4;
  cowTextureMap[16] = 4;
  cowTextureMap[17] = 4;
  cowTextureMap[18] = 4;
  cowTextureMap[19] = 4;
  cowTextureMap[20] = 4;

  finishTextureMap[0] = 5;
  finishTextureMap[1] = 24;
  finishTextureMap[2] = 5;

  windmillTextureMap[0] = 17;
  windmillTextureMap[1] = 18;
  windmillTextureMap[2] = 19;
  windmillTextureMap[3] = 19;
  windmillTextureMap[4] = 19;
  windmillTextureMap[5] = 19;
  windmillTextureMap[6] = 19;
  windmillTextureMap[7] = 18;

  treeTextureMap[0] = 25;
  treeTextureMap[1] = 5;

  barnTextureMap[0] = 4;
  barnTextureMap[1] = 16;

  toadTextureMap[3] = 1;
  toadTextureMap[2] = 2;
  toadTextureMap[11] = 3;
  toadTextureMap[0] = 4;
  toadTextureMap[1] = 4;
  toadTextureMap[5] = 5;
  toadTextureMap[6] = 5;
  toadTextureMap[7] = 5;
  toadTextureMap[8] = 5;
  toadTextureMap[4] = 6;
  toadTextureMap[13] = 6;
  toadTextureMap[14] = 6;
  toadTextureMap[15] = 6;
  toadTextureMap[12] = 6;
  toadTextureMap[16] = 7;
  toadTextureMap[19] = 7;
  toadTextureMap[24] = 7;
  toadTextureMap[26] = 7;
  toadTextureMap[28] = 7;

  yoshiTextureMap[1] = 10;
  yoshiTextureMap[2] = 14;
  yoshiTextureMap[3] = 14;
  yoshiTextureMap[4] = 14;
  yoshiTextureMap[5] = 14;
  yoshiTextureMap[6] = 14;
  yoshiTextureMap[7] = 14;
  yoshiTextureMap[8] = 14;
  yoshiTextureMap[9] = 14;
  yoshiTextureMap[10] = 14;
  yoshiTextureMap[11] = 14;
  yoshiTextureMap[12] = 14;
  yoshiTextureMap[13] = 14;
  yoshiTextureMap[14] = 14;
  yoshiTextureMap[15] = 14;
  yoshiTextureMap[16] = 14;
  yoshiTextureMap[17] = 14;
  yoshiTextureMap[18] = 14;
  yoshiTextureMap[19] = 14;
  yoshiTextureMap[20] = 14;
  yoshiTextureMap[21] = 14;
  yoshiTextureMap[22] = 14;
  yoshiTextureMap[23] = 15;
  yoshiTextureMap[24] = 12;
  yoshiTextureMap[25] = 13;
  yoshiTextureMap[26] = 11;
  yoshiTextureMap[27] = 10;
  yoshiTextureMap[28] = 11;
  yoshiTextureMap[29] = 9;
  yoshiTextureMap[30] = 15;
  yoshiTextureMap[31] = 15;
  yoshiTextureMap[32] = 15;
  yoshiTextureMap[33] = 15;
  yoshiTextureMap[34] = 15;
  yoshiTextureMap[35] = 15;
  yoshiTextureMap[36] = 15;
  yoshiTextureMap[37] = 15;
  yoshiTextureMap[38] = 15;
  yoshiTextureMap[39] = 4;
  yoshiTextureMap[40] = 15;
  yoshiTextureMap[41] = 5;
  yoshiTextureMap[42] = 5;
  yoshiTextureMap[43] = 16;
  yoshiTextureMap[44] = 16;
  yoshiTextureMap[45] = 16;
  yoshiTextureMap[46] = 16;
  yoshiTextureMap[47] = 15;
  yoshiTextureMap[48] = 5;
  yoshiTextureMap[49] = 5;
  yoshiTextureMap[50] = 15;
  yoshiTextureMap[51] = 15;
  yoshiTextureMap[52] = 15;
  yoshiTextureMap[53] = 15;
  yoshiTextureMap[54] = 16;
  yoshiTextureMap[55] = 15;
  yoshiTextureMap[56] = 15;
  yoshiTextureMap[57] = 15;
  // yoshiTextureMap[58] = 15;
  // yoshiTextureMap[59] = 15;
  // yoshiTextureMap[60] = 16;
  // yoshiTextureMap[61] = 16;
  // yoshiTextureMap[62] = 16;
  yoshiTextureMap[63] = 14;
  yoshiTextureMap[64] = 16;
  yoshiTextureMap[65] = 14;
  yoshiTextureMap[66] = 14;
  yoshiTextureMap[67] = 14;
  yoshiTextureMap[68] = 14;
  yoshiTextureMap[69] = 14;
  yoshiTextureMap[70] = 14;
  yoshiTextureMap[71] = 14;
}

window.addEventListener('load', () => initialize());
