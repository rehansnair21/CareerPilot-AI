/**
 * Student Progress Evaluation & Attention Detection Module
 * CareerPilot AI - Mentor-Based Student Progress Monitoring and Intervention
 */

export const PROGRESS_CONFIG = {
  INACTIVITY_DAYS_LOW_PROGRESS: 7, // Inactive for >= 7 days triggers Low Progress / Attention
  INACTIVITY_DAYS_NEEDS_ATTENTION: 5, // Inactive for >= 5 days and falling behind schedule
  NEW_ENROLLMENT_GRACE_DAYS: 3, // Grace period: newly enrolled students aren't flagged as inactive immediately
  LOW_QUIZ_SCORE_THRESHOLD: 60, // Average quiz score < 60% indicates difficulty
  EXPECTED_DAYS_PER_LESSON: 3, // Expected learning pace: 1 lesson every 3 days
  LOW_PROGRESS_PCT_THRESHOLD: 25, // Less than 25% completion after schedule expectations
};

/**
 * Calculate course progress percentage safely
 * Formula: (Number of Completed Lessons / Total Published Lessons) * 100
 */
export const calculateCourseProgressPercentage = (completedLessonsCount, totalPublishedLessons) => {
  if (!totalPublishedLessons || totalPublishedLessons <= 0) {
    return 0;
  }
  const pct = Math.round((completedLessonsCount / totalPublishedLessons) * 100);
  return Math.min(100, Math.max(0, pct));
};

/**
 * Evaluate student learning progress status based on actual lesson completion,
 * enrollment date, last activity, quiz scores, and course pacing.
 *
 * Statuses:
 * - 'Not Started': Enrolled but has completed 0 lessons
 * - 'Low Progress': Very little progress or inactive for >= 7 days
 * - 'Needs Attention': Falling behind schedule, low quiz scores, or long inactivity
 * - 'On Track': Appropriate pace and active engagement
 */
export const evaluateStudentProgressStatus = ({
  completedLessonsCount = 0,
  totalPublishedLessons = 0,
  enrolledAt = new Date(),
  lastActivityDate = new Date(),
  avgQuizScorePct = null,
  submittedAssignmentsCount = 0,
  totalAssignmentsCount = 0,
  config = PROGRESS_CONFIG,
}) => {
  const now = new Date();
  const enrolledTime = enrolledAt ? new Date(enrolledAt) : now;
  const lastActivityTime = lastActivityDate ? new Date(lastActivityDate) : enrolledTime;

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceEnrollment = Math.max(0, Math.floor((now.getTime() - enrolledTime.getTime()) / msPerDay));
  const daysSinceLastActivity = Math.max(0, Math.floor((now.getTime() - lastActivityTime.getTime()) / msPerDay));

  const progressPercentage = calculateCourseProgressPercentage(completedLessonsCount, totalPublishedLessons);

  const attentionReasons = [];
  let status = 'On Track';
  let needsAttention = false;

  // Case 1: Course has 0 published lessons
  if (totalPublishedLessons === 0) {
    return {
      progressPercentage: 0,
      status: 'On Track',
      needsAttention: false,
      attentionReasons: [],
      daysSinceEnrollment,
      daysSinceLastActivity,
    };
  }

  // Case 2: 100% Completed
  if (progressPercentage === 100 || (totalPublishedLessons > 0 && completedLessonsCount >= totalPublishedLessons)) {
    return {
      progressPercentage: 100,
      status: 'On Track',
      needsAttention: false,
      attentionReasons: [],
      daysSinceEnrollment,
      daysSinceLastActivity,
    };
  }

  // Case 3: Student has completed ZERO lessons
  if (completedLessonsCount === 0) {
    if (daysSinceEnrollment <= config.NEW_ENROLLMENT_GRACE_DAYS) {
      // Grace period for newly enrolled students (do NOT classify as inactive or needs attention immediately)
      status = 'Not Started';
      needsAttention = false;
    } else if (daysSinceEnrollment <= config.INACTIVITY_DAYS_LOW_PROGRESS) {
      status = 'Not Started';
      needsAttention = false;
      attentionReasons.push(`No lessons completed yet (${daysSinceEnrollment} days since enrollment)`);
    } else {
      // Enrolled more than 7 days ago with zero progress
      status = 'Needs Attention';
      needsAttention = true;
      attentionReasons.push(`No lessons completed after ${daysSinceEnrollment} days since enrollment`);
    }

    return {
      progressPercentage: 0,
      status,
      needsAttention,
      attentionReasons,
      daysSinceEnrollment,
      daysSinceLastActivity,
    };
  }

  // Case 4: Student has completed at least 1 lesson
  // Check Quiz performance issues
  if (avgQuizScorePct !== null && avgQuizScorePct < config.LOW_QUIZ_SCORE_THRESHOLD) {
    attentionReasons.push(`Average quiz score of ${avgQuizScorePct}% indicates difficulty with course material`);
    needsAttention = true;
  }

  // Check Inactivity
  if (daysSinceLastActivity >= config.INACTIVITY_DAYS_LOW_PROGRESS) {
    attentionReasons.push(`No learning activity for ${daysSinceLastActivity} days`);
    needsAttention = true;
  } else if (daysSinceLastActivity >= config.INACTIVITY_DAYS_NEEDS_ATTENTION && progressPercentage < 50) {
    attentionReasons.push(`Inactive for ${daysSinceLastActivity} days while course is in progress`);
    needsAttention = true;
  }

  // Check Expected Schedule Pacing
  const expectedLessons = Math.min(
    totalPublishedLessons,
    Math.max(1, Math.floor(daysSinceEnrollment / config.EXPECTED_DAYS_PER_LESSON))
  );

  if (daysSinceEnrollment > 7 && completedLessonsCount < Math.floor(expectedLessons * 0.5)) {
    attentionReasons.push(
      `Falling behind expected schedule: completed ${completedLessonsCount} of ${expectedLessons} expected lessons`
    );
    needsAttention = true;
  }

  // Determine final status
  if (daysSinceLastActivity >= config.INACTIVITY_DAYS_LOW_PROGRESS && progressPercentage < config.LOW_PROGRESS_PCT_THRESHOLD) {
    status = 'Low Progress';
  } else if (needsAttention) {
    status = 'Needs Attention';
  } else if (progressPercentage < 20 && daysSinceEnrollment > 10) {
    status = 'Low Progress';
  } else {
    status = 'On Track';
  }

  return {
    progressPercentage,
    status,
    needsAttention: attentionReasons.length > 0,
    attentionReasons,
    daysSinceEnrollment,
    daysSinceLastActivity,
    expectedLessons,
  };
};
