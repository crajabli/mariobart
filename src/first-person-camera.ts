import { Vector3 } from "./vector.js";
import { Matrix4 } from "./matrix.js";

export class FirstPersonCamera {
    camera_position: Vector3;
    camera_forward: Vector3;
    camera_right: Vector3;
    camera_up: Vector3;
    worldUp: Vector3;
    eyeFromWorld: Matrix4;

    constructor(camera_position: Vector3, lookingAt: Vector3, worldUp: Vector3) {
        this.camera_position = camera_position;
        this.camera_forward = lookingAt.subtract(camera_position).normalize();
        this.camera_right = new Vector3(0, 0, 0);
        this.camera_up = new Vector3(0, 0, 0);
        this.worldUp = worldUp;

        this.eyeFromWorld = new Matrix4();
        this.reorient();
    }

    // W.I.P
    reorient() {
        this.camera_right = this.camera_forward.cross(this.worldUp).normalize();
        // console.log("camera right: " + this.camera_right);
        this.camera_up = this.camera_right.cross(this.camera_forward).normalize();
        // console.log("camera up: " + this.camera_up);

        
        let translater = Matrix4.translate(-this.camera_position.x,
                                           -this.camera_position.y,
                                           -this.camera_position.z);
        let rotater = Matrix4.rotator(this.camera_right,
                                      this.camera_up,
                                      this.camera_forward);

        let eyeFromWorld = rotater.multiplyMatrix(translater);
        this.eyeFromWorld = eyeFromWorld;
    }

    // W.I.P Not sure if this is correct
    strafe(distance: number) {
        this.camera_position = this.camera_position.add(this.camera_right.scalarMultiply(distance));
        this.reorient();
    }

    // W.I.P
    advance(distance: number) {
        this.camera_position = this.camera_position.add(this.camera_forward.scalarMultiply(distance));
        this.reorient();        
    }

    // W.I.P
    elevate(elevation: number) {
        this.camera_position.y = elevation;
        this.reorient();
    }

    // W.I.P
    yaw(degrees: number) {
        this.camera_forward = Matrix4.rotateAround(this.worldUp, degrees).multiplyVector3(this.camera_forward, 1);
        this.reorient();
    }

    // W.I.P
    pitch(degrees: number) {
        //forward = rotateAround(right, degrees) * forward
        //reorient 
        this.camera_forward = Matrix4.rotateAround(this.camera_right, degrees).multiplyVector3(this.camera_forward, 1);
        this.reorient();
    }
}