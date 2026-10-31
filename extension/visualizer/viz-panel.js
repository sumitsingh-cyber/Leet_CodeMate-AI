/* CodeMate AI – DSA Visualizer Panel Orchestrator
   Fully synchronized with the active LeetCode problem, actual examples,
   and dynamic approach / pattern switching for ALL LeetCode problems. */

(() => {
  const { createEngine, AnimationPlayer } = window.VizEngine;
  const { renderStep } = window.VizRenderer;
  const { buildControls } = window.VizControls;
  const { buildProblemContext, matchProblem, findAlgorithmById, PROBLEM_REGISTRY } = window.ProblemSync;

  class VizPanel {
    constructor({ container, onBack, onRefreshProblem }) {
      this.container = container;
      this.onBack = onBack;
      this.onRefreshProblem = onRefreshProblem;
      this.ctx = null;
      this.matchedAlgo = null;
      this.activeExampleIndex = 0; // 0 = Ex 1, 1 = Ex 2, -1 = Custom Input
      this.currentInput = {};
      this.player = null;
      this.manualAlgo = null;
    }

    setProblem(rawProblem) {
      this.manualAlgo = null;
      this.ctx = buildProblemContext(rawProblem);
      this.activeExampleIndex = 0;
      this.currentInput = {};
      this.render();
    }

    updateProblem(rawProblem) {
      const newCtx = buildProblemContext(rawProblem);
      if (!this.ctx || !newCtx || this.ctx.slug !== newCtx.slug) {
        this.ctx = newCtx;
        this.manualAlgo = null;
        this.activeExampleIndex = 0;
        this.currentInput = {};
        this.render();
      }
    }

    render() {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }

      // 1. Not a LeetCode problem page
      if (!this.ctx || (!this.ctx.slug && !this.ctx.title && !this.ctx.problemId)) {
        this._renderEmptyState();
        return;
      }

      // 2. Find matching algorithm or use manual selection
      const algo = this.manualAlgo || matchProblem(this.ctx);
      this.matchedAlgo = algo;

      // 3. Render synchronized problem visualizer
      this._renderProblemVisualizer(algo);
    }

    /* ── Render State: Empty / No Problem ─────────────────────── */
    _renderEmptyState() {
      this.container.innerHTML = `
        <div class="viz-view">
          <div class="viz-header">
            <div class="viz-header-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
              <span>Live DSA Visualizer</span>
            </div>
            <button type="button" class="viz-back-btn" id="vizBackBtn">&#8592; Back to AI</button>
          </div>

          <div class="viz-card viz-notice-card">
            <h3 class="viz-notice-title">No LeetCode Problem Detected</h3>
            <p class="viz-notice-text">
              Open any LeetCode problem page (e.g. <em>26. Remove Duplicates</em>, <em>1. Two Sum</em>, <em>704. Binary Search</em>) to see synchronized live visualizations.
            </p>
            <div class="viz-actions" style="margin-top: 10px;">
              <button type="button" class="viz-run-btn" id="vizRefreshPageBtn">
                ↻ Read Active Tab
              </button>
            </div>
          </div>
        </div>
      `;
      this.container.querySelector('#vizBackBtn')?.addEventListener('click', () => this._handleBack());
      this.container.querySelector('#vizRefreshPageBtn')?.addEventListener('click', () => {
        if (this.onRefreshProblem) this.onRefreshProblem();
      });
    }

    /* ── Render State: Synchronized Problem Visualizer ─────────── */
    _renderProblemVisualizer(algo) {
      const examples = this.ctx.examples || [];
      const hasExamples = examples.length > 0;
      const problemTitle = this.ctx.problemId ? `${this.ctx.problemId}. ${this.ctx.title}` : this.ctx.title;

      // Extract input for the selected example
      if (this.activeExampleIndex >= 0 && this.activeExampleIndex < examples.length) {
        const selectedEx = examples[this.activeExampleIndex];
        this.currentInput = JSON.parse(JSON.stringify(selectedEx.parsedInput || {}));
      } else if (this.activeExampleIndex === -1 && Object.keys(this.currentInput).length === 0) {
        this.currentInput = JSON.parse(JSON.stringify(algo.defaultInput || {}));
      } else if (Object.keys(this.currentInput).length === 0) {
        this.currentInput = JSON.parse(JSON.stringify(algo.defaultInput || {}));
      }

      // Ensure input contains the expected properties
      this._normalizeInputForAlgo(algo);

      const activeEx = this.activeExampleIndex >= 0 ? examples[this.activeExampleIndex] : null;

      this.container.innerHTML = `
        <div class="viz-view">
          <!-- Header Bar -->
          <div class="viz-header">
            <div class="viz-header-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
              <span>Live DSA Visualizer</span>
            </div>
            <button type="button" class="viz-back-btn" id="vizBackBtn">&#8592; Back to AI</button>
          </div>

          <!-- Active Problem Info Card -->
          <div class="viz-card viz-problem-card">
            <div class="viz-problem-head">
              <span class="viz-badge viz-badge-live">LIVE LEETCODE SYNC</span>
              <span class="viz-badge">${algo.category}</span>
            </div>
            <h2 class="viz-problem-title">${problemTitle}</h2>
            <div class="viz-problem-meta">
              <span><strong>Pattern:</strong> ${algo.pattern}</span>
              <span>·</span>
              <span><strong>Algorithm:</strong> ${algo.algorithmName}</span>
            </div>

            <!-- Approach / Pattern Switcher -->
            ${algo.availablePatterns && algo.availablePatterns.length > 1 ? `
              <div class="viz-approach-row">
                <span class="viz-approach-label">Approach / Pattern:</span>
                <div class="viz-approach-pills">
                  ${algo.availablePatterns.map(p => `
                    <button type="button" class="viz-approach-btn ${p.id === algo.id ? 'active' : ''}" data-pattern-id="${p.id}">
                      ${p.name}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Example Selector & Input Card -->
          <div class="viz-card">
            <div class="viz-card-title">
              <span>Problem Input</span>
              <span class="viz-badge" id="vizExampleBadge">${this.activeExampleIndex >= 0 ? `Example ${this.activeExampleIndex + 1}` : 'Custom Input'}</span>
            </div>

            <!-- Example Toggle Buttons -->
            <div class="viz-example-pills">
              ${examples.map((ex, idx) => `
                <button type="button" class="viz-pill-btn ${idx === this.activeExampleIndex ? 'active' : ''}" data-example-idx="${idx}">
                  Example ${idx + 1}
                </button>
              `).join('')}
              <button type="button" class="viz-pill-btn ${this.activeExampleIndex === -1 ? 'active' : ''}" data-example-idx="-1">
                Custom Input
              </button>
            </div>

            <!-- Dynamic Input Form -->
            <div class="viz-inputs" id="vizInputsContainer"></div>

            <div class="viz-actions">
              <button type="button" class="viz-run-btn" id="vizRunBtn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Run Visualization
              </button>
              <button type="button" class="viz-random-btn" id="vizRandomBtn" title="Generate random values for this problem">
                Randomize
              </button>
            </div>
          </div>

          <!-- Execution Stage Card -->
          <div class="viz-card">
            <div class="viz-card-title">
              <span>Execution Stage</span>
            </div>

            <!-- Legend -->
            <div class="viz-legend">
              <span class="viz-legend-item"><span class="viz-legend-dot current"></span> Active</span>
              <span class="viz-legend-item"><span class="viz-legend-dot compare"></span> Compare / Visited</span>
              <span class="viz-legend-item"><span class="viz-legend-dot done"></span> Unique / Found</span>
              <span class="viz-legend-item"><span class="viz-legend-dot reject"></span> Duplicate / Rejected</span>
            </div>

            <!-- Variables & State -->
            <div class="viz-vars-panel"></div>

            <!-- Canvas Container -->
            <div class="viz-stage">
              <div class="viz-canvas"></div>
            </div>

            <!-- Expected Output vs Actual Output Comparison -->
            <div class="viz-output-comparison">
              <div class="viz-out-row">
                <span class="viz-out-label">Expected Output:</span>
                <span class="viz-out-val" id="vizExpectedOutput">${activeEx && activeEx.rawOutput ? activeEx.rawOutput : 'Determined by algorithm'}</span>
              </div>
              <div class="viz-out-row">
                <span class="viz-out-label">Actual Output:</span>
                <span class="viz-out-val viz-actual-output-val" id="vizActualOutput">Running...</span>
              </div>
            </div>

            <!-- Animation Controls Panel -->
            <div class="viz-controls-panel"></div>
          </div>
        </div>
      `;

      this._bindEvents(algo);
      this._renderInputFields(algo);
      this.runAnimation();
    }

    _normalizeInputForAlgo(algo) {
      if (!this.currentInput || Object.keys(this.currentInput).length === 0) {
        this.currentInput = JSON.parse(JSON.stringify(algo.defaultInput || {}));
        return;
      }
      if (algo.primaryParam) {
        const p = algo.primaryParam;
        if (this.currentInput[p] === undefined) {
          if (this.currentInput.nums !== undefined) this.currentInput[p] = this.currentInput.nums;
          else if (this.currentInput.numbers !== undefined) this.currentInput[p] = this.currentInput.numbers;
          else if (this.currentInput.array !== undefined) this.currentInput[p] = this.currentInput.array;
          else if (this.currentInput.prices !== undefined) this.currentInput[p] = this.currentInput.prices;
          else if (this.currentInput.head !== undefined) this.currentInput[p] = this.currentInput.head;
          else if (this.currentInput.grid !== undefined) this.currentInput[p] = this.currentInput.grid;
          else if (this.currentInput.matrix !== undefined) this.currentInput[p] = this.currentInput.matrix;
          else if (this.currentInput.root !== undefined) this.currentInput[p] = this.currentInput.root;
          else if (this.currentInput.s !== undefined) this.currentInput[p] = this.currentInput.s;
          else if (this.currentInput.value !== undefined) this.currentInput[p] = this.currentInput.value;
          else if (algo.defaultInput && algo.defaultInput[p] !== undefined) this.currentInput[p] = algo.defaultInput[p];
        }
      }
      if (algo.id.includes('two-sum') || algo.id.includes('binary')) {
        if (this.currentInput.target === undefined) {
          this.currentInput.target = (algo.defaultInput && algo.defaultInput.target !== undefined) ? algo.defaultInput.target : 9;
        }
      }
      if (algo.id.includes('sliding-window') && this.currentInput.k === undefined) {
        this.currentInput.k = (algo.defaultInput && algo.defaultInput.k !== undefined) ? algo.defaultInput.k : 3;
      }
    }

    _bindEvents(algo) {
      this.container.querySelector('#vizBackBtn')?.addEventListener('click', () => this._handleBack());

      // Approach / Pattern switch buttons
      const approachBtns = this.container.querySelectorAll('.viz-approach-btn');
      approachBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const patternId = btn.dataset.patternId;
          const targetAlgo = findAlgorithmById(patternId);
          if (targetAlgo) {
            this.manualAlgo = {
              ...targetAlgo,
              availablePatterns: algo.availablePatterns
            };
            this._normalizeInputForAlgo(this.manualAlgo);
            this.render();
          }
        });
      });

      // Example toggle pills
      const pills = this.container.querySelectorAll('.viz-pill-btn');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          const idx = parseInt(pill.dataset.exampleIdx, 10);
          this.activeExampleIndex = idx;
          if (idx >= 0 && this.ctx.examples[idx]) {
            this.currentInput = JSON.parse(JSON.stringify(this.ctx.examples[idx].parsedInput || {}));
          }
          this._normalizeInputForAlgo(algo);
          this._renderInputFields(algo);
          this._updatePillsUI();
          this.runAnimation();
        });
      });

      // Run button
      this.container.querySelector('#vizRunBtn')?.addEventListener('click', () => {
        this._collectInputs();
        this.runAnimation();
      });

      // Randomize button
      this.container.querySelector('#vizRandomBtn')?.addEventListener('click', () => {
        this._randomizeInputs(algo);
        this.activeExampleIndex = -1; // Switch to custom input
        this._updatePillsUI();
        this._renderInputFields(algo);
        this.runAnimation();
      });
    }

    _updatePillsUI() {
      const pills = this.container.querySelectorAll('.viz-pill-btn');
      pills.forEach(pill => {
        const idx = parseInt(pill.dataset.exampleIdx, 10);
        pill.classList.toggle('active', idx === this.activeExampleIndex);
      });
      const badge = this.container.querySelector('#vizExampleBadge');
      if (badge) {
        badge.textContent = this.activeExampleIndex >= 0 ? `Example ${this.activeExampleIndex + 1}` : 'Custom Input';
      }
      const expOut = this.container.querySelector('#vizExpectedOutput');
      if (expOut) {
        if (this.activeExampleIndex >= 0 && this.ctx.examples[this.activeExampleIndex]) {
          expOut.textContent = this.ctx.examples[this.activeExampleIndex].rawOutput || 'N/A';
        } else {
          expOut.textContent = 'Custom Input (computed by algorithm)';
        }
      }
    }

    _renderInputFields(algo) {
      const box = this.container.querySelector('#vizInputsContainer');
      if (!box) return;
      if (!algo.schema.length) {
        box.innerHTML = '<span style="font-size:11.5px;color:var(--muted)">Using problem-provided data structure.</span>';
        return;
      }
      box.innerHTML = algo.schema.map(f => {
        let val = this.currentInput[f.key];
        if (val === undefined && algo.defaultInput && algo.defaultInput[f.key] !== undefined) {
          val = algo.defaultInput[f.key];
        }
        if (Array.isArray(val)) {
          val = val.map(x => x === null ? 'null' : x).join(', ');
        }
        return `
          <div class="viz-input-group">
            <label>${f.label}</label>
            <input type="text" class="viz-input" data-key="${f.key}" data-type="${f.type}" value="${val !== undefined ? val : ''}">
          </div>
        `;
      }).join('');
    }

    _collectInputs() {
      const inputs = this.container.querySelectorAll('.viz-input');
      inputs.forEach(input => {
        const key = input.dataset.key;
        const type = input.dataset.type;
        const val = input.value.trim();
        if (type === 'array') {
          this.currentInput[key] = val.split(',').map(s => {
            const trimmed = s.trim();
            if (trimmed === 'null') return null;
            const num = Number(trimmed);
            return isNaN(num) ? trimmed : num;
          }).filter(x => x !== '');
        } else if (type === 'number') {
          this.currentInput[key] = Number(val);
        } else {
          this.currentInput[key] = val;
        }
      });
    }

    _randomizeInputs(algo) {
      algo.schema.forEach(f => {
        if (f.type === 'array') {
          const len = 5 + Math.floor(Math.random() * 4);
          const randArr = Array.from({ length: len }, () => 1 + Math.floor(Math.random() * 25));
          if (algo.id.includes('binary') || algo.id.includes('remove-duplicates') || algo.id.includes('two-pointers')) {
            randArr.sort((a, b) => a - b);
          }
          this.currentInput[f.key] = randArr;
        } else if (f.type === 'number') {
          if (f.key === 'target' && Array.isArray(this.currentInput[algo.primaryParam || 'nums'])) {
            const arr = this.currentInput[algo.primaryParam || 'nums'];
            if (arr.length >= 2) {
              const i = Math.floor(Math.random() * arr.length);
              let j = Math.floor(Math.random() * arr.length);
              if (i === j) j = (j + 1) % arr.length;
              this.currentInput[f.key] = arr[i] + arr[j];
            } else {
              this.currentInput[f.key] = 10 + Math.floor(Math.random() * 15);
            }
          } else {
            this.currentInput[f.key] = 1 + Math.floor(Math.random() * 8);
          }
        } else if (f.type === 'string') {
          const samples = ['()[]{}', '([{}])', '()', 'racecar', 'leetcode'];
          this.currentInput[f.key] = samples[Math.floor(Math.random() * samples.length)];
        }
      });
    }

    runAnimation() {
      if (!this.matchedAlgo || !this.matchedAlgo.fn) return;
      if (this.player) this.player.destroy();

      // Ensure input is properly formatted
      this._normalizeInputForAlgo(this.matchedAlgo);

      // Record steps
      const steps = createEngine(this.matchedAlgo.fn, this.currentInput);
      const controlsBox = this.container.querySelector('.viz-controls-panel');

      this.player = new AnimationPlayer(steps, (step) => {
        renderStep(this.container, step, this.matchedAlgo.renderer);
      });

      buildControls(controlsBox, this.player, (step) => {
        renderStep(this.container, step, this.matchedAlgo.renderer);
      });

      this.player.play();
    }

    _handleBack() {
      if (this.player) this.player.pause();
      if (this.onBack) this.onBack();
    }

    destroy() {
      if (this.player) {
        this.player.destroy();
        this.player = null;
      }
    }
  }

  window.VizPanel = VizPanel;
})();
