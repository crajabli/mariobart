export class Vector3 {
    xyz: number[];

    constructor(x: number, y: number, z: number) {
        this.xyz = [x, y, z];
    }
    get(index: number){
        switch(index) {
            case 0:
                return this.xyz[0];
            case 1:
                return this.xyz[1];
            case 2:
                return this.xyz[2];
        }
        return 0;
    }

    get x() {
        return this.xyz[0];
    }
    set x(value: number) {
        this.xyz[0] = value;
    }
    
    get y() {
        return this.xyz[1];
    }
    set y(value: number) {
        this.xyz[1] = value;
    }

    get z() {
        return this.xyz[2];
    }
    set z(value: number) {
        this.xyz[2] = value;
    }

    get magnitude() {
        return Math.sqrt(this.x * this.x +
                         this.y * this.y +
                         this.z * this.z);
    }

    add(that: Vector3) {
        return new Vector3(this.x + that.x, this.y + that.y, this.z + that.z);
    }

    subtract(that: Vector3) {
        return new Vector3(this.x - that.x, this.y - that.y, this.z - that.z);
    }

    scalarMultiply(scalar: number) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    normalize() {
        return new Vector3(this.x / this.magnitude, this.y / this.magnitude, this.z / this.magnitude);
    }
    cross(that: Vector3) {
        return new Vector3(this.y * that.z - this.z * that.y, this.z * that.x - this.x * that.z, this.x * that.y - this.y * that.x);
    }
    
    lerp(vector: Vector3,percent: number) {
        // (1 - percent) * this.x + (percent * vector.x)
        return new Vector3(
            (1 - percent) * this.x + (percent * vector.x),
            (1 - percent) * this.y + (percent * vector.y),
            (1 - percent) * this.z + (percent * vector.z)
        )
    }

    static one() {
        return new Vector3(1, 1, 1);
    }

    static zero() {
        return new Vector3(0, 0, 0);
    }

    toString() {
        return `[${this.x}, ${this.y}, ${this.z}]`;
    }
}