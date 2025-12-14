<script setup>
import { computed } from 'vue'
import Badge from 'primevue/badge'

const props = defineProps({
  score: {
    type: Number,
    required: true
  },
  breakdown: {
    type: Object,
    required: false,
    default: () => ({ green: 0, orange: 0, red: 0, critical: 0 })
  }
})

// Circle progress calculation
const circumference = 2 * Math.PI * 70 // r=70

const strokeDashoffset = computed(() => {
  const progress = props.score / 100
  return circumference - progress * circumference
})

// Dynamic score color based on value (WCAG 2.1 AA compliant - T058)
const scoreColor = computed(() => {
  if (props.score >= 80) {
    return 'var(--p-green-500)'
  } // Optimal
  if (props.score >= 60) {
    return 'var(--p-orange-500)'
  } // Acceptable
  if (props.score >= 40) {
    return 'var(--p-yellow-600)'
  } // Fair
  return 'var(--p-red-500)' // Poor
})

// Score description
function getScoreDescription(score) {
  if (score >= 90) {
    return 'Excellent meeting time for all participants'
  }
  if (score >= 75) {
    return 'Good meeting time with minor compromises'
  }
  if (score >= 60) {
    return 'Acceptable meeting time with some conflicts'
  }
  if (score >= 40) {
    return 'Challenging meeting time for several participants'
  }
  return 'Poor meeting time - consider finding a better slot'
}
</script>

<template>
  <div class="equity-score-card">
    <div class="card-header">
      <h3 class="card-title">Meeting Equity Score</h3>
      <i
        class="pi pi-info-circle text-gray-400"
        title="Fairness score based on participant timezones"
      ></i>
    </div>

    <div class="score-display">
      <div class="score-circle">
        <svg class="progress-ring" width="160" height="160">
          <circle
            class="progress-ring-background"
            stroke="var(--p-surface-300)"
            stroke-width="12"
            fill="transparent"
            r="70"
            cx="80"
            cy="80"
          />
          <circle
            class="progress-ring-progress"
            :stroke="scoreColor"
            stroke-width="12"
            fill="transparent"
            r="70"
            cx="80"
            cy="80"
            :stroke-dasharray="`${circumference} ${circumference}`"
            :stroke-dashoffset="strokeDashoffset"
          />
        </svg>
        <div class="score-text">
          <span class="score-value">{{ Math.round(score) }}</span>
          <span class="score-label">/ 100</span>
        </div>
      </div>

      <div class="score-description">
        <p class="score-subtitle">{{ getScoreDescription(score) }}</p>
      </div>
    </div>

    <div class="breakdown-section">
      <h4 class="breakdown-title">Participant Breakdown</h4>
      <div class="breakdown-grid">
        <div class="breakdown-item">
          <Badge value="Optimal" severity="success" class="mb-2" />
          <span class="breakdown-count">{{ breakdown.green }}</span>
          <span class="breakdown-label">participants</span>
        </div>

        <div class="breakdown-item">
          <Badge value="Acceptable" severity="warn" class="mb-2" />
          <span class="breakdown-count">{{ breakdown.orange }}</span>
          <span class="breakdown-label">participants</span>
        </div>

        <div class="breakdown-item">
          <Badge value="Poor" severity="danger" class="mb-2" />
          <span class="breakdown-count">{{ breakdown.red }}</span>
          <span class="breakdown-label">participants</span>
        </div>

        <div class="breakdown-item">
          <Badge value="Critical" severity="danger" class="mb-2" />
          <span class="breakdown-count">{{ breakdown.critical }}</span>
          <span class="breakdown-label">participants</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.equity-score-card {
  border: 1px solid var(--p-surface-border);
  border-radius: 8px;
  padding: 1.5rem;
  background: var(--p-surface-0);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.score-circle {
  position: relative;
  width: 160px;
  height: 160px;
  margin-bottom: 1rem;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.5s ease;
}

/* Respect prefers-reduced-motion (T059) */
@media (prefers-reduced-motion: reduce) {
  .progress-ring-progress {
    transition: none;
  }
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  color: var(--p-text-color);
}

.score-label {
  display: block;
  font-size: 1rem;
  color: var(--p-text-muted-color);
  margin-top: 0.25rem;
}

.score-subtitle {
  text-align: center;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
  margin: 0;
}

.breakdown-section {
  padding-top: 1.5rem;
  border-top: 1px solid var(--p-surface-border);
}

.breakdown-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.75rem;
  background: var(--p-surface-50);
  border-radius: 6px;
}

.breakdown-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.breakdown-label {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  margin-top: 0.25rem;
}
</style>
