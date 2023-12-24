import {VertexAttributes} from './vertex-attributes';
import {ShaderProgram} from './shader-program';
import {VertexArray} from './vertex-array';
import { Vector3 } from './vector';
import { Quaternion } from './quaternion';



export class Matrix4 {
    elements: Float32Array;
    static size = 4; // 4 x 4 array
    constructor() {
        // 00 01 02 03
        // 04 05 06 07
        // 08 09 10 11 
        // 12 13 14 15
        // [00,04,08,12,01,...,15] Column Major

        // Eat shit and die WebGL
        // Yo moms a ho

        // 00 04 08 12
        // 01 05 09 13
        // 02 06 10 14
        // 03 07 11 15
        this.elements = new Float32Array(16);
    }
    
    get(row: number, col: number) {
        return this.elements[col * Matrix4.size + row]
    }

    set(row: number, col: number, value: number) {
        this.elements[col * Matrix4.size + row] = value;
    }

    toFloats() {
        return this.elements;
    }
    
    static scale(x: number, y: number, z: number) {
        let temp = new Matrix4();
        temp.set(0, 0, x);
        temp.set(1, 1, y);
        temp.set(2, 2, z);
        temp.set(3, 3, 1);
        return temp;
    }

    static translate(x: number, y: number, z: number) {
        let temp = new Matrix4();
        temp.set(0, 0, 1);
        temp.set(1, 1, 1);
        temp.set(2, 2, 1);
        temp.set(3, 3, 1);
        temp.set(0, Matrix4.size - 1, x);
        temp.set(1, Matrix4.size - 1, y);
        temp.set(2, Matrix4.size - 1, z);
        return temp;
    }

    static rotateX(angle: number) {
        let radians = angle * (Math.PI / 180);
        let temp = new Matrix4();
        temp.set(0, 0, 1);
        temp.set(3, 3, 1);
        temp.set(1, 1, Math.cos(radians));
        temp.set(1, 2, -1 * Math.sin(radians));
        temp.set(2, 1, Math.sin(radians));
        temp.set(2, 2, Math.cos(radians));
        return temp;
    }

    static rotateY(angle: number) {
        let radians = angle * (Math.PI / 180);
        let temp = new Matrix4();
        temp.set(0, 0, Math.cos(radians));
        temp.set(0, 2, -1 * Math.sin(radians));
        temp.set(1, 1, 1);
        temp.set(2, 0, Math.sin(radians));
        temp.set(2, 2, Math.cos(radians));
        temp.set(3, 3, 1);
        return temp;
    }

    static rotateZ(angle: number) {
        let radians = angle * (Math.PI / 180);
        let temp = new Matrix4();
        temp.set(0, 0, Math.cos(radians));
        temp.set(0, 1, -1 * Math.sin(radians));
        temp.set(1, 0, Math.sin(radians));
        temp.set(1, 1, Math.cos(radians));
        temp.set(2, 2, 1);
        temp.set(Matrix4.size - 1, Matrix4.size - 1, 1);
        return temp;
    }

    static identity() {
        return Matrix4.scale(1, 1, 1);
    }

    multiplyMatrix(matrix: Matrix4) {
        let temp = new Matrix4();
        for (let i = 0; i < Matrix4.size; i++) {
            for (let j = 0; j < Matrix4.size; j++) {
                let item = 0;
                for (let h = i; h < Matrix4.size + i; h++) {
                    item += this.get(i, h - i) * matrix.get(h - i, j);
                }
                temp.set(i, j, item);
            }
        }
        return temp;
    }

    multiplyVector3(vec3: Vector3, hom: number) {
        let temp = new Vector3(
            this.get(0 ,0) * vec3.x + this.get(0, 1) * vec3.y + this.get(0, 2) * vec3.z + this.get(0, 3) * hom,
            this.get(1 ,0) * vec3.x + this.get(1, 1) * vec3.y + this.get(1, 2) * vec3.z + this.get(1, 3) * hom,
            this.get(2 ,0) * vec3.x + this.get(2, 1) * vec3.y + this.get(2, 2) * vec3.z + this.get(2, 3) * hom
        );
        return temp;
    }

