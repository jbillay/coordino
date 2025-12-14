/**
 * Equity Scorer Utility
 * Calculates equity scores for meeting times based on participant timezone statuses
 */

/**
 * Calculate global equity score
 * @param {Array<Object>} participantStatuses - Array of participant status objects
 * @param {string} participantStatuses[].status - 'green', 'orange', 'red'
 * @param {boolean} participantStatuses[].is_critical - Whether critical conflict exists
 * @returns {Object} Score breakdown
 * @returns {number} return.score - Global equity score (0-100)
 * @returns {number} return.green_count - Number of green participants
 * @returns {number} return.orange_count - Number of orange participants
 * @returns {number} return.red_count - Number of red participants
 * @returns {number} return.critical_count - Number of critical conflicts
 * @returns {number} return.total_points - Raw point total
 * @returns {number} return.max_possible - Maximum possible points
 *
 * @example
 * calculateEquityScore([
 *   { status: 'green', is_critical: false },
 *   { status: 'green', is_critical: false },
 *   { status: 'orange', is_critical: false },
 *   { status: 'red', is_critical: true }
 * ])
 * // {
 * //   score: 25,
 * //   green_count: 2,
 * //   orange_count: 1,
 * //   red_count: 1,
 * //   critical_count: 1,
 * //   total_points: 10,
 * //   max_possible: 40
 * // }
 */
export function calculateEquityScore(participantStatuses) {
  // Input validation
  if (!Array.isArray(participantStatuses) || participantStatuses.length === 0) {
    return {
      score: 0,
      green_count: 0,
      orange_count: 0,
      red_count: 0,
      critical_count: 0,
      total_points: 0,
      max_possible: 0
    }
  }

  // Count participants by status
  let greenCount = 0
  let orangeCount = 0
  let redCount = 0
  let criticalCount = 0

  participantStatuses.forEach((p) => {
    if (p.is_critical) {
      criticalCount++
    } else if (p.status === 'green') {
      greenCount++
    } else if (p.status === 'orange') {
      orangeCount++
    } else if (p.status === 'red') {
      redCount++
    }
  })

  // Point values
  const GREEN_POINTS = 10
  const ORANGE_POINTS = 5
  const RED_POINTS = -15
  const CRITICAL_POINTS = -50

  // Calculate total points
  const totalPoints =
    greenCount * GREEN_POINTS +
    orangeCount * ORANGE_POINTS +
    redCount * RED_POINTS +
    criticalCount * CRITICAL_POINTS

  // Calculate max possible points (all green)
  const maxPossible = participantStatuses.length * GREEN_POINTS

  // Calculate normalized score (0-100)
  // Formula: (totalPoints / maxPossible) * 100
  // Clamp to 0-100 range
  let score = maxPossible > 0 ? (totalPoints / maxPossible) * 100 : 0
  score = Math.max(0, Math.min(100, score))

  return {
    score: Math.round(score),
    green_count: greenCount,
    orange_count: orangeCount,
    red_count: redCount,
    critical_count: criticalCount,
    total_points: totalPoints,
    max_possible: maxPossible
  }
}

/**
 * Get quality category for equity score
 * @param {number} score - Equity score (0-100)
 * @returns {string} Quality category: 'excellent', 'good', 'fair', 'poor'
 *
 * @example
 * getScoreQuality(85) // 'excellent'
 * getScoreQuality(65) // 'good'
 * getScoreQuality(45) // 'fair'
 * getScoreQuality(20) // 'poor'
 */
export function getScoreQuality(score) {
  if (score >= 71) {
    return 'excellent'
  }
  if (score >= 41) {
    return 'good'
  }
  if (score >= 1) {
    return 'fair'
  }
  return 'poor'
}

/**
 * Compare two equity scores
 * @param {number} scoreA - First score
 * @param {number} scoreB - Second score
 * @returns {number} -1 if B is better, 1 if A is better, 0 if equal
 *
 * @example
 * compareScores(75, 50) // 1 (A is better)
 * compareScores(40, 80) // -1 (B is better)
 * compareScores(50, 50) // 0 (equal)
 */
export function compareScores(scoreA, scoreB) {
  if (scoreA > scoreB) {
    return 1
  }
  if (scoreA < scoreB) {
    return -1
  }
  return 0
}
