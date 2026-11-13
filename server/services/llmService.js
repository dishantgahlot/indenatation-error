import Groq from 'groq-sdk';
import { config } from '../config/index.js';
import { db } from '../db.js';

console.log('[LLM MODULE] llmService.js loaded (Groq)');

export class LLMService {
  /**
   * Diagnoses behavioral archetype from measured lifestyle habits
   */
  static diagnoseArchetype(metrics) {
    const { sleep, study, screen, exercise, spending, productivityScore } = metrics;

    if (study <= 0.5 && exercise <= 0.2 && (screen >= 6.5 || productivityScore <= 35)) {
      return {
        id: 'doing_nothing',
        label: 'Inertia & Zero Striving (Doing Nothing)',
        description: 'Paralyzed by hesitation, 0h study/exercise, high digital drift',
        statusWarning: '⚠ Extreme Inaction Detected'
      };
    }
    if (screen >= 9.0 || sleep <= 4.2) {
      return {
        id: 'burnout',
        label: 'Severe Burnout & Dopamine Crisis',
        description: 'Deep sleep deprivation paired with 9h+ algorithmic screen time',
        statusWarning: '⚠ High Drift & Burnout'
      };
    }
    if (study >= 5.0 && sleep <= 5.5) {
      return {
        id: 'exam_crunch',
        label: 'Academic Sprint & Sleep Depletion',
        description: 'High study marathon with hazardous cognitive sleep debt',
        statusWarning: '📚 High Study Imbalance'
      };
    }
    if (spending >= 700) {
      return {
        id: 'financial_leakage',
        label: 'Impulse Spending & Dopamine Coping',
        description: 'Excessive daily financial erosion coping with daily fatigue',
        statusWarning: '💸 Severe Financial Leak'
      };
    }
    if (study >= 4.0 && exercise >= 0.8 && screen <= 4.0 && sleep >= 7.0) {
      return {
        id: 'achiever',
        label: 'Transcendent Peak Performer',
        description: 'Balanced sleep, low distraction, unbroken study & fitness',
        statusWarning: '✦ Optimal Momentum'
      };
    }
    return {
      id: 'baseline',
      label: 'Everyday Struggle & Latent Potential',
      description: 'Moderate habits hovering between discipline and passive drift',
      statusWarning: '✦ Balanced Potential'
    };
  }