    static perspective(fov: number,  aspect_ratio: number, near: number, far: number) {
        let temp = new Matrix4();
        let top: number = Math.tan(fov / 2) * near;
        let right: number = aspect_ratio * top;
        temp.set(0, 0, near / right);
        temp.set(1, 1, near / top);
        temp.set(2, 2, (near + far) / (near - far));
        temp.set(3, 2, -1);
        temp.set(2, 3, (2 * near * far) / (near - far));
        return temp;        
    }

    static rotateAround(axis: Vector3, degrees: number) {
        let radians = degrees * (Math.PI / 180);
        let s = Math.sin(radians);
        let c = Math.cos(radians);
        let d = 1 - c;
        let m = new Matrix4();

        m.set(0, 0, d * axis.x * axis.x + c);
        m.set(1, 0, d * axis.x * axis.y - s * axis.z);
        m.set(2, 0, d * axis.x * axis.z + s * axis.y);

        m.set(0, 1, d * axis.y * axis.x + s * axis.z);
        m.set(1, 1, d * axis.y*axis.y + c);
        m.set(2, 1, d * axis.y * axis.z - s * axis.x);

        m.set(0, 2, d * axis.z * axis.x - s * axis.y);
        m.set(1, 2, d * axis.z * axis.y + s * axis.x);
        m.set(2, 2, d * axis.z * axis.z + c);

        m.set(4, 4, 1);

        return m;
    }
    static lookAt(from: Vector3, to: Vector3, worldUp: Vector3) {
        let translater = this.translate(-from.x, -from.y, -from.z);
        let rotater = new Matrix4();

        let forward = to.subtract(from).normalize();
        let right = forward.cross(worldUp).normalize();
        let up = right.cross(forward).normalize();

        rotater.set(0, 0, right.x);
        rotater.set(1, 0, right.y);
        rotater.set(2, 0, right.z);

        rotater.set(0, 1, up.x);
        rotater.set(1, 1, up.y);
        rotater.set(2, 1, up.z);

        rotater.set(0, 2, -forward.x);
        rotater.set(1, 2, -forward.y);
        rotater.set(2, 2, -forward.z);

        rotater.set(3, 3, 1);

        console.log(rotater);

        let eyeFromWorld = translater.multiplyMatrix(rotater);
        return eyeFromWorld
    }

    static rotator(right: Vector3, up: Vector3, forward: Vector3) {
        let temp = this.identity();
        // Setting Right
        temp.set(0, 0, right.x);
        temp.set(0, 1, right.y);
        temp.set(0, 2, right.z);
        // Setting Up
        temp.set(1, 0, up.x);
        temp.set(1, 1, up.y);
        temp.set(1, 2, up.z);
        // Setting Forward
        temp.set(2, 0, -forward.x);
        temp.set(2, 1, -forward.y);
        temp.set(2, 2, -forward.z);
        return temp;
    }

    static fromBuffer(buffer: Float32Array | Uint16Array) {
        let m = Matrix4.identity();
        for (let i = 0; i < 16; ++i) {
          m.elements[i] = buffer[i];
        }
        return m;
      }
      
    static fromElements(elements: number[]) {
    let m = Matrix4.identity();
    for (let i = 0; i < 16; ++i) {
        // TODO: rename floats to your Float32 array
        m.elements[i] = elements[i];
    }
    return m;
    }

    static fromQuaternion(q: Quaternion) {
        let m = Matrix4.identity();
      
        let x2 = q.get(0) + q.get(0);
        let y2 = q.get(1) + q.get(1);
        let z2 = q.get(2) + q.get(2);
      
        let xx = q.get(0) * x2;
        let yx = q.get(1) * x2;
        let yy = q.get(1) * y2;
        let zx = q.get(2) * x2;
        let zy = q.get(2) * y2;
        let zz = q.get(2) * z2;
        let wx = q.get(3) * x2;
        let wy = q.get(3) * y2;
        let wz = q.get(3) * z2;
      
        return Matrix4.fromElements([
          1 - yy - zz, yx + wz, zx - wy, 0,
          yx - wz, 1 - xx - zz, zy + wx, 0,
          zx + wy, zy - wx, 1 - xx - yy, 0,
          0, 0, 0, 1
        ]);
      }
}