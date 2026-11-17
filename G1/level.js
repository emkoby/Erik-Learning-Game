export function generateLevelData(geometryData, level) {
  const levelData = {};
  levelData["name"] = `Level ${level}`;
  const { levelGrid, spawnPoint } = generateLevelGrid1(geometryData, 10, 10);
  levelData["geometry"] = {
    levelGrid: {
      shape: geometryData["cube"],
      instances: levelGrid,
    },
    player: {
      shape: geometryData["pyramid"],
      instances: [
        {
          translation: spawnPoint,
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: [1, 1, 1, 1],
          speed: 0.5,
        },
      ],
    },
  };
  return levelData;
}

function generateLevelGrid1(geometryData, width, length) {
  const levelGrid = [];
  const spawnPoint = [0, 1, 0];
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < length; z++) {
      levelGrid.push({
        translation: [x, 0, z],
        rotation: [0, 0, 0],
        scale: [1, 1 + z, 1],
        color: [0.5 + x * 0.05, 0.5, 0.5 + z * 0.05, 1],
      });
    }
  }
  return { levelGrid, spawnPoint };
}
