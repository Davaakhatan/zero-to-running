/**
 * Performance monitoring utilities
 */

export class FPSMonitor {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 60;
  private callback: ((fps: number) => void) | null = null;

  start(callback: (fps: number) => void) {
    this.callback = callback;
    this.animate();
  }

  private animate = () => {
    const currentTime = performance.now();
    this.frames++;

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime));
      this.frames = 0;
      this.lastTime = currentTime;
      
      if (this.callback) {
        this.callback(this.fps);
      }
    }

    requestAnimationFrame(this.animate);
  };

  stop() {
    this.callback = null;
  }

  getFPS() {
    return this.fps;
  }
}

export function measureLatency(startTime: number): number {
  return performance.now() - startTime;
}

export function generateRandomPosition(maxWidth: number, maxHeight: number) {
  return {
    x: Math.random() * (maxWidth - 200) + 100,
    y: Math.random() * (maxHeight - 200) + 100,
  };
}

