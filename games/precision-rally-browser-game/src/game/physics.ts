import {
  CarSpec,
  VehiclePhysicsState,
  TrackStage,
  SurfaceType,
  InputState,
} from '../types/game';

// Surface properties: friction coefficient, rolling resistance, slip buildup
export const SURFACE_PROPERTIES: Record<
  SurfaceType,
  { friction: number; drag: number; roost: number; name: string }
> = {
  tarmac: { friction: 1.15, drag: 1.0, roost: 0.2, name: 'Tarmac' },
  gravel: { friction: 0.74, drag: 1.25, roost: 0.85, name: 'Gravel' },
  mud: { friction: 0.52, drag: 2.1, roost: 0.95, name: 'Deep Mud' },
  snow: { friction: 0.42, drag: 1.4, roost: 0.75, name: 'Packed Snow' },
  ice: { friction: 0.22, drag: 0.9, roost: 0.4, name: 'Black Ice' },
  grass: { friction: 0.38, drag: 2.8, roost: 0.6, name: 'Rough / Off-Track' },
};

export class PhysicsEngine {
  // Find closest point on spline track and current surface
  public static getTrackTelemetry(
    x: number,
    y: number,
    track: TrackStage
  ): {
    surface: SurfaceType;
    distanceAlongTrack: number;
    offsetFromCenter: number;
    trackAngle: number;
    trackWidth: number;
    isOffTrack: boolean;
    isOffCliff: boolean;
    currentElevation: number;
  } {
    const points = track.points;
    let minDistSq = Infinity;
    let closestSegIndex = 0;
    let closestT = 0;

    // Approximate distance along track
    let accumulatedDist = 0;
    let distAtClosest = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const segLenSq = dx * dx + dy * dy;
      const segLen = Math.sqrt(segLenSq);

      let t = 0;
      if (segLenSq > 0) {
        t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / segLenSq));
      }

      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const distSq = (x - projX) * (x - projX) + (y - projY) * (y - projY);

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestSegIndex = i;
        closestT = t;
        distAtClosest = accumulatedDist + t * segLen;
      }

      accumulatedDist += segLen;
    }

    const p1 = points[closestSegIndex];
    const p2 = points[Math.min(points.length - 1, closestSegIndex + 1)];

    const segDx = p2.x - p1.x;
    const segDy = p2.y - p1.y;
    const trackAngle = Math.atan2(segDy, segDx);

    const trackWidth = p1.width * (1 - closestT) + p2.width * closestT;
    const currentElevation = (p1.elevation || 0) * (1 - closestT) + (p2.elevation || 0) * closestT;

    const offsetDist = Math.sqrt(minDistSq);
    const isOffTrack = offsetDist > trackWidth * 0.55;

    // Cross product to determine if we're on left or right of track center
    const cross = (x - p1.x) * segDy - (y - p1.y) * segDx;
    const isLeft = cross > 0;

    let isOffCliff = false;
    if (offsetDist > trackWidth * 0.9) {
      if (isLeft && p1.hazardLeft === 'cliff') isOffCliff = true;
      if (!isLeft && p1.hazardRight === 'cliff') isOffCliff = true;
    }

    // Determine current surface
    let surface: SurfaceType = p1.surface;
    if (isOffTrack) {
      surface = 'grass';
    }

    return {
      surface,
      distanceAlongTrack: distAtClosest,
      offsetFromCenter: offsetDist,
      trackAngle,
      trackWidth,
      isOffTrack,
      isOffCliff,
      currentElevation,
    };
  }

  // Create initial car physics state
  public static createInitialState(
    startX: number = 0,
    startY: number = 0,
    startAngle: number = -Math.PI / 2
  ): VehiclePhysicsState {
    const defaultWheel = {
      x: 0,
      y: 0,
      steerAngle: 0,
      slipAngle: 0,
      angularVelocity: 0,
      skidding: false,
      skidIntensity: 0,
      surface: 'tarmac' as SurfaceType,
      load: 300,
    };

    return {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      speed: 0,
      speedKmh: 0,
      angle: startAngle,
      angularVelocity: 0,
      steerAngle: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
      rpm: 1000,
      gear: 1,
      weightTransferX: 0,
      weightTransferY: 0,
      lateralG: 0,
      longitudinalG: 0,
      driftAngle: 0,
      driftScore: 0,
      isDrifting: false,
      isAirborne: false,
      jumpHeight: 0,
      surfaceCurrent: 'tarmac',
      distanceTravelled: 0,
      wheels: {
        frontLeft: { ...defaultWheel },
        frontRight: { ...defaultWheel },
        rearLeft: { ...defaultWheel },
        rearRight: { ...defaultWheel },
      },
      boostPressure: 0,
      backfireTimer: 0,
      damage: 0,
      offTrackTime: 0,
      isOffCliff: false,
    };
  }

  // Step physics simulation (60-120hz updates)
  public static update(
    state: VehiclePhysicsState,
    car: CarSpec,
    input: InputState,
    track: TrackStage,
    dt: number
  ): {
    impactForce: number;
    jumpLanded: boolean;
    backfired: boolean;
  } {
    let impactForce = 0;
    let jumpLanded = false;
    let backfired = false;

    // 1. Get track surface and boundaries
    const trackInfo = this.getTrackTelemetry(state.x, state.y, track);
    state.surfaceCurrent = trackInfo.surface;
    state.distanceTravelled = trackInfo.distanceAlongTrack;

    if (trackInfo.isOffCliff) {
      state.isOffCliff = true;
    }

    if (trackInfo.isOffTrack) {
      state.offTrackTime += dt;
    } else {
      state.offTrackTime = Math.max(0, state.offTrackTime - dt * 2);
    }

    const surfaceProps = SURFACE_PROPERTIES[state.surfaceCurrent];

    // 2. Steering input smoothing
    const targetSteer = input.steer * (car.handling / 100) * 0.65;
    const steerSpeed = 12.0;
    state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1, dt * steerSpeed);

    state.throttle = input.throttle;
    state.brake = input.brake;
    state.handbrake = input.handbrake;

    // 3. Local coordinate velocities (longitudinal = forward/back, lateral = side slip)
    const cosA = Math.cos(state.angle);
    const sinA = Math.sin(state.angle);

    // Forward unit vector: (cosA, sinA)
    // Right unit vector: (-sinA, cosA)
    const vForward = state.vx * cosA + state.vy * sinA;
    const vLateral = -state.vx * sinA + state.vy * cosA;

    state.speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
    state.speedKmh = Math.round(state.speed * 3.6);

    // 4. Engine & Transmission RPM calculation
    const gearRatios = [3.4, 2.3, 1.6, 1.25, 1.0, 0.82];
    const topSpeedMs = car.topSpeedKmh / 3.6;

    // Auto-shifting logic
    if (state.speedKmh < 35) state.gear = 1;
    else if (state.speedKmh < 70) state.gear = 2;
    else if (state.speedKmh < 115) state.gear = 3;
    else if (state.speedKmh < 155) state.gear = 4;
    else if (state.speedKmh < 195) state.gear = 5;
    else state.gear = 6;

    const currentGearRatio = gearRatios[state.gear - 1];
    const speedRatio = state.speed / topSpeedMs;
    const targetRpm = Math.min(
      8500,
      Math.max(1000, 1000 + speedRatio * currentGearRatio * 7500 + input.throttle * 600)
    );
    state.rpm += (targetRpm - state.rpm) * Math.min(1, dt * 10);

    // 5. Turbo boost buildup
    if (input.throttle > 0.5) {
      const boostRate = 2.0;
      state.boostPressure = Math.min(1.8, state.boostPressure + dt * boostRate * (state.rpm / 6000));
    } else {
      if (state.boostPressure > 0.5 && state.backfireTimer <= 0) {
        state.backfireTimer = 0.25;
        backfired = true;
      }
      state.boostPressure = Math.max(0, state.boostPressure - dt * 4.0);
    }

    if (state.backfireTimer > 0) {
      state.backfireTimer -= dt;
    }

    // 6. Powertrain Forces
    const enginePowerFactor = (car.horsePower / 400) * (car.acceleration / 90);
    const driveForce = input.throttle * 14000 * enginePowerFactor * (1 + state.boostPressure * 0.25);
    const brakeForce = input.brake * 18000;

    // Aerodynamic Drag & Rolling Resistance
    const aeroDrag = 0.42 * state.speed * state.speed;
    const rollingResistance = car.weightKg * 9.81 * 0.015 * surfaceProps.drag;

    // 7. Weight Transfer (Pitch and Roll)
    // Pitch (front/rear): Braking/accel transfers weight
    const rawLongAccel = (driveForce - brakeForce - aeroDrag) / car.weightKg;
    state.longitudinalG = rawLongAccel / 9.81;
    state.weightTransferY +=
      (state.longitudinalG * 0.4 - state.weightTransferY) * Math.min(1, dt * 12);

    // Roll (left/right): Lateral g transfers weight to outside wheels
    state.lateralG = (vForward * state.angularVelocity) / 9.81;
    state.weightTransferX += (state.lateralG * 0.4 - state.weightTransferX) * Math.min(1, dt * 12);

    // Base weight per axle
    const halfWeight = (car.weightKg * 9.81) / 2;
    const frontWeight = halfWeight - state.weightTransferY * halfWeight * 0.6;
    const rearWeight = halfWeight + state.weightTransferY * halfWeight * 0.6;

    // 8. Tire Cornering Forces (Pacejka-inspired slip model)
    const wheelbase = car.dimensions.wheelbase;
    const halfBase = wheelbase / 2;

    // Slip angles of front and rear tires
    const slipAngleFront =
      Math.atan2(vLateral + state.angularVelocity * halfBase, Math.max(1, Math.abs(vForward))) -
      state.steerAngle;
    const slipAngleRear = Math.atan2(
      vLateral - state.angularVelocity * halfBase,
      Math.max(1, Math.abs(vForward))
    );

    // Peak friction coefficient modified by surface
    const mu = surfaceProps.friction * car.gripFactor;

    // Cornering stiffness
    const cornerStiffnessFront = 18000 * mu;
    const cornerStiffnessRear = 18000 * mu;

    // Handbrake effect: instant loss of rear tire grip + severe drag
    let rearGripLoss = 1.0;
    if (input.handbrake) {
      rearGripLoss = 0.22 / car.handbrakePower;
    }

    // Lateral tire forces
    let forceLatFront = -Math.min(
      mu * frontWeight,
      Math.max(-mu * frontWeight, cornerStiffnessFront * slipAngleFront)
    );
    let forceLatRear =
      -Math.min(
        mu * rearWeight * rearGripLoss,
        Math.max(-mu * rearWeight * rearGripLoss, cornerStiffnessRear * slipAngleRear)
      ) * rearGripLoss;

    // Longitudinal forces on front & rear according to drivetrain
    let frontDriveForce = 0;
    let rearDriveForce = 0;

    if (car.drivetrain === 'AWD') {
      frontDriveForce = driveForce * 0.5;
      rearDriveForce = driveForce * 0.5;
    } else if (car.drivetrain === 'RWD') {
      rearDriveForce = driveForce;
    } else if (car.drivetrain === 'FWD') {
      frontDriveForce = driveForce;
    }

    const frontBrakeForce = brakeForce * 0.65;
    const rearBrakeForce = brakeForce * 0.35 + (input.handbrake ? 12000 : 0);

    const forceLongFront = frontDriveForce - frontBrakeForce;
    const forceLongRear = rearDriveForce - rearBrakeForce;

    // Total forces in car frame
    const totalForceLong =
      forceLongRear + forceLongFront * Math.cos(state.steerAngle) - forceLatFront * Math.sin(state.steerAngle) - aeroDrag - rollingResistance * Math.sign(vForward);

    const totalForceLat =
      forceLatRear + forceLatFront * Math.cos(state.steerAngle) + forceLongFront * Math.sin(state.steerAngle);

    // Yaw torque around vertical axis
    const yawTorque =
      forceLatFront * Math.cos(state.steerAngle) * halfBase -
      forceLatRear * halfBase +
      forceLongFront * Math.sin(state.steerAngle) * halfBase;

    // Moment of inertia
    const inertia = (car.weightKg * (car.dimensions.length ** 2 + car.dimensions.width ** 2)) / 12;

    // Angular acceleration
    const angularAccel = (yawTorque / inertia) * car.driftMultiplier;
    state.angularVelocity += angularAccel * dt;

    // Yaw damping
    state.angularVelocity *= Math.pow(0.92, dt * 60);

    // Linear accelerations in car frame
    const accelLong = totalForceLong / car.weightKg;
    const accelLat = totalForceLat / car.weightKg;

    // Transform car frame acceleration to world coordinates
    const worldAx = accelLong * cosA - accelLat * sinA;
    const worldAy = accelLong * sinA + accelLat * cosA;

    state.vx += worldAx * dt;
    state.vy += worldAy * dt;

    // Off-track extra drag
    if (trackInfo.isOffTrack) {
      state.vx *= Math.pow(0.92, dt * 60);
      state.vy *= Math.pow(0.92, dt * 60);
    }

    // Apply motion to position & heading
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    state.angle += state.angularVelocity * dt;

    // 9. Jump & Airborne Physics
    if (track.jumpCrests.length > 0) {
      for (const crestDist of track.jumpCrests) {
        if (
          Math.abs(state.distanceTravelled - crestDist) < 15 &&
          state.speedKmh > 95 &&
          !state.isAirborne
        ) {
          state.isAirborne = true;
          state.jumpHeight = 1.0 + (state.speedKmh / 200) * 2.5;
        }
      }
    }

    if (state.isAirborne) {
      state.jumpHeight -= dt * 3.5;
      if (state.jumpHeight <= 0) {
        state.jumpHeight = 0;
        state.isAirborne = false;
        jumpLanded = true;
      }
    }

    // 10. Drift state & Scoring
    const velocityAngle = Math.atan2(state.vy, state.vx);
    let angleDiff = state.angle - velocityAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    state.driftAngle = Math.abs(angleDiff);
    state.isDrifting = state.driftAngle > 0.25 && state.speedKmh > 30;

    if (state.isDrifting) {
      const driftPoints = Math.round(state.driftAngle * state.speedKmh * 1.5 * dt * 10);
      state.driftScore += driftPoints;
    }

    // 11. Individual Wheels State (for roost particles & skidmarks)
    const halfWidth = car.dimensions.trackWidth / 2;
    const wheels = state.wheels;

    // Wheel positions in world coords
    const updateWheel = (
      wheel: typeof wheels.frontLeft,
      offsetX: number,
      offsetY: number,
      steer: number,
      slip: number,
      load: number
    ) => {
      wheel.x = state.x + offsetX * cosA - offsetY * sinA;
      wheel.y = state.y + offsetX * sinA + offsetY * cosA;
      wheel.steerAngle = state.angle + steer;
      wheel.slipAngle = slip;
      wheel.surface = state.surfaceCurrent;
      wheel.load = load;
      wheel.skidIntensity = Math.min(1.0, Math.abs(slip) * 1.8 + (input.handbrake ? 0.6 : 0));
      wheel.skidding = wheel.skidIntensity > 0.35 && state.speedKmh > 15;
    };

    updateWheel(
      wheels.frontLeft,
      halfBase,
      -halfWidth,
      state.steerAngle,
      slipAngleFront,
      frontWeight / 2 - state.weightTransferX * 100
    );
    updateWheel(
      wheels.frontRight,
      halfBase,
      halfWidth,
      state.steerAngle,
      slipAngleFront,
      frontWeight / 2 + state.weightTransferX * 100
    );
    updateWheel(
      wheels.rearLeft,
      -halfBase,
      -halfWidth,
      0,
      slipAngleRear,
      rearWeight / 2 - state.weightTransferX * 100
    );
    updateWheel(
      wheels.rearRight,
      -halfBase,
      halfWidth,
      0,
      slipAngleRear,
      rearWeight / 2 + state.weightTransferX * 100
    );

    // 12. Obstacle Collisions
    for (let i = 0; i < track.obstacles.length; i++) {
      const obs = track.obstacles[i];
      const dx = state.x - obs.x;
      const dy = state.y - obs.y;
      const dist = Math.hypot(dx, dy);
      const minColDist = obs.radius + 1.8;

      if (dist < minColDist) {
        // Impact collision
        const pushX = (dx / dist) * (minColDist - dist);
        const pushY = (dy / dist) * (minColDist - dist);
        state.x += pushX;
        state.y += pushY;

        // Bounce velocity
        state.vx = -state.vx * 0.4 + pushX * 8;
        state.vy = -state.vy * 0.4 + pushY * 8;
        state.angularVelocity += (Math.random() - 0.5) * 4;

        impactForce = state.speedKmh / 20;
        state.damage = Math.min(100, state.damage + impactForce * 3);
        break;
      }
    }

    return {
      impactForce,
      jumpLanded,
      backfired,
    };
  }
}
