import { initRender, loadLevelGraphics, startRender } from "./render.js";
import { initGeometry } from "./geometry.js";
import { generateLevelData, updateLevelGeometry } from "./level.js";
import { handleInput } from "./movement.js";

async function main() {
  // Initialize geometry
  const geometryData = initGeometry();
  // Initialize level layout and graphics
  const init = await initRender();
  let levelNumber = 1;
  let levelData = generateLevelData(geometryData, levelNumber);
  let levelGraphics = await loadLevelGraphics(init, geometryData, levelData);
  let hitGoal = false;
  // Initialize game state
  // Start key listeners
  const keys = {};
  const releaseTimers = {};
  const DEBOUNCE_MS = 40;
  window.addEventListener("keydown", (e) => {
    clearTimeout(releaseTimers[e.code]);
    keys[e.code] = true;
  });
  window.addEventListener("keyup", (e) => {
    clearTimeout(releaseTimers[e.code]);
    releaseTimers[e.code] = setTimeout(() => {
      keys[e.code] = false;
    }, DEBOUNCE_MS);
  });
  window.addEventListener("blur", () => {
    for (const k in releaseTimers) clearTimeout(releaseTimers[k]);
    for (const k in keys) keys[k] = false;
  });
  // Game loop
  const GAME_STEP = 1 / 60;
  const MAX_FRAME_TIME = 0.25;
  let previousTime = 0;
  let accumulatedTime = 0;
  async function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    let deltaTime = (currentTime - previousTime) / 1000;
    previousTime = currentTime;
    if (deltaTime > MAX_FRAME_TIME) {
      deltaTime = MAX_FRAME_TIME;
    }
    // If goal completed, move to next level
    if (hitGoal) {
      if (levelData["name"] !== "Level End") {
        levelNumber++;
      } else {
        levelNumber = 1;
      }
      levelData = generateLevelData(geometryData, levelNumber);
      levelGraphics = await loadLevelGraphics(init, geometryData, levelData);
      hitGoal = false;
    }
    // Game logic
    accumulatedTime += deltaTime;
    while (accumulatedTime >= GAME_STEP) {
      // Handle player input
      hitGoal = handleInput(keys, levelData, deltaTime);
      updateLevelGeometry(levelData, deltaTime);
      accumulatedTime -= GAME_STEP;
    }
    // Game rendering
    const ALPHA = Math.min(accumulatedTime / GAME_STEP, 1);
    startRender(init, levelGraphics, currentTime, ALPHA);
  }
  requestAnimationFrame((time) => {
    previousTime = time;
    requestAnimationFrame(gameLoop);
  });
}
main();
