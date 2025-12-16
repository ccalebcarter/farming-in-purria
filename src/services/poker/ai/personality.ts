/**
 * T-090, T-091, T-092: Dealer Personality and Dialogue System
 */
import type {
  DifficultyLevel,
  GameSituation,
  DialogueContext,
  DialogueStyle,
} from '@/types/ai.types'

/**
 * T-090: DealerPersonality class
 */
export interface DealerPersonality {
  difficulty: DifficultyLevel
  name: string
  avatar: string
  dialogueStyle: DialogueStyle
  traits: string[]
  catchphrase: string
}

/**
 * Personality presets for each difficulty
 */
const PERSONALITY_PRESETS: Record<DifficultyLevel, DealerPersonality> = {
  seedling: {
    difficulty: 'seedling',
    name: 'Sunny',
    avatar: 'seedling-dealer',
    dialogueStyle: 'friendly',
    traits: ['encouraging', 'patient', 'helpful'],
    catchphrase: "Let's have fun!",
  },
  sprout: {
    difficulty: 'sprout',
    name: 'Fern',
    avatar: 'sprout-dealer',
    dialogueStyle: 'professional',
    traits: ['balanced', 'fair', 'instructive'],
    catchphrase: 'May the best hand win.',
  },
  bloom: {
    difficulty: 'bloom',
    name: 'Rose',
    avatar: 'bloom-dealer',
    dialogueStyle: 'competitive',
    traits: ['confident', 'challenging', 'sharp'],
    catchphrase: 'Think you can keep up?',
  },
  harvest: {
    difficulty: 'harvest',
    name: 'Thornwood',
    avatar: 'harvest-dealer',
    dialogueStyle: 'stoic',
    traits: ['intense', 'calculating', 'mysterious'],
    catchphrase: 'Your credits... or your pride.',
  },
}

/**
 * Create personality for a difficulty level
 */
export function createPersonality(difficulty: DifficultyLevel): DealerPersonality {
  return { ...PERSONALITY_PRESETS[difficulty] }
}

/**
 * T-091: Dialogue lines per difficulty and situation
 */
