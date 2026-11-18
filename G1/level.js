export function generateLevelData(geometryData, level) {
  const levelData = {};
  levelData["name"] = `Level ${level}`;
  let levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn;
  if (level === 1) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid1(5, 5));
  } else if (level === 2) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid2(10, 5));
  } else if (level === 3) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid3(16, 10));
  } else if (level === 4) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid4(5, 15));
  } else if (level === 5) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid5(3, 20));
  } else if (level === 6) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid6(10, 10));
  } else if (level === 7) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid7(10, 10));
  } else if (level === 8) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid8(10, 10));
  } else if (level === 9) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid9(10, 10));
  } else if (level === 10) {
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGrid10(10, 10));
  } else {
    levelData["name"] = `Level End`;
    ({ levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn } =
      generateLevelGridEnd(5, 5));
  }
  levelData["levelSpawn"] = levelSpawn;
  levelData["geometry"] = {
    levelGrid: {
      shape: geometryData["cube"],
      instances: levelGrid,
    },
    levelGridMove: {
      shape: geometryData["cube"],
      instances: levelGridMove,
    },
    levelKill: {
      shape: geometryData["cube"],
      instances: levelKill,
    },
    levelGoal: {
      shape: geometryData["pyramid"],
      instances: [
        {
          translation: levelGoal,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: [0, 1, 0, 0.5],
        },
      ],
    },
    player: {
      shape: geometryData["pyramid"],
      instances: [
        {
          translation: [levelSpawn[0], levelSpawn[1], levelSpawn[2]],
          rotation: [0, 0, 0],
          scale: [0.7, 0.7, 0.7],
          color: [1, 1, 1, 1],
          status: "STANDING",
          speed: 3.0,
          jumpStrength: 5.0,
          jumpTime: 0,
          standingOn: null,
        },
      ],
    },
  };
  return levelData;
}

export function updateLevelGeometry(levelData, deltaTime) {
  for (const instance of levelData["geometry"]["levelGridMove"]["instances"]) {
    const velocity = instance.movement[0];
    const positionOne = instance.movement[1];
    const positionTwo = instance.movement[2];
    // Check movement progress and switch direction if needed
    if (
      instance.translation[0] <= positionOne[0] ||
      instance.translation[0] >= positionTwo[0]
    ) {
      instance.movement[0][0] = instance.movement[0][0] * -1;
      instance.movement[0][1] = instance.movement[0][1] * -1;
      instance.movement[0][2] = instance.movement[0][2] * -1;
    }
    // Apply movement
    instance.previousTranslation = instance.translation;
    instance.translation = [
      instance.translation[0] + velocity[0] * deltaTime,
      instance.translation[1] + velocity[1] * deltaTime,
      instance.translation[2] + velocity[2] * deltaTime,
    ];
  }
}

