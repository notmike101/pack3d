import type { Scene } from "@babylonjs/core/scene";

export const waitFor = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const waitFrames = (frames: number, scene: Scene) => {
  return new Promise<void>((resolve, reject) => {
    if (!scene) reject();
    if (frames <= 0) resolve();

    let waitedFrames = 0;

    const frameRenderCallback = () => {
      waitedFrames += 1;

      if (waitedFrames >= frames) {
        scene.onAfterRenderObservable.removeCallback(frameRenderCallback);

        resolve();
      }
    };

    scene.onAfterRenderObservable.add(frameRenderCallback);
  });
};