export const DIALOGUE_LINES: Record<DifficultyLevel, Record<GameSituation, string[]>> = {
  seedling: {
    'game-start': [
      "Welcome to the table! Let's have a great game!",
      "Ready to play? I'll go easy on you!",
      'Good luck! Remember, the goal is to have fun!',
    ],
    'player-wins': [
      'Nice play! You earned that one!',
      'Well done! Your strategy paid off!',
      "Great hand! You're doing wonderfully!",
    ],
    'dealer-wins': [
      "I got lucky there! You'll get the next one!",
      "Don't worry, that's just how the cards fell!",
      'Close game! You almost had me!',
    ],
    'tie': [
      "A tie! That's an interesting outcome!",
      'We both played well there!',
      'Split pot! Fair is fair!',
    ],
    'player-folds': [
      'Smart move knowing when to fold!',
      "Sometimes discretion is the better part of valor!",
      'Saving your chips for a better hand!',
    ],
    'dealer-folds': [
      'You got me that time! Good pressure!',
      "I'll wait for a better spot!",
      'Your bet was too strong to call!',
    ],
    'big-pot': [
      'Wow, this pot is getting big!',
      'Exciting hand building here!',
      'High stakes! Play carefully!',
    ],
    'big-raise': [
      'A bold move! Interesting...',
      'Raising the stakes! I like it!',
      "That's a confident bet!",
    ],
    'all-in': [
      'All in! This is exciting!',
      'Going for it all! Brave move!',
      'The ultimate test!',
    ],
    'jackpot': [
      'JACKPOT! Amazing! Congratulations!',
      "Incredible! You hit the jackpot! That's wonderful!",
      'What a moment! You deserve this!',
    ],
    'streak-active': [
      "You're on fire! Keep it up!",
      'What a streak! Impressive!',
      'The hot hand continues!',
    ],
    'streak-broken': [
      'Streak ended, but you did great!',
      "All good things come to an end! You'll start another!",
      'Reset! Fresh start for new wins!',
    ],
    'royal-flush': [
      'A ROYAL FLUSH! I never see those! Amazing!',
      'The ultimate hand! What an honor to witness!',
      "Incredible! That's the best possible hand!",
    ],
    'bluff-caught': [
      'Haha, you caught my bluff! Well played!',
      'Oops! You saw right through me!',
      'Okay, you got me there!',
    ],
    'session-end': [
      'Great playing with you! Come back soon!',
      'Thanks for the games! See you next time!',
      "That was fun! Let's do it again!",
    ],
  },
  sprout: {
    'game-start': [
      "Welcome. Let's see what you've got.",
      'Ready for a proper game? Take your seat.',
      'The cards are shuffled. May fortune favor the skilled.',
    ],
    'player-wins': [
      'Well played. You made the right call.',
      'Good read on that hand.',
      'Solid play. You earned it.',
    ],
    'dealer-wins': [
      'This one goes to me.',
      'The odds were in my favor.',
      'A calculated risk that paid off.',
    ],
    'tie': [
      'Even match this hand.',
      'We split. Fair outcome.',
      'Neither of us bested the other.',
    ],
    'player-folds': [
      'Prudent decision.',
      'Knowing when to fold is wisdom.',
      'Live to fight another hand.',
    ],
    'dealer-folds': [
      "You've got me this time.",
      "I'll concede this one.",
      'Well pressured.',
    ],
    'big-pot': [
      "Substantial pot building. Choose wisely.",
      'The stakes are rising.',
      'This hand matters.',
    ],
    'big-raise': [
      'Interesting raise. Confident?',
      'You want to play for more? Very well.',
      'Raising the stakes.',
    ],
    'all-in': [
      'All in. Commitment noted.',
      "This is where it counts.",
      'Maximum pressure. Understood.',
    ],
    'jackpot': [
      'Jackpot! Excellent achievement.',
      'The progressive is yours. Congratulations.',
      'A jackpot winner. Well deserved.',
    ],
    'streak-active': [
      "You're running hot. Capitalize on it.",
      'Streak continues. Stay focused.',
      'Momentum is with you.',
    ],
    'streak-broken': [
      'Streak ends. New opportunities ahead.',
      'Back to baseline. Rebuild.',
      'The run concludes.',
    ],
    'royal-flush': [
      'Royal flush. The pinnacle of poker. Impressive.',
      'The best hand possible. A rare achievement.',
      'Royalty at the table.',
    ],
    'bluff-caught': [
      'You saw through it. Credit where due.',
      'My timing was off. Well spotted.',
      'Fair enough. You called correctly.',
    ],
    'session-end': [
      'Good session. Until next time.',
      'The games conclude. Return when ready.',
      'Thank you for the competition.',
    ],
  },
  bloom: {
    'game-start': [
      "Ready to lose some credits? Let's go.",
      "I hope you brought your A-game.",
      "Don't expect any mercy at this table.",
    ],
    'player-wins': [
      'Fine. Take it. But this changes nothing.',
      "Enjoy it while it lasts.",
      "Lucky break. Won't happen again.",
    ],
    'dealer-wins': [
      'As expected.',
      "Did you really think you'd win that?",
      'Another one for me. Surprised?',
    ],
    'tie': [
      "A tie? How... disappointing.",
      "Neither wins. We'll settle this next hand.",
      'Split it. For now.',
    ],
    'player-folds': [
      'Running away already?',
      'Smart. You knew you were beat.',
      "Couldn't handle the heat?",
    ],
    'dealer-folds': [
      "You got lucky. That won't last.",
      "Enjoy this small victory.",
      'I pick my battles.',
    ],
    'big-pot': [
      'Now it gets interesting.',
      'Big pot? Perfect.',
      'This is what I live for.',
    ],
    'big-raise': [
      'Is that supposed to scare me?',
      'Bold. Foolish, but bold.',
      'Finally showing some spine.',
    ],
    'all-in': [
      'All in? Bring it.',
      "Now we're playing real poker.",
      'This is where legends are made.',
    ],
    'jackpot': [
      "Jackpot? Whatever. I'll win it back.",
      'Congrats... I suppose.',
      "Don't let it go to your head.",
    ],
    'streak-active': [
      "Don't get cocky. Streaks end.",
      "Riding high? I'll bring you down.",
      'Enjoy it while you can.',
    ],
    'streak-broken': [
      'There it is. Back to reality.',
      'Told you it would end.',
      'What goes up must come down.',
    ],
    'royal-flush': [
      'A royal... Respect. This time.',
      "That's... actually impressive.",
      'The best hand. I acknowledge it.',
    ],
    'bluff-caught': [
      'So you can read after all.',
      "Fine. You caught me. Happy?",
      'One bluff. It happens.',
    ],
    'session-end': [
      'Running away? Come back when you can handle more.',
      'Until next time. Bring more credits.',
      "We're not done. Not by a long shot.",
    ],
  },
  harvest: {
    'game-start': [
      '...',
      'Sit. Play. Learn.',
      'The harvest awaits.',
    ],
    'player-wins': [
      '...noted.',
      'Acceptable.',
      'Continue.',
    ],
    'dealer-wins': [
      'Inevitable.',
      'As foreseen.',
      '...',
    ],
    'tie': [
      'Balance.',
      '...',
      'Even.',
    ],
    'player-folds': [
      'Wise.',
      'Self-preservation.',
      '...',
    ],
    'dealer-folds': [
      'Strategic retreat.',
      'Not yet.',
      '...',
    ],
    'big-pot': [
      'The stakes reveal all.',
      'Pressure separates the weak.',
      '...',
    ],
    'big-raise': [
      'Aggression noted.',
      '...interesting.',
      'Bold.',
    ],
    'all-in': [
      'All or nothing. I respect that.',
      'The ultimate decision.',
      'Now we see who you are.',
    ],
    'jackpot': [
      'The harvest is yours. For now.',
      'Fortune smiles. Briefly.',
      '...impressive.',
    ],
    'streak-active': [
      'Momentum. Use it or lose it.',
      'The flame burns bright.',
      '...',
    ],
    'streak-broken': [
      'All flames extinguish.',
      'Back to nothing.',
      '...',
    ],
    'royal-flush': [
      '...the rarest bloom.',
      'Perfection. Witnessed.',
      'In all my seasons... remarkable.',
    ],
    'bluff-caught': [
      'Perceptive.',
      'You learn.',
      '...fair.',
    ],
    'session-end': [
      'The harvest continues.',
      'Return. If you dare.',
      '...until then.',
    ],
  },
}

