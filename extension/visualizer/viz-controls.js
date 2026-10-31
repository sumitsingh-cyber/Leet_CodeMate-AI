/* CodeMate AI – DSA Visualizer Controls
   Creates and manages the animation control panel. */

(() => {
  function buildControls(container, player, onUpdate) {
    container.innerHTML = `
      <div class="viz-controls">
        <div class="viz-ctrl-row">
          <button class="viz-btn" id="vcPrev" title="Previous step">&#9664;&#9664;</button>
          <button class="viz-btn viz-btn-primary" id="vcPlay" title="Play / Pause">&#9654;</button>
          <button class="viz-btn" id="vcNext" title="Next step">&#9654;&#9654;</button>
          <button class="viz-btn" id="vcReset" title="Reset">&#8635;</button>
        </div>
        <div class="viz-ctrl-row">
          <label class="viz-lbl">Speed</label>
          <select id="vcSpeed" class="viz-select">
            <option value="0.25">0.25×</option>
            <option value="0.5">0.5×</option>
            <option value="1" selected>1×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
          <span class="viz-step-counter" id="vcCounter">Step 0 / 0</span>
        </div>
        <input type="range" id="vcTimeline" class="viz-timeline" min="0" value="0" step="1">
        <div class="viz-message-row" id="vcMessage"></div>
      </div>`;

    const vcPlay    = container.querySelector('#vcPlay');
    const vcPrev    = container.querySelector('#vcPrev');
    const vcNext    = container.querySelector('#vcNext');
    const vcReset   = container.querySelector('#vcReset');
    const vcSpeed   = container.querySelector('#vcSpeed');
    const vcCounter = container.querySelector('#vcCounter');
    const vcTimeline = container.querySelector('#vcTimeline');
    const vcMessage = container.querySelector('#vcMessage');

    vcTimeline.max = String(player.total - 1);

    function refreshUI() {
      const playing = player.playing;
      vcPlay.innerHTML = playing ? '&#9646;&#9646;' : '&#9654;';
      vcPlay.title = playing ? 'Pause' : 'Play';
      vcPrev.disabled = player.isFirst;
      vcNext.disabled = player.isLast;
      vcCounter.textContent = `Step ${player.index + 1} / ${player.total}`;
      vcTimeline.value = String(player.index);
      const cur = player.current;
      vcMessage.textContent = cur ? (cur.message || '') : '';
    }

    player.onStep = (step, idx, total) => {
      refreshUI();
      if (onUpdate) onUpdate(step, idx, total);
    };

    vcPlay.addEventListener('click', () => {
      if (player.playing) player.pause(); else player.resume();
    });
    vcPrev.addEventListener('click', () => player.prev());
    vcNext.addEventListener('click', () => player.next());
    vcReset.addEventListener('click', () => { player.reset(); refreshUI(); if (onUpdate) onUpdate(player.current, 0, player.total); });
    vcSpeed.addEventListener('change', () => player.setSpeed(parseFloat(vcSpeed.value)));
    vcTimeline.addEventListener('input', () => {
      player.jumpTo(parseInt(vcTimeline.value, 10));
    });

    refreshUI();
    // trigger initial render
    if (onUpdate) onUpdate(player.current, player.index, player.total);
  }

  window.VizControls = { buildControls };
})();

