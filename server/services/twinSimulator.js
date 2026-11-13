import { db } from '../db.js';

export class TwinSimulator {
  static generateSimulation(userId = 'default_user', userName = 'Dishant') {
    const logs = db.getRecentLogs(7, userId);
    
    let avgSleep = 5.2, avgStudy = 2.1, avgScreen = 7.8, avgExercise = 0.3, avgSpending = 280;
    if (logs.length > 0) {
      avgSleep = Math.round((logs.reduce((a, b) => a + Number(b.sleep), 0) / logs.length) * 10) / 10;
      avgStudy = Math.round((logs.reduce((a, b) => a + Number(b.study), 0) / logs.length) * 10) / 10;
      avgScreen = Math.round((logs.reduce((a, b) => a + Number(b.screen), 0) / logs.length) * 10) / 10;
      avgExercise = Math.round((logs.reduce((a, b) => a + Number(b.exercise), 0) / logs.length) * 10) / 10;
      avgSpending = Math.round((logs.reduce((a, b) => a + Number(b.spending), 0) / logs.length));
    }

    // Compounding Factors
    const dailyScreenSavings = Math.max(0.5, avgScreen - 5.0);
    const reclaimedAnnualScreen = Math.round(dailyScreenSavings * 365);
    const currentAnnualScreen = Math.round(avgScreen * 365);

    const dailyStudyGain = Math.max(0.5, 4.0 - avgStudy);
    const gainedAnnualStudy = Math.round(dailyStudyGain * 365);

    const sixMonthScreenRescued = Math.round(reclaimedAnnualScreen * 0.5);
    const sixMonthScreenLost = Math.round(currentAnnualScreen * 0.5);
    const sixMonthStudyGain = Math.round(gainedAnnualStudy * 0.5);

    const improved = {
      scenario_type: 'improved',
      badge: '✦ Consequence: If You Improve',
      hero_quote: 'Every morning is a quiet victory before the rest of the world wakes up.',
      six_month: {
        energy_score: '86%',
        energy_detail: '+38% vitality surge, zero afternoon brain fog.',
        screen_hours: `+${sixMonthScreenRescued}h`,
        screen_detail: 'Hours rescued from doomscrolling.',
        deep_study: `+${sixMonthStudyGain}h`,
        study_detail: 'Compound academic focus logged.',
        quote: '"Every morning is a quiet victory before the rest of the world wakes up."',
        milestone_badge: '✦ Milestone: Circadian Alignment',
        title: `${userName}'s 6th-Month Evolution`
      },
      five_year: {
        autonomy_vitality: '99/100',
        vitality_detail: 'Peak cognitive fitness & deep energy.',
        financial_cushion: '+$18,400',
        financial_detail: 'Compounding savings & investments.',
        career_velocity: 'Top 5%',
        career_detail: 'Recognized leader in your craft.',
        story_dropcap: 'H',
        story_text: 'alf a decade of consistent 1% daily habits. You have accumulated over 4,200 hours of focused mastery. Your habits run effortlessly on autopilot. Waking up energized, executing challenging projects, and living with financial freedom has become who you are.',
        title: `${userName}'s 5th-Year Reality: The Master Self`
      }
    };

    const unimproved = {
      scenario_type: 'unimproved',
      badge: '⚠ Consequence: If You Don\'t Improve',
      hero_quote: 'The danger isn\'t a sudden fall, but the slow habituation to mediocrity.',
      six_month: {
        energy_score: '48%',
        energy_detail: 'Persistent sleep debt & caffeine reliance.',
        screen_hours: `-${sixMonthScreenLost}h`,
        screen_detail: 'Hours surrendered to social feeds.',
        deep_study: `-${sixMonthStudyGain}h`,
        study_detail: 'Deficit against your true potential.',
        quote: '"The danger isn\'t a sudden fall, but the slow habituation to mediocrity."',
        milestone_badge: '⚠ Warning: The Fatigue Slump',
        title: `${userName}'s 6th-Month Compounding Drift`
      },
      five_year: {
        autonomy_vitality: '24/100',
        vitality_detail: 'Chronic burnout & biological fatigue.',
        financial_cushion: 'Vulnerable',
        financial_detail: 'Living paycheck to paycheck under stress.',
        career_velocity: 'Stagnant',
        career_detail: 'Delayed aspirations and missed opportunities.',
        story_dropcap: 'F',
        story_text: 'ive years have vanished. The habits that once felt harmless have formed an unbreakable cage. Over 14,000 hours were surrendered to digital distraction. Health and self-esteem bear the toll of postponed potential, while peers have advanced far ahead.',
        title: `${userName}'s 5th-Year Reality: The Burden of Delay`
      }
    };

    return {
      user_name: userName,
      annual_stats: {
        reclaimed_annual_screen_hours: reclaimedAnnualScreen,
        current_annual_screen_hours: currentAnnualScreen,
        gained_annual_study_hours: gainedAnnualStudy,
        annual_savings_potential: Math.round(320 * 365)
      },
      improved,
      unimproved
    };
  }
}
