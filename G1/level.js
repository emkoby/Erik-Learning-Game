export function generateLevelData(geometryData, level) {
  const levelData = {};
  levelData["name"] = `Level ${level}`;
  const { levelGrid, levelKill, levelGoal, levelSpawn } = generateLevelGrid1(
    10,
    10,
  );
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
    goal: {
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
          scale: [1, 1, 1],
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
  const levelGoal = [9, 11, 9];
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
    scale: [100, 1, 100],
    color: [0.5, 0.5, 0.5, 0],
  });
  return { levelGrid, levelKill, levelGoal, levelSpawn };
}
