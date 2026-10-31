/* CodeMate AI – DSA Visualizer Engine
   Pure deterministic step recorder + animation player.
   No eval(), no dynamic code execution, no API calls. */

(() => {
  /* ── Step Recorder ─────────────────────────────────────────── */
  class StepRecorder {
    constructor() { this.steps = []; }
    record(state, action, message, highlights = {}) {
      this.steps.push({ state: JSON.parse(JSON.stringify(state)), action, message, highlights });
    }
    getSteps() { return this.steps; }
    reset() { this.steps = []; }
  }

  /* ── Animation Player ──────────────────────────────────────── */
  class AnimationPlayer {
    constructor(steps, onStep) {
      this.steps = steps;
      this.onStep = onStep;
      this.index = 0;
      this.speed = 1;
      this.playing = false;
      this._timer = null;
    }
    get current() { return this.steps[this.index] || null; }
    get total() { return this.steps.length; }
    get isFirst() { return this.index === 0; }
    get isLast() { return this.index >= this.steps.length - 1; }

    _delay() { return Math.max(80, Math.round(800 / this.speed)); }

    _tick() {
      if (!this.playing) return;
      if (this.isLast) { this.playing = false; this._notify(); return; }
      this.index++;
      this._notify();
      this._timer = setTimeout(() => this._tick(), this._delay());
    }

    _notify() { if (this.onStep) this.onStep(this.current, this.index, this.total); }

    play() {
      if (this.playing || this.isLast) return;
      this.playing = true;
      this._notify();
      this._timer = setTimeout(() => this._tick(), this._delay());
    }
    pause() {
      this.playing = false;
      clearTimeout(this._timer);
      this._notify();
    }
    resume() {
      if (!this.playing && !this.isLast) this.play();
    }
    next() {
      if (this.isLast) return;
      this.pause();
      this.index++;
      this._notify();
    }
    prev() {
      if (this.isFirst) return;
      this.pause();
      this.index--;
      this._notify();
    }
    reset() {
      this.pause();
      this.index = 0;
      this._notify();
    }
    restart() { this.reset(); this.play(); }
    setSpeed(s) { this.speed = s; }
    jumpTo(i) {
      this.pause();
      this.index = Math.max(0, Math.min(i, this.steps.length - 1));
      this._notify();
    }
    destroy() { this.pause(); this.onStep = null; }
  }

  /* ── Factory ───────────────────────────────────────────────── */
  function createEngine(algorithmFn, input) {
    const recorder = new StepRecorder();
    algorithmFn(input, recorder);
    const steps = recorder.getSteps();
    if (!steps.length) recorder.record({}, 'done', 'Algorithm complete (no steps recorded).');
    return steps;
  }

  window.VizEngine = { StepRecorder, AnimationPlayer, createEngine };
})();

