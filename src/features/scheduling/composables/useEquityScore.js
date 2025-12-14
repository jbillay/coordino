/**
 * Equity scoring algorithm for meeting time fairness
 * Calculates how fair a proposed meeting time is across all participants
 */

/**
 * Calculate equity score for a meeting time
 * @param {Array} participantsWithStatus - Array of participants with calculated status
 * @returns {number} Equity score from 0-100
 */
export function calculateScore(participantsWithStatus) {
  if (!participantsWithStatus || participantsWithStatus.length === 0) {
    return 0
  }

  // Status weights per spec FR-023
  const weights = {
    green: 10,
    orange: 5,
    red: -15,
    critical: -50
  }

  // Calculate total points
  const totalPoints = participantsWithStatus.reduce((sum, participant) => {
    const weight = weights[participant.status] || 0
    return sum + weight
  }, 0)

  // Max possible score (all participants green)
  const maxPossible = participantsWithStatus.length * weights.green

  // Min possible score (all participants critical)
  const minPossible = participantsWithStatus.length * weights.critical

  // Normalize to 0-100 scale using min-max normalization per FR-024
  // This accounts for the fact that scores can be negative
  const normalizedScore = ((totalPoints - minPossible) / (maxPossible - minPossible)) * 100

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, normalizedScore))
}

/**
 * Get breakdown of participant distribution by status
 * @param {Array} participantsWithStatus - Array of participants with calculated status
 * @returns {Object} Count of participants by status { green, orange, red, critical }
 */
export function getBreakdown(participantsWithStatus) {
  const breakdown = {
    green: 0,
    orange: 0,
    red: 0,
    critical: 0,
    total: 0
  }

  if (!participantsWithStatus || participantsWithStatus.length === 0) {
    return breakdown
  }

  // Count participants by status
  participantsWithStatus.forEach((participant) => {
    const { status } = participant
    if (status in breakdown) {
      breakdown[status]++
    }
  })

  // Set total count
  breakdown.total = participantsWithStatus.length

  return breakdown
}
