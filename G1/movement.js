// TODO: Fix collision for rotations

const MovementStatus = Object.freeze({
  STANDING: "STANDING",
  JUMPING1: "JUMPING1",
  JUMPING2: "JUMPING2",
  JUMPING3: "JUMPING3",
  FALLING: "FALLING",
});
const EPSILON = 0.0001;

export function handleInput(keys, levelData, deltaTime) {
  const playerData = levelData["geometry"]["player"]["instances"][0];
  const levelGrid = levelData["geometry"]["levelGrid"];
  const levelKill = levelData["geometry"]["levelKill"];
  const levelGoal = levelData["geometry"]["levelGoal"];
  if (!playerData["status"]) {
    playerData["status"] = MovementStatus.STANDING;
  }
  const playerSpeed = playerData["speed"];
  const playerJumpStrength = playerData["jumpStrength"];
  const gravity = 7;
  const yaw = Math.atan2(0, -5);
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const upY = 1;
  const downY = -1;
  let movementX = 0;
  let movementY = 0;
  let movementZ = 0;
  let hitKill = false;
  let hitGoal = false;
  if (keys["KeyW"]) {
    movementX += forwardX;
    movementZ += forwardZ;
  }
  if (keys["KeyS"]) {
    movementX -= forwardX;
    movementZ -= forwardZ;
  }
  if (keys["KeyA"]) {
    movementX -= rightX;
    movementZ -= rightZ;
  }
  if (keys["KeyD"]) {
    movementX += rightX;
    movementZ += rightZ;
  }
  switch (playerData["status"]) {
    case MovementStatus.STANDING:
      if (keys["Space"]) {
        playerData["status"] = MovementStatus.JUMPING1;
        movementY += upY * playerJumpStrength;
      } else {
        movementY += downY * gravity;
      }
      break;
    case MovementStatus.JUMPING1:
      playerData["jumpTime"] += deltaTime;
      if (playerData["jumpTime"] >= 0.1) {
        playerData["status"] = MovementStatus.JUMPING2;
      }
      movementY += upY * playerJumpStrength * 1.2;
      break;
    case MovementStatus.JUMPING2:
      playerData["jumpTime"] += deltaTime;
      if (playerData["jumpTime"] >= 0.3) {
        if (keys["Space"]) {
          playerData["status"] = MovementStatus.JUMPING3;
        } else {
          playerData["status"] = MovementStatus.FALLING;
        }
      }
      movementY += upY * playerJumpStrength;
      break;
    case MovementStatus.JUMPING3:
      playerData["jumpTime"] += deltaTime;
      if (playerData["jumpTime"] >= 0.5) {
        playerData["status"] = MovementStatus.FALLING;
      }
      movementY += upY * playerJumpStrength * 0.8;
      break;
    case MovementStatus.FALLING:
      playerData["jumpTime"] = 0;
      movementY += downY * gravity;
      break;
  }
  // Calculate horizontal movement
  const hypoteneuse = Math.hypot(movementX, movementZ);
  if (hypoteneuse > 0) {
    movementX = (movementX / hypoteneuse) * playerSpeed * deltaTime;
    movementZ = (movementZ / hypoteneuse) * playerSpeed * deltaTime;
  }
  // Calculate vertical movement
  movementY = movementY * deltaTime;
  // Perform collision detection after calculating final movement values
  ({ movementX, movementY, movementZ, hitKill, hitGoal } =
    movementCollisionDetection(
      movementX,
      movementY,
      movementZ,
      playerData,
      levelGrid,
      levelKill,
      levelGoal,
    ));
  // If player hit killbox, reset
  if (hitKill) {
    resetPlayer(playerData, levelData["levelSpawn"]);
    return;
  }
  // If player hit goal, set hitGoal to true
  if (hitGoal) {
    return hitGoal;
  }
  // If the player is moving downwards, set status to FALLING
  if (movementY < 0) {
    playerData["status"] = MovementStatus.FALLING;
  }
  playerData["translation"][0] += movementX;
  playerData["translation"][1] += movementY;
  playerData["translation"][2] += movementZ;
  return false;
}

function movementCollisionDetection(
  movementX,
  movementY,
  movementZ,
  playerData,
  levelGrid,
  levelKill,
  levelGoal,
) {
  const startPosition = playerData.translation;
  const workingPosition = startPosition;
  const scale = playerData.scale;
  const cubes = levelGrid.instances;
  const killBoxes = levelKill.instances;
  const goalBoxes = levelGoal.instances;
  // Check X
  const {
    hit: hitX,
    hitKill: hitKillX,
    hitGoal: hitGoalX,
  } = resolveAxis(
    workingPosition,
    0,
    movementX,
    scale,
    cubes,
    killBoxes,
    goalBoxes,
  );
  // Check Z
  const {
    hit: hitZ,
    hitKill: hitKillZ,
    hitGoal: hitGoalZ,
  } = resolveAxis(
    workingPosition,
    2,
    movementZ,
    scale,
    cubes,
    killBoxes,
    goalBoxes,
  );
  // Check Y
  const {
    hit: hitY,
    hitKill: hitKillY,
    hitGoal: hitGoalY,
  } = resolveAxis(
    workingPosition,
    1,
    movementY,
    scale,
    cubes,
    killBoxes,
    goalBoxes,
  );
  // Land when moving down
  if (hitY && movementY < 0 && playerData.status === MovementStatus.FALLING) {
    playerData.status = MovementStatus.STANDING;
  }
  return {
    movementX: workingPosition[0] - startPosition[0],
    movementY: workingPosition[1] - startPosition[1],
    movementZ: workingPosition[2] - startPosition[2],
    hitKill: hitKillX || hitKillZ || hitKillY,
    hitGoal: hitGoalX || hitGoalZ || hitGoalY,
  };
}

function resolveAxis(
  workingPosition,
  axis,
  move,
  scale,
  cubes,
  killBoxes,
  goalBoxes,
) {
  let hit = false;
  let hitKill = false;
  let hitGoal = false;
  if (move === 0) return { hit: false, hitKill: false, hitGoal: false };
  workingPosition[axis] += move;
  for (const cube of cubes) {
    if (overlap({ translation: workingPosition, scale }, cube)) {
      hit = true;
      const halfSum = (scale[axis] + cube.scale[axis]) / 2 + EPSILON;
      workingPosition[axis] =
        move > 0
          ? cube.translation[axis] - halfSum
          : cube.translation[axis] + halfSum;
    }
  }
  for (const killBox of killBoxes) {
    if (overlap({ translation: workingPosition, scale }, killBox)) {
      hitKill = true;
    }
  }
  for (const goalBox of goalBoxes) {
    if (overlap({ translation: workingPosition, scale }, goalBox)) {
      hitGoal = true;
    }
  }
  return { hit, hitKill, hitGoal };
}

function overlap(box1, box2) {
  const collision =
    // Check X
    Math.abs(box1.translation[0] - box2.translation[0]) <
      (box1.scale[0] + box2.scale[0]) / 2 &&
    // Check Y
    Math.abs(box1.translation[1] - box2.translation[1]) <
      (box1.scale[1] + box2.scale[1]) / 2 &&
    // Check Z
    Math.abs(box1.translation[2] - box2.translation[2]) <
      (box1.scale[2] + box2.scale[2]) / 2;
  return collision;
}

function resetPlayer(playerData, levelSpawn) {
  playerData["translation"] = [levelSpawn[0], levelSpawn[1], levelSpawn[2]];
  playerData["rotation"] = [0, 0, 0];
  playerData["scale"] = [1, 1, 1];
  playerData["status"] = MovementStatus.STANDING;
}
