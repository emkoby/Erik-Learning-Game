export function generateLevelData(geometryData) {
  const levelData = {};
  levelData["geometry"] = {
    triangle: {
      shape: geometryData["triangle"],
      instances: [
        {
          offset: [-0.9, 0.9, 0],
          scale: [0.3, 0.3, 1],
          color: [1, 0, 0, 1],
        },
      ],
    },
    square: {
      shape: geometryData["square"],
      instances: [
        {
          offset: [0, 0, 0],
          scale: [0.6, 0.6, 1],
          color: [0, 1, 0, 1],
        },
        {
          offset: [0.9, -0.9, 0],
          scale: [0.9, 0.9, 1],
          color: [0, 0, 1, 1],
        },
      ],
    },
  };
  return levelData;
}