function generateLevelGrid1(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 1, 0];
  const levelGoal = [width - 1, 1 + (width + length) / 2, length - 1];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      levelGrid.push({
        translation: [x, (x + z) / 4, z],
        rotation: [0, 0, 0],
        scale: [1, 1 + (x + z) / 2, 1],
        color: [0.5 + x * 0.05, 0.5, 0.5 + z * 0.05, 1],
      });
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid2(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 4, 0];
  let maxX = 0;
  let maxZ = 0;
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      if (x % 3 === 0) {
        if (x > maxX) maxX = x;
        if (z > maxZ) maxZ = z;
        levelGrid.push({
          translation: [x, 1.5, z],
          rotation: [0, 0, 0],
          scale: [1, 3, 1],
          color: [0.5 + (x + z) * 0.05, 0.5 + z * 0.05, 0.5, 1],
        });
      }
    }
  }
  const levelGoal = [maxX, 5, maxZ];
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid3(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [1, 4, 1];
  let maxX = 0;
  let maxZ = 0;
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      if (Math.sin(x) > 0) {
        if (Math.sin(z) > 0) {
          if (x > maxX) maxX = x;
          if (z > maxZ) maxZ = z;
          levelGrid.push({
            translation: [x, 1.5, z],
            rotation: [0, 0, 0],
            scale: [1, 3, 1],
            color: [0.5, 0.5 + (x + z) * 0.05, 0.5 + z * 0.05, 1],
            movement: [0, [0, 0, 0], [0, 0, 0]],
          });
        }
      }
    }
  }
  const levelGoal = [maxX, 5, maxZ];
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid4(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 4, 0];
  let maxX = 0;
  let maxZ = 0;
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      if (z % 6 === 0) {
        if (x > maxX) maxX = x;
        if (z > maxZ) maxZ = z;
        levelGrid.push({
          translation: [x, 1.5, z],
          rotation: [0, 0, 0],
          scale: [1, 3, 1],
          color: [0.5 + x * 0.05, 0.5 + z * 0.05, 0.5 + z * 0.05, 1],
        });
        if (x === width / 2 && z + 5 < length) {
          levelGridMove.push({
            translation: [x, 2.5, z + 3],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            color: [0.5 + x * 0.05, 0.5 + z * 0.05, 0.5 + z * 0.05, 1],
            movement: [
              [-2, 0, 0],
              [0, 2.5, z + 3],
              [width - 1, 2.5, z + 3],
            ],
          });
        }
      }
    }
  }
  const levelGoal = [maxX, 5, maxZ];
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid5(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [Math.floor(width / 2), 4, 0];
  let maxX = 0;
  let maxZ = 0;
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      if (x > width / 2 - 3 && x < width / 2 + 3) {
        if (x > maxX) maxX = x;
        if (z > maxZ) maxZ = z;
        levelGrid.push({
          translation: [x, 1.5, z],
          rotation: [0, 0, 0],
          scale: [1, 3, 1],
          color: [0, 0.7 + z * 0.01, 0.9 - (x + z) * 0.05, 1],
        });
      }
      if (x === 0 && z > 1 && z % 3 === 0) {
        levelGridMove.push({
          translation: [x - 1, 4.5, z],
          rotation: [0, 0, 0],
          scale: [1, 3, 1],
          color: [0.5 + x * 0.05, 0.5 + z * 0.05, 0.5 + z * 0.05, 1],
          movement: [
            [-5, 0, 0],
            [-1, 4.5, z],
            [width, 4.5, z],
          ],
        });
      }
    }
  }
  const levelGoal = [Math.floor(width / 2), 5, maxZ];
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid6(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 1, 0];
  const levelGoal = [width - 1, 1 + (width + length) / 2, length - 1];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      levelGrid.push({
        translation: [x, (x + z) / 4, z],
        rotation: [0, 0, 0],
        scale: [1, 1 + (x + z) / 2, 1],
        color: [0.5 + x * 0.05, 0.5, 0.5 + z * 0.05, 1],
      });
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid7(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 1, 0];
  const levelGoal = [width - 1, 1 + (width + length) / 2, length - 1];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      levelGrid.push({
        translation: [x, (x + z) / 4, z],
        rotation: [0, 0, 0],
        scale: [1, 1 + (x + z) / 2, 1],
        color: [0.5 + x * 0.05, 0.5, 0.5 + z * 0.05, 1],
      });
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid8(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 1, 0];
  const levelGoal = [width - 1, 1 + (width + length) / 2, length - 1];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      levelGrid.push({
        translation: [x, (x + z) / 4, z],
        rotation: [0, 0, 0],
        scale: [1, 1 + (x + z) / 2, 1],
        color: [0.5 + x * 0.05, 0.5, 0.5 + z * 0.05, 1],
      });
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid9(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 1, 0];
  const levelGoal = [width - 1, 1 + (width + length) / 2, length - 1];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      levelGrid.push({
        translation: [x, (x + z) / 4, z],
        rotation: [0, 0, 0],
        scale: [1, 1 + (x + z) / 2, 1],
        color: [0.5 + x * 0.05, 0.5, 0.5 + z * 0.05, 1],
      });
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid10(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 1, 0];
  const levelGoal = [width - 1, 1 + (width + length) / 2, length - 1];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      levelGrid.push({
        translation: [x, (x + z) / 4, z],
        rotation: [0, 0, 0],
        scale: [1, 1 + (x + z) / 2, 1],
        color: [0.5 + x * 0.05, 0.5, 0.5 + z * 0.05, 1],
      });
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}
function generateLevelGridEnd(width, length) {
  const levelGrid = [];
  const levelGridMove = [];
  const levelKill = [];
  const levelSpawn = [0, 1, 0];
  const levelGoal = [0, 2, length / 3];
  for (let x = -(width / 2); x < width; x++) {
    for (let z = -(length / 2); z < length; z++) {
      levelGrid.push({
        translation: [x, 0, z],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: [0.1, 0.1, 0.1, 1],
      });
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelGridMove, levelKill, levelGoal, levelSpawn };
}
