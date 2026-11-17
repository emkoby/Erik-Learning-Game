export function generateLevelData(geometryData, level) {
  const levelData = {};
  levelData["name"] = `Level ${level}`;
  let levelGrid, levelKill, levelGoal, levelSpawn;
  if (level === 1) {
    ({ levelGrid, levelKill, levelGoal, levelSpawn } = generateLevelGrid1(
      10,
      10,
    ));
  } else if (level === 2) {
    ({ levelGrid, levelKill, levelGoal, levelSpawn } = generateLevelGrid2(
      10,
      10,
    ));
  } else if (level === 3) {
    ({ levelGrid, levelKill, levelGoal, levelSpawn } = generateLevelGrid3(
      16,
      10,
    ));
  } else {
    levelData["name"] = `Level End`;
    ({ levelGrid, levelKill, levelGoal, levelSpawn } = generateLevelGridEnd(
      15,
      10,
    ));
  }
  levelData["levelSpawn"] = levelSpawn;
  levelData["geometry"] = {
    levelGrid: {
      shape: geometryData["cube"],
      instances: levelGrid,
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
          speed: 3.0,
          jumpStrength: 5.0,
          jumpTime: 0,
        },
      ],
    },
  };
  return levelData;
}

function generateLevelGrid1(width, length) {
  const levelGrid = [];
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
  return { levelGrid, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid2(width, length) {
  const levelGrid = [];
  const levelKill = [];
  const levelSpawn = [0, 4, 0];
  const levelGoal = [Math.ceil(width / 3) * 3 - 3, 5, length - 1];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      if (x % 3 === 0) {
        levelGrid.push({
          translation: [x, 1.5, z],
          rotation: [0, 0, 0],
          scale: [1, 3, 1],
          color: [0.5 + (x + z) * 0.05, 0.5 + z * 0.05, 0.5, 1],
        });
      }
    }
  }
  // Set kill box
  levelKill.push({
    translation: [0, -1, 0],
    rotation: [0, 0, 0],
    scale: [width * 10, 1, length * 10],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelKill, levelGoal, levelSpawn };
}

function generateLevelGrid3(width, length) {
  const levelGrid = [];
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
  return { levelGrid, levelKill, levelGoal, levelSpawn };
}

function generateLevelGridEnd(width, length) {
  const levelGrid = [];
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
  return { levelGrid, levelKill, levelGoal, levelSpawn };
}
