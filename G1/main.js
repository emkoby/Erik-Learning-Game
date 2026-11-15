import { initRender, startRender } from "./render.js";
import { initGeometry } from "./geometry.js";
import { generateLevelData } from "./level.js";

async function main() {
  // Initialize geometry
  const geometryData = initGeometry();
  // Initialize level layout
  const levelData = generateLevelData(geometryData);
  const init = await initRender(geometryData, levelData);
  // Initialize game state
  // Game loop
  const GAME_STEP = 1 / 60;
  const MAX_FRAME_TIME = 0.25;
  let previousTime = 0;
  let accumulatedTime = 0;
  function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    let deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;
    if (deltaTime > MAX_FRAME_TIME) {
      deltaTime = MAX_FRAME_TIME;
    }

    // Game logic
    accumulatedTime += deltaTime;
    while (accumulatedTime >= GAME_STEP) {
      accumulatedTime -= GAME_STEP;
    }

    // Game rendering
    const ALPHA = Math.min(accumulatedTime / GAME_STEP, 1);
    startRender(init, currentTime, ALPHA);
  }
  requestAnimationFrame((time) => {
    previousTime = time;
    requestAnimationFrame(gameLoop);
  });
}
main();
