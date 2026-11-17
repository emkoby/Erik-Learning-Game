import { initRender, startRender } from "./render.js";
import { initGeometry } from "./geometry.js";
import { generateLevelData } from "./level.js";
import { handleInput } from "./movement.js";

async function main() {
  // Initialize geometry
  const geometryData = initGeometry();
  // Initialize level layout
  const levelData = generateLevelData(geometryData, 1);
  const init = await initRender(geometryData, levelData);
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
      // Handle player input
      let playerData = levelData["geometry"]["player"]["instances"][0];
      let levelGrid = levelData["geometry"]["levelGrid"];
      handleInput(keys, playerData, levelGrid, deltaTime);
      levelData["geometry"]["player"]["instances"][0] = playerData;
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
