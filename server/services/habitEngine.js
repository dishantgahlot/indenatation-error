import { db } from '../db.js';

export class HabitEngine {
  /**
   * Calculates a weighted productivity score (0-100):
   * - Sleep (25%): Optimal at 8.0h. Penalty for deficit or excess.
   * - Study (30%): Target 4.0h. Direct cognitive productivity.
   * - Screen (20%): Limit <= 5.0h. Distraction decay.
   * - Exercise (15%): Target 1.0h. Metabolic vitality.
   * - Spending (10%): Limit <= ₹600/day. Financial discipline.
   */
  static calculateProductivityScore(sleep, study, screen, exercise, spending) {
    // 1. Sleep score
    let sleepScore;
    if (sleep >= 8.0) {
      sleepScore = Math.max(70, 100 - (sleep - 8.0) * 15);
    } else {
      sleepScore = Math.max(10, (sleep / 8.0) * 100);
    }

    // 2. Study score
    const studyScore = Math.min(100, Math.max(10, (study / 4.0) * 100));

    // 3. Screen score
    let screenScore;
    if (screen <= 5.0) {
      screenScore = 100 - (screen / 5.0) * 15;
    } else {
      const penalty = (screen - 5.0) * 22;
      screenScore = Math.max(10, 85 - penalty);
    }

    // 4. Exercise score
    const exerciseScore = Math.min(100, Math.max(10, (exercise / 1.0) * 100));

    // 5. Spending score
    let spendingScore;
    if (spending <= 600) {
      spendingScore = Math.max(75, 100 - (spending / 600.0) * 25);
    } else {
      const penalty = (spending - 600) * 0.12;
      spendingScore = Math.max(10, 75 - penalty);
    }

    const weighted = (
      sleepScore * 0.25 +
      studyScore * 0.30 +
      screenScore * 0.20 +
      exerciseScore * 0.15 +
      spendingScore * 0.10
    );

    return Math.min(100, Math.max(0, Math.round(weighted)));
  }

  static getStatusBadge(score) {
    if (score >= 75) return '✦ Optimal Momentum';
    if (score >= 50) return '✦ Balanced Potential';
    return '⚠ High Habit Drift';
  }

  /**
   * Checks whether a log has completed all six factors
   */
  static isLogComplete(log) {
    if (!log) return false;
    if (log.is_complete === true) return true;

    const sleep = Number(log.sleep) || 0;
    const study = Number(log.study) || 0;
    const screen = Number(log.screen) || 0;
    const exercise = Number(log.exercise) || 0;
    const spending = Number(log.spending) || 0;
    const hydration = Number(log.hydration) || 0;

    const completedCount = [
      sleep > 0,
      study > 0 || log.study_completed === true,
      screen > 0,
      exercise > 0 || log.exercise_completed === true,
      spending > 0,
      hydration > 0
    ].filter(Boolean).length;

    return completedCount === 6 || log.is_complete === true;
  }

  /**
   * Returns count of completed factors (0 - 6)
   */
  static getCompletedFactorsCount(log) {
    if (!log) return 0;
    if (log.is_complete === true) return 6;

    const sleep = Number(log.sleep) || 0;
    const study = Number(log.study) || 0;
    const screen = Number(log.screen) || 0;
    const exercise = Number(log.exercise) || 0;
    const spending = Number(log.spending) || 0;
    const hydration = Number(log.hydration) || 0;

    return [
      sleep > 0,
      study > 0 || log.study_completed === true,
      screen > 0,
      exercise > 0 || log.exercise_completed === true,
      spending > 0,
      hydration > 0
    ].filter(Boolean).length;
  }

  /**
   * Calculates streak data for a user - only counts days where all six factors are completed
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back (default: 365 for full year)
   * @returns {Object} Streak data including current streak, longest streak, total days logged
   */
  static async getStreakData(userId = 'default_user', days = 365) {
    const rawLogs = await db.getRecentLogs(days, userId);

    if (!rawLogs || rawLogs.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysLogged: 0,
        lastLoggedDate: null,
        streakStatus: 'none', // 'active', 'broken', 'none'
        todayLogged: false,
        isCompletedDay: false,
        completedFactorsCount: 0
      };
    }

    const latestLog = rawLogs[rawLogs.length - 1];
    const completedFactorsCount = HabitEngine.getCompletedFactorsCount(latestLog);

    // Filter to ONLY completed logs where all six factors are completed
    const logs = rawLogs.filter(HabitEngine.isLogComplete);