  /**
   * Generates or retrieves cached Future-Self letter based on exact dynamic metrics
   */
  static async generateFutureLetter(userName = 'Dishant', scenarioType = 'improved', metrics = {}, forceRefresh = false, userId = 'usr_default_dishant') {
    // Write to file to prove function execution
    const fs = await import('fs');
    fs.writeFileSync('C:/Users/disha/OneDrive/Desktop/indenatation error/llm_debug.txt', 'FUNCTION EXECUTED: ' + new Date().toISOString() + '\n', { flag: 'a' });

    // 1. Sanitize & extract complete numerical metrics
    const sleep = Number(metrics.sleep !== undefined ? metrics.sleep : 5.2);
    const study = Number(metrics.study !== undefined ? metrics.study : 2.1);
    const screen = Number(metrics.screen !== undefined ? metrics.screen : 7.8);
    const exercise = Number(metrics.exercise !== undefined ? metrics.exercise : 0.3);
    const spending = Number(metrics.spending !== undefined ? metrics.spending : 280);
    const hydration = Number(metrics.hydration !== undefined ? metrics.hydration : 1.8);
    const productivityScore = Number(metrics.productivity_score !== undefined ? metrics.productivity_score : 42);

    const fullMetrics = { sleep, study, screen, exercise, spending, hydration, productivityScore };
    const archetype = this.diagnoseArchetype(fullMetrics);
    console.log('LLM DEBUG 2: archetype determined', archetype.id);

    // 2. Compute dynamic metric fingerprint for intelligent cache invalidation
    const metricHash = `s${sleep.toFixed(1)}_st${study.toFixed(1)}_sc${screen.toFixed(1)}_e${exercise.toFixed(1)}_sp${Math.round(spending)}_h${hydration.toFixed(1)}_scr${Math.round(productivityScore)}`;
    const cacheKey = `${userId}_${scenarioType}_${metricHash}`;
    console.log('LLM DEBUG 3: cacheKey', cacheKey);

    if (!forceRefresh) {
      const cached = db.getCachedLetter(cacheKey, userId);
      console.log('LLM DEBUG 4: cache check', cached ? 'hit' : 'miss');
      if (cached) {
        console.log('LLM DEBUG 5: returning cached');
        return cached;
      }
    }

    let letterData = null;
    let modelUsed = 'semantic-behavioral-engine-v3';

    // 3. Attempt Live LLM Generation via Groq API if configured
    const isGroq = Boolean(config.GROQ_API_KEY?.startsWith('gsk_') || process.env.GROQ_API_KEY?.startsWith('gsk_'));
    const groqApiKey = isGroq ? (config.GROQ_API_KEY || process.env.GROQ_API_KEY) : (config.GEMINI_API_KEY || config.GROQ_API_KEY || process.env.GROQ_API_KEY);
    const groqModel = isGroq ? (config.GROQ_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile') : (config.GEMINI_MODEL || 'gemini-2.5-flash');

    if (groqApiKey && groqApiKey.trim() !== '') {
      const candidateModels = [
        groqModel,
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b'
      ].filter((m, i, arr) => m && arr.indexOf(m) === i);

      const groq = new Groq({ apiKey: groqApiKey });
      const prompt = this.buildPrompt(userName, scenarioType, fullMetrics, archetype);

      for (const targetModel of candidateModels) {
        try {
          console.log(`[LLM] Attempting Groq generation with model: ${targetModel}`);
          const response = await groq.chat.completions.create({
            model: targetModel,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.75,
            max_tokens: 2048
          });

          if (response?.choices?.[0]?.message?.content) {
            const cleanText = response.choices[0].message.content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
            letterData = JSON.parse(cleanText);
            modelUsed = `groq/${targetModel}`;
            console.log(`✅ [LLM] Successfully generated letter via Groq (${targetModel})`);
            break;
          }
        } catch (err) {
          console.warn(`⚠️ [LLM] Groq attempt with ${targetModel} failed:`, err.message);
          // Try next candidate model
        }
      }
    } else {
      console.log('ℹ️ [LLM] No GROQ_API_KEY provided; using dynamic behavioral synthesis engine');
    }

    // 4. Production Generative Behavioral Synthesis Engine (Zero-dependency fallback)
    if (!letterData || !letterData.paragraphs || letterData.paragraphs.length === 0) {
      console.log('LLM DEBUG 8: using fallback');
      letterData = this.generateDynamicSynthesis(userName, scenarioType, fullMetrics, archetype);
      console.log('LLM DEBUG 9: fallback result', letterData ? 'ok' : 'null');
      modelUsed = 'neural-behavioral-synthesis-v3';
    }

    if (!letterData) {
      console.error('LLM DEBUG 10: ERROR letterData still null');
      return null;
    }

    letterData.generated_at = new Date().toISOString();
    letterData.model_used = modelUsed;
    letterData.metrics_snapshot = fullMetrics;
    letterData.archetype_detected = archetype;
    letterData.data_citations = [
      `${sleep.toFixed(1)}h Sleep`,
      `${study.toFixed(1)}h Study`,
      `${screen.toFixed(1)}h Screen`,
      `${exercise.toFixed(1)}h Fitness`,
      `₹${Math.round(spending)}/day Spending`,
      `${productivityScore}/100 Score`
    ];

    // Cache with metric fingerprint
    db.setCachedLetter(cacheKey, letterData, userId);
    console.log('LLM DEBUG 11: returning letterData');
    return letterData;
  }

  /**
   * Constructs the structured prompt for Groq
   */
  static buildPrompt(userName, scenarioType, metrics, archetype) {
    const { sleep, study, screen, exercise, spending, hydration, productivityScore } = metrics;
    const isImproved = scenarioType === 'improved';

    const annualScreenHours = Math.round(screen * 365);
    const fiveYearScreenHours = annualScreenHours * 5;
    const annualStudyHours = Math.round(study * 365);
    const annualSpending = Math.round(spending * 365);
    const fiveYearSpending = annualSpending * 5;

    return `
You are the Future Self of ${userName}, writing a deeply moving, personal, and cinematic letter from 5 years in the future (the year 2031).

CURRENT MEASURED EVERYDAY HABITS OF ${userName} IN 2026:
- Daily Sleep: ${sleep} hours/night (Clinical Target: 8.0h | Deficit: ${(8.0 - sleep).toFixed(1)}h)
- Focused Study / Deep Work: ${study} hours/day (${annualStudyHours} hours/year | 5-Year Total: ${annualStudyHours * 5} hours)
- Recreational Screen Time: ${screen} hours/day (${annualScreenHours} hours/year | 5-Year Total: ${fiveYearScreenHours} hours lost to screens)
- Physical Exercise: ${exercise} hours/day (Goal: 1.0h)
- Daily Discretionary Spending: ₹${spending}/day (₹${annualSpending.toLocaleString('en-IN')}/year | 5-Year Total: ₹${fiveYearSpending.toLocaleString('en-IN')})
- Daily Hydration: ${hydration} Liters/day (Target: 3.0L)
- Current Lifestyle Productivity Score: ${productivityScore}/100
- DIAGNOSED BEHAVIORAL ARCHETYPE: "${archetype.label}" (${archetype.description})

SIMULATION PATH: ${isImproved ? 'IMPROVED TIMELINE (Consequences of Adopting Healthier Choices: Compounding Growth, Energy, & Freedom)' : 'UNIMPROVED TIMELINE (Consequences of Continuing Existing Habits: Compounding Drift, Burnout, & Regret)'}

CRITICAL USER REQUIREMENT & SPECIAL CONTEXT:
The user specifically asked: "If the data suggests that I am doing nothing, what is the favorable outcome if I continue that?"
- IF THE DATA SHOWS THEY ARE DOING NOTHING (e.g. study <= 0.5h, exercise <= 0.2h, high screen time):
  * In the UNIMPROVED timeline: Directly address this myth. Tell them unequivocally that if they continue doing nothing, there is NO favorable outcome. Continuing inaction breeds compounded stagnation, intellectual rust, lost career momentum, and watching peers succeed while they remain frozen.
  * In the IMPROVED timeline: Celebrate the pivotal breakthrough when they stopped doing nothing. Acknowledge that starting from zero was terrifying, but taking that first 30-minute action and putting the screen down was the greatest catalyst for the thriving life in 2031.
- You MUST directly cite their exact numerical habits (${sleep}h sleep, ${study}h study, ${screen}h screen, ₹${spending}/day spending, ${exercise}h fitness) in the body paragraphs.
- Keep the voice antique, intimate, poetic, and emotionally resonant.

Return ONLY a valid JSON object matching this schema without any markdown wrapping:
{
  "scenario_type": "${scenarioType}",
  "title": "${isImproved ? `A Letter of Gratitude from Future ${userName}` : `A Sincere Wake-Up Call from Future ${userName}`}",
  "subtitle": "Special Delivery from 5 Years Later (2031)",
  "seal_badge": "${isImproved ? '✦ Sealed with Hope' : '⚠ Warning Notice'}",
  "greeting": "Dear ${userName},",
  "paragraphs": [
    "First paragraph setting the scene in 2031 and directly acknowledging their exact 2026 behavioral state...",
    "Second paragraph breaking down the compounding mathematical cost or dividend of their specific numbers (${sleep}h sleep, ${study}h study, ${screen}h screen)...",
    "Third paragraph analyzing financial impact (₹${spending}/day) and emotional/career trajectory over the 5-year span...",
    "Fourth paragraph delivering a poignant, unforgettable call to action or message of deep gratitude..."
  ],
  "closing": "${isImproved ? 'With boundless gratitude and pride,' : 'With urgent love and hope,'}",
  "signature": "You, from 5 Years in the Future"
}
`;
  }

  /**
   * Production Dynamic Generative Behavioral Synthesis Engine
   * Generates tailored prose based on the exact numbers provided
   */
  static generateDynamicSynthesis(userName, scenarioType, metrics, archetype) {
    const { sleep, study, screen, exercise, spending, hydration, productivityScore } = metrics;
    const isImproved = scenarioType === 'improved';

    const annualScreenHours = Math.round(screen * 365);
    const fiveYearScreenHours = annualScreenHours * 5;
    const annualStudyHours = Math.round(study * 365);
    const fiveYearStudyHours = annualStudyHours * 5;
    const annualSpending = Math.round(spending * 365);
    const fiveYearSpending = annualSpending * 5;
    const fiveYearSavings = Math.round((600 - Math.min(600, spending)) * 365 * 5);
    const annualScreenDays = Math.round(annualScreenHours / 24);

    // =========================================================================
    // ARCHETYPE 1: DOING NOTHING / COMPLETE INERTIA
    // =========================================================================
    if (archetype.id === 'doing_nothing') {
      if (isImproved) {
        return {
          scenario_type: 'improved',
          title: `From Zero Momentum to Transcendent Freedom`,
          subtitle: `Special Delivery from 5 Years Later (2031) · Inaction Broken`,
          seal_badge: `✦ The Turning Point of Hope`,
          greeting: `Dear ${userName},`,
          paragraphs: [
            `I am writing to you from 2031 on a tranquil morning, surrounded by a life of vitality, respect, and deep creative mastery. As I looked back across the years, I felt an overwhelming urge to send this dispatch to that specific room in November 2026. I remember vividly when your daily habit logs showed a paralyzing ${study.toFixed(1)} hours of study and ${exercise.toFixed(1)} hours of physical activity, while ${screen.toFixed(1)} hours disappeared into the blue glow of endless feeds. In those quiet hours, you wondered if any favorable future could ever emerge from a complete dead stop.`,
            `Thank you for making the bravest choice possible: proving that you don't have to stay stuck in inertia. You didn't attempt an impossible overnight overhaul; you simply refused to let another day slip away doing nothing. You closed the algorithm, reclaimed the ${Math.max(1200, Math.round(screen * 365 * 0.6)).toLocaleString()} hours a year that were vanishing into digital fog, and dedicated that first sacred hour to genuine study. Starting from zero was terrifying, but that decision to move was the spark that ignited everything I am today.`,
            `Look at how that single choice compounded over five years: your lifestyle productivity score surged from a dormant ${productivityScore} to over 94. Controlling your daily spending of ₹${Math.round(spending)}/day built an investment reserve exceeding ₹${Math.max(fiveYearSavings, 520000).toLocaleString('en-IN')}. Your body grew resilient with daily movement, and the brain fog that once felt permanent dissolved into laser clarity. Opportunities that once seemed reserved for others are now your daily reality.`,
            `Never doubt what happens when you choose action over stillness. Every time you choose your long-term vision over the immediate comfort of doing nothing, you are actively forging my existence. I am waiting for you here in 2031—and you will be astonished by the person you become.`
          ],
          closing: `With boundless pride and gratitude,`,
          signature: `You, from 5 Years in the Future`
        };
      } else {
        return {
          scenario_type: 'unimproved',
          title: `A Wake-Up Call on the Cost of Inertia`,
          subtitle: `Special Delivery from 5 Years Later (2031) · Warning Notice`,
          seal_badge: `⚠ Zero Progress Warning`,
          greeting: `Dear ${userName},`,
          paragraphs: [
            `I am writing to you from 2031 with a heavy heart, because someone has to tell you the unvarnished truth before the calendar runs out. Sitting where you are right now in late 2026, you might secretly wonder: "What is the favorable outcome if I continue doing nothing? Can passive days somehow work themselves out?" I am living on the other side of that postponement, and I need to tell you: there is no favorable outcome hidden in inaction. Inaction is not neutral—it is an active surrender.`,
            `Over the past five years, living on ${sleep.toFixed(1)} hours of sleep while logging ${study.toFixed(1)} hours of study and ${exercise.toFixed(1)} hours of exercise allowed ${fiveYearScreenHours.toLocaleString()} hours to evaporate into feeds and notifications. That is ${annualScreenDays} full 24-hour days every single year given away to strangers' content while your own life remained on pause. Without building new skills or moving your body, intellectual rust set in, self-doubt deepened, and the world moved forward without us.`,
            `The financial and emotional erosion was absolute. Spending ₹${Math.round(spending)}/day on quick impulse deliveries and dopamine treats to cope with the boredom of inertia drained ₹${fiveYearSpending.toLocaleString('en-IN')} without leaving a single asset or emergency fund behind. Our productivity score remained trapped at ${productivityScore}/100. The heaviest burden I carry today is not failure—it is knowing that we possessed limitless potential, but allowed five precious years to pass without ever truly beginning.`,
            `This letter is your wake-up call, not your condemnation. The timeline has not solidified yet. You still hold the pen. Turn off the screen tonight, get 8 hours of deep sleep, open a book for just thirty minutes, and break this loop of doing nothing before it becomes our permanent destiny.`
          ],
          closing: `With urgent love and hope,`,
          signature: `You, from 5 Years in the Future`
        };
      }
    }

    // =========================================================================
    // ARCHETYPE 2: SEVERE BURNOUT & DOOMSCROLLING CRISIS
    // =========================================================================
    if (archetype.id === 'burnout') {
      if (isImproved) {
        return {
          scenario_type: 'improved',
          title: `Reclaimed from the Edge of Burnout`,
          subtitle: `Special Delivery from 5 Years Later (2031) · Vitality Restored`,
          seal_badge: `✦ Sealed with Hope`,
          greeting: `Dear ${userName},`,
          paragraphs: [
            `I am writing this from 2031 on a crisp morning, feeling alert, vibrant, and in total command of my life. I had to write back to that exhausting week in November 2026 when you were drowning in ${screen.toFixed(1)} hours of screen time and surviving on just ${sleep.toFixed(1)} hours of broken sleep. You felt like you were sprinting on a treadmill that was speeding up while your energy was giving out.`,
            `Thank you for having the courage to step off that cliff. When you set boundaries on your phone and cut out over ${Math.round((screen - 3.0) * 365).toLocaleString()} hours of mindless scrolling per year, you gifted yourself back your sanity. You restored your sleep to 8 restful hours, reintroduced ${Math.max(exercise, 0.8).toFixed(1)}h of physical training, and gave your mind room to breathe.`,
            `That single pivot saved us. Your productivity score climbed from ${productivityScore} to 92. Rather than leaking ₹${Math.round(spending)}/day on late-night stress ordering, you channeled those funds into an investment portfolio worth ₹${Math.max(fiveYearSavings, 480000).toLocaleString('en-IN')}. The chronic headaches and brain fog vanished, replaced by sharp mental clarity and genuine joy.`,
            `Every time you put your phone in another room at 10 PM and choose restorative sleep, you are building the peace I enjoy today. Keep protecting your energy—it is the foundation of our entire future.`
          ],
          closing: `With boundless gratitude,`,
          signature: `You, from 5 Years in the Future`
        };
      } else {
        return {
          scenario_type: 'unimproved',
          title: `The Predictable Crash of Chronic Drift`,
          subtitle: `Special Delivery from 5 Years Later (2031) · Crisis Warning`,
          seal_badge: `⚠ Crisis Warning Notice`,
          greeting: `Dear ${userName},`,
          paragraphs: [
            `I am writing to you from 2031 from a place of chronic exhaustion that you could have prevented. In 2026, you treated ${screen.toFixed(1)} hours of daily screen time and ${sleep.toFixed(1)} hours of sleep as an unfortunate but inevitable habit. I am here to tell you where that road leads after five continuous years.`,
            `Surrendering ${fiveYearScreenHours.toLocaleString()} hours to dopamine algorithms completely shattered our nervous system. Living in a perpetual state of sleep deficit destroyed our working memory and attention span, keeping daily study trapped at just ${study.toFixed(1)} hours. When colleagues were taking on complex responsibilities, we were simply struggling to stay awake through the afternoon.`,
            `Financially, spending ₹${Math.round(spending)}/day on retail therapy and fast food to self-medicate exhaustion drained over ₹${fiveYearSpending.toLocaleString('en-IN')}. With a productivity score stagnating at ${productivityScore}/100, we missed promotions and watched our self-confidence crumble under the weight of unkept promises.`,
            `Do not let this become your reality. Tonight, power off the devices before 11 PM. Sleep for 8 continuous hours. Drink water. Your body is screaming for a reset—listen to it before the damage becomes irreversible.`
          ],
          closing: `With urgent concern,`,
          signature: `You, from 5 Years in the Future`
        };
      }
    }

    // =========================================================================
    // ARCHETYPE 3: ACADEMIC SPRINT & HIGH STUDY IMBALANCE
    // =========================================================================
    if (archetype.id === 'exam_crunch') {
      if (isImproved) {
        return {
          scenario_type: 'improved',
          title: `Sustainable Genius: The Power of Balance`,
          subtitle: `Special Delivery from 5 Years Later (2031) · Mastery Achieved`,
          seal_badge: `✦ Mastery & Balance`,
          greeting: `Dear ${userName},`,
          paragraphs: [
            `I am writing to you from 2031 as a recognized leader in our field. In late 2026, your hunger was admirable—logging ${study.toFixed(1)} hours of intense study—but your foundation was fragile, sacrificing sleep down to ${sleep.toFixed(1)} hours.`,
            `Thank you for realizing that true intellect requires biological sustainability. When you protected 7.5 to 8 hours of sleep and kept screen distractions under control at ${Math.min(screen, 3.0).toFixed(1)}h, your comprehension skyrocketed. You learned faster in 4 hours of well-rested focus than you ever did during 7-hour sleep-deprived marathons.`,
            `That balance propelled our productivity score from ${productivityScore} to 96. By maintaining disciplined spending of ₹${Math.round(spending)}/day, we graduated debt-free with emergency savings. We entered high-impact roles with energy to spare, while our peers were already burning out.`,
            `Keep working with wisdom rather than brute force. Respecting your sleep is not a compromise—it is your unfair competitive advantage.`
          ],
          closing: `With deep pride and admiration,`,
          signature: `You, from 5 Years in the Future`
        };
      } else {
        return {
          scenario_type: 'unimproved',
          title: `The Fragile Engine: When Ambition Breaks`,
          subtitle: `Special Delivery from 5 Years Later (2031) · Burnout Warning`,
          seal_badge: `⚠ Depletion Warning`,
          greeting: `Dear ${userName},`,
          paragraphs: [
            `I am writing to you from 2031 with the bittersweet knowledge of what could have been. In 2026, you poured ${study.toFixed(1)} hours a day into your craft, believing that surviving on ${sleep.toFixed(1)} hours of sleep was a badge of honor.`,
            `The human body keeps an unforgiving ledger. That sleep debt compounded, and by year three, the chronic cognitive fatigue led to severe brain fog and diminishing returns. The hours you spent staring at material without retaining it multiplied, while screen time crept up to ${screen.toFixed(1)}h simply trying to distract your exhausted mind.`,
            `Spending ₹${Math.round(spending)}/day on energy drinks, takeout, and quick fixes cost over ₹${fiveYearSpending.toLocaleString('en-IN')}. Despite all your intellect, burnout forced extended leaves of absence, and opportunities you worked so hard for slipped through our fingers.`,
            `Brute force cannot substitute for recovery. Tonight, close the notes. Prioritize 8 hours of sleep. Sustainable brilliance will always beat frantic exhaustion.`
          ],
          closing: `With profound concern,`,
          signature: `You, from 5 Years in the Future`
        };
      }
    }

    // =========================================================================
    // ARCHETYPE 4: BASELINE & GENERAL LIFESTYLE DRIFT (DEFAULT)
    // =========================================================================
    if (isImproved) {
      const reclaimedHours = Math.max(600, Math.round(Math.max(0, screen - 2.5) * 365));
      const studyGains = Math.round(Math.max(4.0 - study, 1.5) * 365);

      return {
        scenario_type: 'improved',
        title: `A Letter of Gratitude from Future ${userName}`,
        subtitle: `Special Delivery from 5 Years Later (2031) · Trajectory Mastered`,
        seal_badge: `✦ Sealed with Hope`,
        greeting: `Dear ${userName},`,
        paragraphs: [
          `I am writing this to you on a crisp autumn morning, five years ahead of where you sit today. As I look out the window at the life we built, I had to pause and send this dispatch back across time to say two simple words: thank you. I remember vividly when your days felt dictated by ${screen.toFixed(1)} hours of screen time and you survived on just ${sleep.toFixed(1)} hours of restless sleep, feeling like momentum was perpetually slipping through your fingers.`,
          `Thank you for making the brave decision to change the trajectory. When you cut back those scrolling hours and reclaimed over ${reclaimedHours.toLocaleString()} hours a year, you redirected that energy into ${Math.max(study, 3.8).toFixed(1)} hours of disciplined daily study. You started prioritizing ${Math.max(exercise, 0.8).toFixed(1)}h of physical training and kept hydration at a clean ${Math.max(hydration, 2.5).toFixed(1)}L. Nobody was applauding you in those quiet early mornings, but each 1% choice was an invisible deposit into the freedom I possess today.`,
          `By compounding your focus, that productivity score climbed from ${productivityScore} straight past 90. Financially, managing your daily spending of ₹${Math.round(spending)}/day blossomed into an investment corpus worth over ₹${Math.max(fiveYearSavings, 450000).toLocaleString('en-IN')}. More than the money or accolades, it gave us peace of mind. Our thoughts are calm, our energy is boundless, and we wake up every morning with a sense of purpose rather than exhaustion.`,
          `Keep climbing. Every time you close the laptop at night, put the phone in another room, and choose your future over instant dopamine, you are pulling me closer to reality. I am waiting for you here in 2031—and you will love the person you become.`
        ],
        closing: `With boundless gratitude and pride,`,
        signature: `You, from 5 Years in the Future`
      };
    } else {
      return {
        scenario_type: 'unimproved',
        title: `A Sincere Wake-Up Call from Future ${userName}`,
        subtitle: `Special Delivery from 5 Years Later (2031) · Warning Notice`,
        seal_badge: `⚠ Warning Notice`,
        greeting: `Dear ${userName},`,
        paragraphs: [
          `I am writing to you from 2031 with a heavy heart, because someone has to tell you the truth before the calendar runs out. Right now, in November 2026, you believe you have infinite time to turn things around. But I am living on the other side of that postponement, and I need you to understand what happens if you stay on this exact track.`,
          `Over the past five years, living on ${sleep.toFixed(1)} hours of sleep while giving ${screen.toFixed(1)} hours every single day to notifications and algorithms consumed ${fiveYearScreenHours.toLocaleString()} hours of your life. That is ${annualScreenDays} full 24-hour days every year surrendered to other people's creations, while your own study hours hovered at just ${study.toFixed(1)}h. Your body felt the toll too—with only ${exercise.toFixed(1)}h of movement, brain fog became your default baseline.`,
          `The financial and emotional erosion was gradual, but devastating. With daily spending averaging ₹${Math.round(spending)}/day on impulse comforts to cope with fatigue, over ₹${Math.round(annualSpending * 5).toLocaleString('en-IN')} vanished into thin air without building an emergency cushion or freedom fund. Your productivity score remained trapped near ${productivityScore}, and career opportunities that should have been yours were quietly handed to peers who simply protected their focus.`,
          `This letter is not meant to shame you—it is your lifeline. The timeline has not solidified yet. You still hold the pen. Turn off the notifications tonight, get 8 hours of restorative sleep, open the books, and break this loop before it becomes our permanent reality.`
        ],
        closing: `With urgent love and concern,`,
        signature: `You, from 5 Years in the Future`
      };
    }
  }
}
