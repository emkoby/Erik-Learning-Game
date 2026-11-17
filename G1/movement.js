// TODO: Fix collision for rotations, improve jump physics

export function handleInput(keys, playerData, levelGrid, deltaTime) {
  const playerSpeed = playerData["speed"];
  const yaw = Math.PI;
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const upY = 1;
  const downY = -1;
  let movementX = 0;
  let movementY = 0;
  let movementZ = 0;
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
  if (keys["Space"]) {
    movementY += upY;
  }
  // Calculate horizontal movement
  const hypoteneuse = Math.hypot(movementX, movementZ);
  if (hypoteneuse > 0) {
    movementX = (movementX / hypoteneuse) * playerSpeed * deltaTime;
    movementZ = (movementZ / hypoteneuse) * playerSpeed * deltaTime;
    ({ movementX, movementY, movementZ } = movementCollisionDetection(
      movementX,
      movementY,
      movementZ,
      playerData,
      levelGrid,
    ));
  }
  // Calculate vertical movement
  if (movementY == 0) {
    movementY += downY;
  }
  movementY = movementY * deltaTime;
  ({ movementX, movementY, movementZ } = movementCollisionDetection(
    movementX,
    movementY,
    movementZ,
    playerData,
    levelGrid,
  ));
  playerData["translation"][0] += movementX;
  playerData["translation"][1] += movementY;
  playerData["translation"][2] += movementZ;
  return playerData;
}

function movementCollisionDetection(
  movementX,
  movementY,
  movementZ,
  playerData,
  levelGrid,
) {
  // Get after movement coordinates
  const afterMovementX = playerData["translation"][0] + movementX;
  const afterMovementY = playerData["translation"][1] + movementY;
  const afterMovementZ = playerData["translation"][2] + movementZ;
  // Check collision
  for (const cube of levelGrid["instances"]) {
    // Check X
    if (movementX !== 0) {
      const playerBoxX = {
        translation: [
          afterMovementX,
          playerData["translation"][1],
          playerData["translation"][2],
        ],
        scale: playerData["scale"],
      };
      if (overlap(playerBoxX, cube)) {
        movementX = 0;
      }
    }
    // Check Y
    if (movementY !== 0) {
      const playerBoxY = {
        translation: [
          playerData["translation"][0],
          afterMovementY,
          playerData["translation"][2],
        ],
        scale: playerData["scale"],
      };
      if (overlap(playerBoxY, cube)) {
        movementY = 0;
      }
    }
    // Check Z
    if (movementZ !== 0) {
      const playerBoxZ = {
        translation: [
          playerData["translation"][0],
          playerData["translation"][1],
          afterMovementZ,
        ],
        scale: playerData["scale"],
      };
      if (overlap(playerBoxZ, cube)) {
        movementZ = 0;
      }
    }
  }
  return { movementX, movementY, movementZ };
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