    if (!logs || logs.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysLogged: 0,
        lastLoggedDate: null,
        streakStatus: 'none',
        todayLogged: false,
        isCompletedDay: false,
        completedFactorsCount
      };
    }

    // Sort logs by date ascending
    const sortedLogs = [...logs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));

    // Get unique logged dates
    const loggedDates = new Set(sortedLogs.map(log => log.log_date));
    const totalDaysLogged = loggedDates.size;

    // Get today's date string
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if today is logged and completed
    const todayLogged = loggedDates.has(today);

    // Calculate current streak
    let currentStreak = 0;
    let streakStatus = 'none';

    if (todayLogged || loggedDates.has(yesterday)) {
      // Start from today if logged, otherwise from yesterday
      let checkDate = todayLogged ? today : yesterday;
      let streak = 0;

      while (loggedDates.has(checkDate)) {
        streak++;
        // Move to previous day
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        checkDate = prevDate.toISOString().split('T')[0];
      }

      currentStreak = streak;
      streakStatus = todayLogged ? 'active' : 'broken';
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const log of sortedLogs) {
      const logDate = log.log_date;

      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((new Date(logDate) - new Date(prevDate)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays === 0) {
          // Same day (duplicate), skip
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      prevDate = logDate;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Get last logged date
    const lastLoggedDate = sortedLogs[sortedLogs.length - 1]?.log_date || null;

    return {
      currentStreak,
      longestStreak,
      totalDaysLogged,
      lastLoggedDate,
      streakStatus,
      todayLogged,
      isCompletedDay: todayLogged,
      completedFactorsCount
    };
  }

  static async getWeeklyCycle(userId = 'default_user') {
    const logs = await db.getRecentLogs(7, userId);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const seriesData = {
      sleep: [],
      study: [],
      screen: [],
      exercise: [],
      others: []
    };

    // If no logs at all, return empty/zero state
    if (!logs || logs.length === 0) {
      for (let i = 0; i < 7; i++) {
        const dayLabel = dayNames[i];
        const dDate = new Date().toISOString().split('T')[0];
        seriesData.sleep.push({ day: dayLabel, date: dDate, val: 0 });
        seriesData.study.push({ day: dayLabel, date: dDate, val: 0 });
        seriesData.screen.push({ day: dayLabel, date: dDate, val: 0 });
        seriesData.exercise.push({ day: dayLabel, date: dDate, val: 0 });
        seriesData.others.push({ day: dayLabel, date: dDate, val: 0 });
      }

      return {
        productivity_score: 0,
        status_badge: 'No Data Logged',
        habits_list: [
          { id: 'sleep', label: 'Sleep', value: '0.0h', color: '#5568ba', data: seriesData.sleep },
          { id: 'study', label: 'Study', value: '0.0h', color: '#f2a738', data: seriesData.study },
          { id: 'screen', label: 'Screen', value: '0.0h', color: '#cf5579', data: seriesData.screen },
          { id: 'exercise', label: 'Exercise', value: '0.0h', color: '#a85d3b', data: seriesData.exercise },
          { id: 'others', label: 'Others', value: '0.0h', color: '#3d9970', data: seriesData.others }
        ],
        breakdown_list: [
          { label: 'Sleep', color: '#5568ba', percentage: 0, hours: 0 },
          { label: 'Study', color: '#f2a738', percentage: 0, hours: 0 },
          { label: 'Screen Time', color: '#cf5579', percentage: 0, hours: 0 },
          { label: 'Exercise', color: '#a85d3b', percentage: 0, hours: 0 },
          { label: 'Others', color: '#3d9970', percentage: 0, hours: 0 }
        ],
        insights_holding_back: [],
        latest_metrics: null,
        total_logs: 0
      };
    }

    const count = logs.length;
    const latestLog = logs[logs.length - 1];

    // Compute averages strictly across logged days (NOT divided by 7 if only 1 day logged)
    const sleepAvg = Math.round((logs.reduce((sum, l) => sum + Number(l.sleep || 0), 0) / count) * 10) / 10;
    const studyAvg = Math.round((logs.reduce((sum, l) => sum + Number(l.study || 0), 0) / count) * 10) / 10;
    const screenAvg = Math.round((logs.reduce((sum, l) => sum + Number(l.screen || 0), 0) / count) * 10) / 10;
    const exerciseAvg = Math.round((logs.reduce((sum, l) => sum + Number(l.exercise || 0), 0) / count) * 10) / 10;
    const othersAvg = Math.max(0, Math.round((24.0 - (sleepAvg + studyAvg + screenAvg + exerciseAvg)) * 10) / 10);

    // Pie chart / Donut percentages (always sum to 100%)
    const totalHours = sleepAvg + studyAvg + screenAvg + exerciseAvg + othersAvg || 24;
    const pSleep = Math.round((sleepAvg / totalHours) * 100);
    const pStudy = Math.round((studyAvg / totalHours) * 100);
    const pScreen = Math.round((screenAvg / totalHours) * 100);
    const pExercise = Math.round((exerciseAvg / totalHours) * 100);
    const pOthers = Math.max(0, 100 - (pSleep + pStudy + pScreen + pExercise));

    // Populate the 7 days of the week
    for (let i = 0; i < 7; i++) {
      const dayLabel = dayNames[i];
      let s, st, sc, ex, dDate;

      if (i < logs.length) {
        const item = logs[i];
        s = Number(item.sleep || 0);
        st = Number(item.study || 0);
        sc = Number(item.screen || 0);
        ex = Number(item.exercise || 0);
        dDate = item.log_date || new Date().toISOString().split('T')[0];
      } else if (logs.length === 1) {
        // If user has only 1 entry so far (Day 1), carry their established baseline across the week with subtle realistic variation
        const base = logs[0];
        const sineVar = Math.sin((i / 6) * Math.PI * 2) * 0.15;
        s = Math.max(0, Math.round((Number(base.sleep || 0) * (1 + sineVar)) * 10) / 10);
        st = Math.max(0, Math.round((Number(base.study || 0) * (1 + sineVar * 0.8)) * 10) / 10);
        sc = Math.max(0, Math.round((Number(base.screen || 0) * (1 - sineVar * 0.6)) * 10) / 10);
        ex = Math.max(0, Math.round((Number(base.exercise || 0) * (1 + sineVar * 0.5)) * 10) / 10);
        dDate = new Date(Date.now() + (i * 86400000)).toISOString().split('T')[0];
      } else {
        s = 0;
        st = 0;
        sc = 0;
        ex = 0;
        dDate = new Date().toISOString().split('T')[0];
      }

      const oth = Math.max(0, Math.round((24.0 - (s + st + sc + ex)) * 10) / 10);

      seriesData.sleep.push({ day: dayLabel, date: dDate, val: s });
      seriesData.study.push({ day: dayLabel, date: dDate, val: st });
      seriesData.screen.push({ day: dayLabel, date: dDate, val: sc });
      seriesData.exercise.push({ day: dayLabel, date: dDate, val: ex });
      seriesData.others.push({ day: dayLabel, date: dDate, val: oth });
    }

    // Latest day values from actual latest log
    const latestSleep = Number(latestLog.sleep !== undefined ? latestLog.sleep : sleepAvg);
    const latestStudy = Number(latestLog.study !== undefined ? latestLog.study : studyAvg);
    const latestScreen = Number(latestLog.screen !== undefined ? latestLog.screen : screenAvg);
    const latestExercise = Number(latestLog.exercise !== undefined ? latestLog.exercise : exerciseAvg);
    const latestSpending = Number(latestLog.spending !== undefined ? latestLog.spending : 280);
    const latestHydration = Number(latestLog.hydration !== undefined ? latestLog.hydration : 2.0);

    const prodScore = this.calculateProductivityScore(
      latestSleep,
      latestStudy,
      latestScreen,
      latestExercise,
      latestSpending
    );

    const statusBadge = this.getStatusBadge(prodScore);

    const habitsList = [
      { id: 'sleep', label: 'Sleep', value: `${latestSleep.toFixed(1)}h`, color: '#5568ba', data: seriesData.sleep },
      { id: 'study', label: 'Study', value: `${latestStudy.toFixed(1)}h`, color: '#f2a738', data: seriesData.study },
      { id: 'screen', label: 'Screen', value: `${latestScreen.toFixed(1)}h`, color: '#cf5579', data: seriesData.screen },
      { id: 'exercise', label: 'Exercise', value: `${latestExercise.toFixed(1)}h`, color: '#a85d3b', data: seriesData.exercise },
      { id: 'others', label: 'Others', value: `${othersAvg.toFixed(1)}h`, color: '#3d9970', data: seriesData.others }
    ];

    const breakdownList = [
      { label: 'Sleep', color: '#5568ba', percentage: pSleep, hours: sleepAvg },
      { label: 'Study', color: '#f2a738', percentage: pStudy, hours: studyAvg },
      { label: 'Screen Time', color: '#cf5579', percentage: pScreen, hours: screenAvg },
      { label: 'Exercise', color: '#a85d3b', percentage: pExercise, hours: exerciseAvg },
      { label: 'Others', color: '#3d9970', percentage: pOthers, hours: othersAvg }
    ];

    const insights = [];
    if (latestSleep < 7.0) {
      insights.push({ id: 'sleep', title: 'Your sleep consistency could improve.', logged: `${latestSleep}h logged`, icon: 'moon' });
    }
    if (latestScreen > 5.0) {
      insights.push({ id: 'screen', title: 'Screen time is higher than your target.', logged: `${latestScreen}h logged`, icon: 'phone' });
    }
    if (latestStudy < 3.5) {
      insights.push({ id: 'study', title: 'Your study routine is inconsistent.', logged: `${latestStudy}h logged`, icon: 'book' });
    }
    if (latestExercise < 0.7) {
      insights.push({ id: 'exercise', title: 'Physical activity needs attention.', logged: `${Math.round(latestExercise * 60)}m logged`, icon: 'heart' });
    }

    return {
      productivity_score: prodScore,
      status_badge: statusBadge,
      habits_list: habitsList,
      breakdown_list: breakdownList,
      insights_holding_back: insights,
      latest_metrics: {
        sleep: latestSleep,
        study: latestStudy,
        screen: latestScreen,
        exercise: latestExercise,
        spending: latestSpending,
        hydration: latestHydration
      },
      total_logs: count
    };
  }
}
