export function generateLevelData(geometryData) {
  const levelData = {};
  levelData["geometry"] = {
    cube: {
      shape: geometryData["cube"],
      instances: [
        {
          translation: [-0.9, 0.9, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: [0, 1, 0, 1],
        },
      ],
    },
  };
  return levelData;
}