// Fallback lines for any undefined situations
const FALLBACK_LINES: Record<DifficultyLevel, string> = {
  seedling: "Let's keep playing!",
  sprout: 'The game continues.',
  bloom: 'Make your move.',
  harvest: '...',
}

/**
 * Get a dialogue line for a situation
 */
export function getDialogueLine(difficulty: DifficultyLevel, situation: GameSituation): string {
  const lines = DIALOGUE_LINES[difficulty]?.[situation]
  if (!lines || lines.length === 0) {
    return FALLBACK_LINES[difficulty]
  }
  // Random selection from available lines
  const index = Math.floor(Math.random() * lines.length)
  return lines[index]
}

/**
 * T-092: Dialogue trigger result
 */
export interface DialogueTriggerResult {
  shouldSpeak: boolean
  situation: GameSituation
  priority: 'low' | 'normal' | 'high'
  delay: number
}

/**
 * Get dialogue triggers for a context
 */
export function getDialogueTriggers(context: DialogueContext): DialogueTriggerResult {
  const { situation, potSize, streak } = context

  // Determine priority based on situation
  let priority: 'low' | 'normal' | 'high' = 'normal'
  let delay = 500 // Default delay in ms

  switch (situation) {
    case 'jackpot':
    case 'royal-flush':
      priority = 'high'
      delay = 0
      break
    case 'all-in':
    case 'streak-active':
      priority = 'high'
      delay = 300
      break
    case 'big-pot':
    case 'big-raise':
      priority = 'normal'
      delay = 500
      break
    case 'player-folds':
    case 'dealer-folds':
      priority = 'low'
      delay = 700
      break
    default:
      priority = 'normal'
      delay = 500
  }

  // Boost priority for big streaks
  if (situation === 'streak-active' && streak && streak >= 5) {
    priority = 'high'
  }

  // Boost priority for very large pots
  if (situation === 'big-pot' && potSize && potSize >= 1000) {
    priority = 'high'
  }

  return {
    shouldSpeak: true,
    situation,
    priority,
    delay,
  }
}

/**
 * Get all possible situations
 */
export function getAllSituations(): GameSituation[] {
  return [
    'game-start',
    'player-wins',
    'dealer-wins',
    'tie',
    'player-folds',
    'dealer-folds',
    'big-pot',
    'big-raise',
    'all-in',
    'jackpot',
    'streak-active',
    'streak-broken',
    'royal-flush',
    'bluff-caught',
    'session-end',
  ]
}

/**
 * Get personality for dialogue style selection
 */
export function getDialogueStyle(difficulty: DifficultyLevel): DialogueStyle {
  return PERSONALITY_PRESETS[difficulty].dialogueStyle
}
