/**
 * Type Definitions for Scheduling Assistant
 * JSDoc type definitions for entities and data structures
 */

/**
 * @typedef {Object} Meeting
 * @property {string} id - UUID
 * @property {string} user_id - Organizer user ID
 * @property {string} title - Meeting title
 * @property {Date} proposed_time - Proposed meeting datetime (UTC)
 * @property {number} [duration_minutes] - Meeting duration in minutes
 * @property {string} [notes] - Optional notes
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last modification timestamp
 * @property {Array<Participant>} [participants] - Associated participants (when loaded with join)
 */

/**
 * @typedef {Object} Participant
 * @property {string} id - UUID
 * @property {string} user_id - User who created participant
 * @property {string} name - Participant name
 * @property {string} timezone - IANA timezone identifier
 * @property {string} country - ISO 3166-1 alpha-2 country code
 * @property {string} [notes] - Optional contextual notes
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last modification timestamp
 */

/**
 * @typedef {Object} CountryConfiguration
 * @property {string} id - UUID
 * @property {string|null} user_id - User ID (null for default configs)
 * @property {string} country_code - ISO 3166-1 alpha-2 code
 * @property {string} green_start - Start of optimal hours (HH:MM:SS)
 * @property {string} green_end - End of optimal hours (HH:MM:SS)
 * @property {string} orange_start_morning - Morning buffer start (HH:MM:SS)
 * @property {string} orange_end_morning - Morning buffer end (HH:MM:SS)
 * @property {string} orange_start_evening - Evening buffer start (HH:MM:SS)
 * @property {string} orange_end_evening - Evening buffer end (HH:MM:SS)
 * @property {string} work_week_pattern - Work week pattern (e.g., 'MTWTF', 'SuMTWTh')
 * @property {boolean} is_default - Whether this is a system default
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last modification timestamp
 */

/**
 * @typedef {Object} MeetingParticipant
 * @property {string} id - UUID
 * @property {string} meeting_id - Meeting ID
 * @property {string} participant_id - Participant ID
 */

/**
 * @typedef {Object} ParticipantStatus
 * @property {string} participant_id - Participant ID
 * @property {string} participant_name - Participant name
 * @property {Date} local_time - Participant's local time
 * @property {string} status - Color status: 'green', 'orange', 'red'
 * @property {boolean} is_critical - Whether critical conflict exists
 * @property {string} reason - Human-readable reason for status
 * @property {string} timezone - IANA timezone
 * @property {string} country - Country code
 */

/**
 * @typedef {Object} EquityScoreResult
 * @property {number} score - Global equity score (0-100)
 * @property {number} green_count - Number of green participants
 * @property {number} orange_count - Number of orange participants
 * @property {number} red_count - Number of red participants
 * @property {number} critical_count - Number of critical conflicts
 * @property {number} total_points - Raw point total
 * @property {number} max_possible - Maximum possible points
 */

/**
 * @typedef {Object} TimeSlot
 * @property {number} hour - Hour of day (0-23)
 * @property {Date} datetime - Full datetime for this slot
 * @property {number} score - Equity score for this time
 * @property {Array<ParticipantStatus>} participant_statuses - Status breakdown
 */

/**
 * @typedef {Object} Holiday
 * @property {Date} date - Holiday date
 * @property {string} name - Holiday name (English)
 * @property {string} localName - Local language name
 * @property {string} countryCode - ISO 3166-1 alpha-2 code
 * @property {boolean} fixed - Whether date is fixed annually
 * @property {boolean} global - Whether it's nationwide
 * @property {Array<string>|null} counties - Specific regions (null if nationwide)
 * @property {Array<string>} types - Holiday types
 */

/**
 * @typedef {Object} TimezoneInfo
 * @property {string} timezone - IANA timezone identifier
 * @property {string} name - Human-readable name
 * @property {string} abbreviation - Common abbreviation
 */

export {}
