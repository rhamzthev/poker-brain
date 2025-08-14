import { useState, useEffect } from "react";
import { Check, X, RotateCcw, HelpCircle } from "lucide-react";

// Wallpaper configuration
const WALLPAPER_SIZE = "64px";

// Background style for consistent wallpaper across all screens
const wallpaperStyle = {
  backgroundImage: "url(/floor.svg)",
  backgroundRepeat: "repeat" as const,
  backgroundSize: `${WALLPAPER_SIZE} ${WALLPAPER_SIZE}`,
};

interface Term {
  term: string;
  definition: string;
}

interface PokerTerms {
  positions: Term[];
  general: Term[];
  actions: Term[];
  hands: Term[];
  other: Term[];
}

interface SuitToChar {
  [key: string]: string;
}

const SUIT_TO_CHAR: SuitToChar = {
  "♣": "C",
  "♦": "D",
  "♥": "H",
  "♠": "S",
};

// Poker terms dictionary
const pokerTerms: PokerTerms = {
  positions: [
    {
      term: "UTG",
      definition:
        "Under the Gun - First position to act preflop, immediately left of the big blind",
    },
    { term: "UTG+1", definition: "One seat to the left of UTG" },
    { term: "UTG+2", definition: "Two seats to the left of UTG" },
    {
      term: "MP",
      definition: "Middle Position - Seats in the middle of the table",
    },
    { term: "Hijack", definition: "Two seats to the right of the button" },
    { term: "Cutoff/CO", definition: "One seat to the right of the button" },
    {
      term: "Button",
      definition: "Dealer position - Last to act postflop, best position",
    },
    {
      term: "SB",
      definition: "Small Blind - Forced bet, first to act postflop",
    },
    {
      term: "BB",
      definition: "Big Blind - Larger forced bet, second to act postflop",
    },
  ],
  general: [
    { term: "Villain", definition: "Your opponent(s) in the hand" },
    { term: "Hero", definition: "You - the player making decisions" },
    {
      term: "Pot Odds",
      definition: "Ratio of current pot size to the cost of a call",
    },
    { term: "Equity", definition: "Your percentage chance of winning the pot" },
    {
      term: "GTO",
      definition: "Game Theory Optimal - Mathematically balanced strategy",
    },
    {
      term: "EV",
      definition: "Expected Value - Average profit/loss of a decision",
    },
    { term: "Outs", definition: "Cards that will improve your hand" },
    { term: "Implied Odds", definition: "Pot odds considering future betting" },
  ],
  actions: [
    {
      term: "Limp",
      definition: "Call the big blind preflop instead of raising",
    },
    { term: "Raise", definition: "Increase the bet size" },
    { term: "3-bet", definition: "Re-raise after an initial raise" },
    { term: "4-bet", definition: "Re-raise after a 3-bet" },
    { term: "All-in/Shove", definition: "Bet all remaining chips" },
    {
      term: "Check",
      definition: "Pass action without betting (when no bet is required)",
    },
    { term: "Call", definition: "Match the current bet" },
    { term: "Fold", definition: "Surrender your hand and forfeit the pot" },
    {
      term: "Isolation Raise",
      definition: "Raise to play heads-up against a specific player",
    },
  ],
  hands: [
    { term: "Set", definition: "Three of a kind using a pocket pair" },
    { term: "Trips", definition: "Three of a kind using one hole card" },
    { term: "Two Pair", definition: "Two different pairs" },
    { term: "Overpair", definition: "Pocket pair higher than any board card" },
    { term: "Top Pair", definition: "Pair using the highest board card" },
    { term: "Nut/Nuts", definition: "The best possible hand" },
    { term: "Draw", definition: "Incomplete hand that needs improvement" },
    {
      term: "Flush Draw",
      definition: "Four cards of the same suit, needing one more",
    },
    {
      term: "Straight Draw",
      definition: "Four cards to a straight, needing one more",
    },
  ],
  other: [
    { term: "Flop", definition: "First three community cards" },
    { term: "Turn", definition: "Fourth community card" },
    { term: "River", definition: "Fifth and final community card" },
    { term: "Board", definition: "All community cards" },
    { term: "Suited", definition: "Cards of the same suit (♠♥♦♣)" },
    { term: "Offsuit/o", definition: "Cards of different suits" },
    {
      term: "Pocket Pair",
      definition: "Two cards of the same rank as hole cards",
    },
    { term: "Multiway", definition: "Pot with 3+ players" },
    { term: "Heads-up", definition: "Pot with only 2 players" },
  ],
};

interface Card {
  rank: string;
  suit: string;
}

interface Question {
  id: number;
  scenario: string;
  heroCards: Card[];
  board: Card[];
  options: string[];
  correct: number;
  rationale: string;
}

// Comprehensive question pool
const questionPool: Question[] = [
  // Preflop scenarios (25 questions)
  {
    id: 1,
    scenario:
      "You have A♠K♦ in late position. The pot is $10 after a player raises to $3. Two players call. What should you do?",
    heroCards: [
      { rank: "A", suit: "♠" },
      { rank: "K", suit: "♦" },
    ],
    board: [],
    options: ["FOLD", "CALL $3", "RAISE to $12", "ALL-IN"],
    correct: 2,
    rationale:
      "With AK in position against multiple opponents, you should RAISE to $12 for value and to thin the field. Your hand plays better heads-up and you have position.",
  },
  {
    id: 2,
    scenario:
      "You're in the big blind with 7♥2♣. Button raises to $6 in a $10 pot. What's your play?",
    heroCards: [
      { rank: "7", suit: "♥" },
      { rank: "2", suit: "♣" },
    ],
    board: [],
    options: ["FOLD", "CALL $4 more", "RAISE to $18", "CHECK"],
    correct: 0,
    rationale:
      "FOLD is correct. 72o is one of the worst starting hands. Even with pot odds of 3.5:1, this hand has only 32% equity against a button raising range.",
  },
  {
    id: 3,
    scenario:
      "UTG raises to $8, you have Q♠Q♥ on the button. The pot is $11. What's your move?",
    heroCards: [
      { rank: "Q", suit: "♠" },
      { rank: "Q", suit: "♥" },
    ],
    board: [],
    options: ["FOLD", "CALL $8", "RAISE to $24", "ALL-IN for $100"],
    correct: 2,
    rationale:
      "RAISE to $24 (3x the original raise). QQ is a premium hand that plays well in position. You want to build the pot while likely ahead of UTG's range.",
  },
  {
    id: 4,
    scenario:
      "You have J♦T♦ in middle position. It folds to you. Blinds are $1/$2. What should you do?",
    heroCards: [
      { rank: "J", suit: "♦" },
      { rank: "T", suit: "♦" },
    ],
    board: [],
    options: ["FOLD", "CALL $2", "RAISE to $6", "RAISE to $10"],
    correct: 2,
    rationale:
      "RAISE to $6 (3BB) is standard. JTs is a playable hand from middle position with good postflop potential. Opening with a standard raise is optimal.",
  },
  {
    id: 5,
    scenario:
      "Three players limp for $2, you have A♥A♣ on the button. The pot is $9. What's your action?",
    heroCards: [
      { rank: "A", suit: "♥" },
      { rank: "A", suit: "♣" },
    ],
    board: [],
    options: ["CALL $2", "RAISE to $8", "RAISE to $15", "ALL-IN"],
    correct: 2,
    rationale:
      "RAISE to $15 with pocket aces. Against multiple limpers, you need to raise large (5-7x) to thin the field and build a pot with the best starting hand.",
  },
  {
    id: 6,
    scenario:
      "You're under the gun with K♣J♠. Blinds are $2/$5. What's your play?",
    heroCards: [
      { rank: "K", suit: "♣" },
      { rank: "J", suit: "♠" },
    ],
    board: [],
    options: ["FOLD", "CALL $5", "RAISE to $15", "RAISE to $25"],
    correct: 0,
    rationale:
      "FOLD is correct. KJo is too weak to open from early position. It's easily dominated and plays poorly out of position against calling ranges.",
  },
  {
    id: 7,
    scenario:
      "Button raises to $10, you have 8♦8♣ in the big blind. Pot is $15. What should you do?",
    heroCards: [
      { rank: "8", suit: "♦" },
      { rank: "8", suit: "♣" },
    ],
    board: [],
    options: ["FOLD", "CALL $5 more", "RAISE to $30", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $5 more. Medium pocket pairs play well as calls against late position raises. You're getting 4:1 pot odds and can win a big pot when you hit a set.",
  },
  {
    id: 8,
    scenario:
      "You have 5♥5♠ in the cutoff. Two players limp for $2. Pot is $7. What's your move?",
    heroCards: [
      { rank: "5", suit: "♥" },
      { rank: "5", suit: "♠" },
    ],
    board: [],
    options: ["FOLD", "CALL $2", "RAISE to $8", "RAISE to $12"],
    correct: 1,
    rationale:
      "CALL $2 to set mine. Small pocket pairs have great implied odds in multiway pots. You're looking to hit a set (12% chance) and win a big pot.",
  },
  {
    id: 9,
    scenario:
      "UTG+1 raises to $12, you have A♣Q♦ in the hijack. Pot is $15. What's optimal?",
    heroCards: [
      { rank: "A", suit: "♣" },
      { rank: "Q", suit: "♦" },
    ],
    board: [],
    options: ["FOLD", "CALL $12", "RAISE to $35", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $12. AQo is strong but often dominated by early position raising ranges. Calling keeps their bluffs in and allows you to play in position postflop.",
  },
  {
    id: 10,
    scenario:
      "You're on the button with K♥Q♥. UTG raises to $15, MP calls. Pot is $38. Your play?",
    heroCards: [
      { rank: "K", suit: "♥" },
      { rank: "Q", suit: "♥" },
    ],
    board: [],
    options: ["FOLD", "CALL $15", "RAISE to $50", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $15. KQs has good playability in position against multiple opponents. You're getting 3.5:1 pot odds with a hand that flops well.",
  },
  {
    id: 11,
    scenario:
      "Small blind completes, you have 9♣2♦ in the big blind. Pot is $4. What should you do?",
    heroCards: [
      { rank: "9", suit: "♣" },
      { rank: "2", suit: "♦" },
    ],
    board: [],
    options: ["CHECK", "RAISE to $8", "RAISE to $12", "ALL-IN"],
    correct: 0,
    rationale:
      "CHECK and see a free flop. 92o is a weak hand, but you're already in for the big blind. No need to build a pot with a trash hand.",
  },
  {
    id: 12,
    scenario:
      "You have T♠T♥ UTG. Blinds are $5/$10. What's the optimal opening size?",
    heroCards: [
      { rank: "T", suit: "♠" },
      { rank: "T", suit: "♥" },
    ],
    board: [],
    options: ["FOLD", "CALL $10", "RAISE to $25", "RAISE to $35"],
    correct: 2,
    rationale:
      "RAISE to $25 (2.5x BB). Tens are strong enough to open from early position. A standard raise size balances your range and builds the pot.",
  },
  {
    id: 13,
    scenario:
      "Button opens to $20, small blind 3-bets to $65. You have J♣J♦ in the big blind. Pot is $95. Your move?",
    heroCards: [
      { rank: "J", suit: "♣" },
      { rank: "J", suit: "♦" },
    ],
    board: [],
    options: ["FOLD", "CALL $55 more", "RAISE to $180", "ALL-IN for $500"],
    correct: 1,
    rationale:
      "CALL $55 more. JJ is too strong to fold but doesn't want to face a 4-bet. Calling allows you to realize equity and potentially win a big pot postflop.",
  },
  {
    id: 14,
    scenario:
      "You're in the cutoff with A♠5♠. It folds to you. Blinds are $2/$5. What's your play?",
    heroCards: [
      { rank: "A", suit: "♠" },
      { rank: "5", suit: "♠" },
    ],
    board: [],
    options: ["FOLD", "CALL $5", "RAISE to $15", "RAISE to $25"],
    correct: 2,
    rationale:
      "RAISE to $15. A5s is a good stealing hand from late position with blocker value and nut flush potential. Standard 3x raise is optimal.",
  },
  {
    id: 15,
    scenario:
      "UTG raises to $25, UTG+1 calls. You have K♦K♠ on the button. Pot is $57. Your action?",
    heroCards: [
      { rank: "K", suit: "♦" },
      { rank: "K", suit: "♠" },
    ],
    board: [],
    options: ["CALL $25", "RAISE to $75", "RAISE to $100", "ALL-IN"],
    correct: 2,
    rationale:
      "RAISE to $100. With KK against multiple opponents, you want to build a big pot while likely ahead. This sizing charges draws and gets value from worse hands.",
  },
  {
    id: 16,
    scenario:
      "You have 6♥6♣ in middle position. UTG limps for $5. Pot is $12. What should you do?",
    heroCards: [
      { rank: "6", suit: "♥" },
      { rank: "6", suit: "♣" },
    ],
    board: [],
    options: ["FOLD", "CALL $5", "RAISE to $20", "RAISE to $30"],
    correct: 2,
    rationale:
      "RAISE to $20 for isolation. Against a limper, raising with small pairs can take down the pot preflop or allow you to play heads-up in position.",
  },
  {
    id: 17,
    scenario:
      "Three players limp, you have Q♦J♦ on the button. Pot is $17. What's optimal?",
    heroCards: [
      { rank: "Q", suit: "♦" },
      { rank: "J", suit: "♦" },
    ],
    board: [],
    options: ["FOLD", "CALL $5", "RAISE to $25", "RAISE to $35"],
    correct: 1,
    rationale:
      "CALL $5. QJs plays well multiway in position. You have great implied odds and can make strong draws. No need to bloat the pot preflop.",
  },
  {
    id: 18,
    scenario:
      "You're in the small blind with A♦K♣. Button raises to $30. Pot is $45. Your play?",
    heroCards: [
      { rank: "A", suit: "♦" },
      { rank: "K", suit: "♣" },
    ],
    board: [],
    options: ["FOLD", "CALL $20 more", "RAISE to $90", "ALL-IN for $400"],
    correct: 2,
    rationale:
      "RAISE to $90 (3x). AKo is a premium hand that wants to play for stacks. 3-betting builds the pot and often takes it down preflop.",
  },
  {
    id: 19,
    scenario:
      "MP raises to $15, CO calls. You have 9♠9♥ on the button. Pot is $37. What should you do?",
    heroCards: [
      { rank: "9", suit: "♠" },
      { rank: "9", suit: "♥" },
    ],
    board: [],
    options: ["FOLD", "CALL $15", "RAISE to $50", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $15. Nines play well in position against multiple opponents. You're getting good pot odds and can win big when you hit a set.",
  },
  {
    id: 20,
    scenario: "You have 4♣4♦ UTG. Blinds are $5/$10. What's the correct play?",
    heroCards: [
      { rank: "4", suit: "♣" },
      { rank: "4", suit: "♦" },
    ],
    board: [],
    options: ["FOLD", "CALL $10", "RAISE to $25", "RAISE to $35"],
    correct: 0,
    rationale:
      "FOLD is correct. Small pocket pairs are too weak to open from early position. They play poorly postflop out of position against calling ranges.",
  },
  {
    id: 21,
    scenario:
      "Button opens to $12, you have A♥T♥ in the big blind. Pot is $18. Your decision?",
    heroCards: [
      { rank: "A", suit: "♥" },
      { rank: "T", suit: "♥" },
    ],
    board: [],
    options: ["FOLD", "CALL $6 more", "RAISE to $36", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $6 more. ATs is too strong to fold getting 4:1 but not strong enough to 3-bet against a button opening range. Call and play postflop.",
  },
  {
    id: 22,
    scenario:
      "You're UTG+2 with K♠Q♣. UTG raises to $20. Pot is $27. What's your move?",
    heroCards: [
      { rank: "K", suit: "♠" },
      { rank: "Q", suit: "♣" },
    ],
    board: [],
    options: ["FOLD", "CALL $20", "RAISE to $60", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. KQo is often dominated by UTG opening ranges (AK, AQ, KK, QQ). It's not strong enough to call or 3-bet profitably.",
  },
  {
    id: 23,
    scenario:
      "Two limpers, you have 7♦7♣ in the cutoff. Pot is $12. What should you do?",
    heroCards: [
      { rank: "7", suit: "♦" },
      { rank: "7", suit: "♣" },
    ],
    board: [],
    options: ["FOLD", "CALL $5", "RAISE to $20", "RAISE to $30"],
    correct: 2,
    rationale:
      "RAISE to $20. Isolating limpers with pocket sevens allows you to take the lead and potentially win without showdown. Good for value and protection.",
  },
  {
    id: 24,
    scenario:
      "You have J♥J♠ in middle position. It folds to you. Blinds $2/$5. Optimal opening?",
    heroCards: [
      { rank: "J", suit: "♥" },
      { rank: "J", suit: "♠" },
    ],
    board: [],
    options: ["FOLD", "CALL $5", "RAISE to $15", "RAISE to $25"],
    correct: 2,
    rationale:
      "RAISE to $15 (3x BB). Jacks are a premium hand worth opening from any position. Standard sizing keeps your range balanced.",
  },
  {
    id: 25,
    scenario:
      "BB 3-bets to $45 after you opened to $15 with A♣J♣ from MP. Pot is $62. Your action?",
    heroCards: [
      { rank: "A", suit: "♣" },
      { rank: "J", suit: "♣" },
    ],
    board: [],
    options: ["FOLD", "CALL $30 more", "RAISE to $135", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. AJs is not strong enough to continue against a BB 3-bet. You're likely dominated by their value range and don't have position.",
  },

  // Post-flop scenarios (35 questions)
  {
    id: 26,
    scenario:
      "You have A♠K♥. Flop: K♦7♣2♥. You bet $25 into $50, villain raises to $75. What's your play?",
    heroCards: [
      { rank: "A", suit: "♠" },
      { rank: "K", suit: "♥" },
    ],
    board: [
      { rank: "K", suit: "♦" },
      { rank: "7", suit: "♣" },
      { rank: "2", suit: "♥" },
    ],
    options: ["FOLD", "CALL $50 more", "RAISE to $200", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $50 more. You have top pair top kicker on a dry board. Villain could be raising with worse kings, draws, or bluffs. Calling keeps their range wide.",
  },
  {
    id: 27,
    scenario:
      "You have 8♥8♣. Board: 9♠7♦6♣5♥. Pot is $100. Villain bets $75. Your decision?",
    heroCards: [
      { rank: "8", suit: "♥" },
      { rank: "8", suit: "♣" },
    ],
    board: [
      { rank: "9", suit: "♠" },
      { rank: "7", suit: "♦" },
      { rank: "6", suit: "♣" },
      { rank: "5", suit: "♥" },
    ],
    options: ["FOLD", "CALL $75", "RAISE to $200", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $75. You have the nut straight on a wet board. Calling allows worse hands to continue betting and disguises your hand strength.",
  },
  {
    id: 28,
    scenario:
      "You have Q♦Q♠. Flop: J♥T♣9♦. Pot $50. Opponent bets $40. What should you do?",
    heroCards: [
      { rank: "Q", suit: "♦" },
      { rank: "Q", suit: "♠" },
    ],
    board: [
      { rank: "J", suit: "♥" },
      { rank: "T", suit: "♣" },
      { rank: "9", suit: "♦" },
    ],
    options: ["FOLD", "CALL $40", "RAISE to $120", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. This board smashes many hands (KQ, Q8, 87) that beat your overpair. With so many straight possibilities, queens are too vulnerable.",
  },
  {
    id: 29,
    scenario:
      "You have A♥Q♥. Board: K♥J♥4♣2♥. Pot $150. You bet $100, villain goes all-in for $300. Your play?",
    heroCards: [
      { rank: "A", suit: "♥" },
      { rank: "Q", suit: "♥" },
    ],
    board: [
      { rank: "K", suit: "♥" },
      { rank: "J", suit: "♥" },
      { rank: "4", suit: "♣" },
      { rank: "2", suit: "♥" },
    ],
    options: ["FOLD", "CALL $200 more", "Already all-in", "Time out"],
    correct: 1,
    rationale:
      "CALL $200 more. You have the nut flush. Only a full house beats you, which is unlikely. Getting 2.75:1 pot odds, this is an easy call.",
  },
  {
    id: 30,
    scenario:
      "You have K♣K♦. Flop: A♠Q♦7♣. Pot $75. Villain leads $50. What's optimal?",
    heroCards: [
      { rank: "K", suit: "♣" },
      { rank: "K", suit: "♦" },
    ],
    board: [
      { rank: "A", suit: "♠" },
      { rank: "Q", suit: "♦" },
      { rank: "7", suit: "♣" },
    ],
    options: ["FOLD", "CALL $50", "RAISE to $150", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $50. The ace is concerning but folding KK on this flop is too weak. Many players bet with queens, draws, or bluffs. Call and evaluate turn.",
  },
  {
    id: 31,
    scenario:
      "You have 5♠5♥. Board: 5♦3♣2♠A♥. Pot $200. You check, villain bets $150. Your action?",
    heroCards: [
      { rank: "5", suit: "♠" },
      { rank: "5", suit: "♥" },
    ],
    board: [
      { rank: "5", suit: "♦" },
      { rank: "3", suit: "♣" },
      { rank: "2", suit: "♠" },
      { rank: "A", suit: "♥" },
    ],
    options: ["FOLD", "CALL $150", "RAISE to $400", "ALL-IN for $600"],
    correct: 2,
    rationale:
      "RAISE to $400. You have a set of fives. The ace likely improved villain's hand. Raise for value as they'll call with aces, two pair, and straights.",
  },
  {
    id: 32,
    scenario:
      "You have J♦T♦. Flop: Q♦9♦8♣. Pot $100. You bet $75, get raised to $225. What's your play?",
    heroCards: [
      { rank: "J", suit: "♦" },
      { rank: "T", suit: "♦" },
    ],
    board: [
      { rank: "Q", suit: "♦" },
      { rank: "9", suit: "♦" },
      { rank: "8", suit: "♣" },
    ],
    options: ["FOLD", "CALL $150 more", "RAISE to $500", "ALL-IN"],
    correct: 3,
    rationale:
      "ALL-IN. You have a straight with a flush draw backup. This is a monster hand. Get all the money in while you're likely ahead.",
  },
  {
    id: 33,
    scenario:
      "You have A♣K♣. Board: T♣9♣8♦7♣. Pot $250. Villain shoves $200. Your decision?",
    heroCards: [
      { rank: "A", suit: "♣" },
      { rank: "K", suit: "♣" },
    ],
    board: [
      { rank: "T", suit: "♣" },
      { rank: "9", suit: "♣" },
      { rank: "8", suit: "♦" },
      { rank: "7", suit: "♣" },
    ],
    options: ["FOLD", "CALL $200", "RAISE", "Check behind"],
    correct: 0,
    rationale:
      "FOLD. Any jack makes a straight, and you only have ace-high flush. The board is too dangerous. Save your chips for better spots.",
  },
  {
    id: 34,
    scenario:
      "You have 9♥9♠. Flop: 9♦6♥3♣. Turn: Q♠. Pot $150. Opponent bets $100. Your move?",
    heroCards: [
      { rank: "9", suit: "♥" },
      { rank: "9", suit: "♠" },
    ],
    board: [
      { rank: "9", suit: "♦" },
      { rank: "6", suit: "♥" },
      { rank: "3", suit: "♣" },
      { rank: "Q", suit: "♠" },
    ],
    options: ["FOLD", "CALL $100", "RAISE to $300", "ALL-IN"],
    correct: 2,
    rationale:
      "RAISE to $300. You have top set on a relatively safe board. The queen might have improved villain's hand. Raise for value and protection.",
  },
  {
    id: 35,
    scenario:
      "You have 7♦6♦. Board: 8♦5♦4♣K♦. Pot $200. You bet $150, villain raises to $450. Your action?",
    heroCards: [
      { rank: "7", suit: "♦" },
      { rank: "6", suit: "♦" },
    ],
    board: [
      { rank: "8", suit: "♦" },
      { rank: "5", suit: "♦" },
      { rank: "4", suit: "♣" },
      { rank: "K", suit: "♦" },
    ],
    options: ["FOLD", "CALL $300 more", "RAISE to $900", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $300 more. You have a flush and straight, but not the nuts. Villain could have A♦ or Q♦. Calling is best to avoid getting stacked by better flushes.",
  },
  {
    id: 36,
    scenario:
      "You have A♠A♦. Board: K♣Q♦J♥T♠. Pot $300. Villain bets $250. What should you do?",
    heroCards: [
      { rank: "A", suit: "♠" },
      { rank: "A", suit: "♦" },
    ],
    board: [
      { rank: "K", suit: "♣" },
      { rank: "Q", suit: "♦" },
      { rank: "J", suit: "♥" },
      { rank: "T", suit: "♠" },
    ],
    options: ["FOLD", "CALL $250", "RAISE to $750", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $250. You have the nut straight but the board is extremely dangerous. Any ace makes broadway. Just call to control pot size.",
  },
  {
    id: 37,
    scenario:
      "You have K♥Q♥. Flop: K♠Q♣7♦. Turn: 2♥. Pot $100. You bet $75, get raised to $225. Your play?",
    heroCards: [
      { rank: "K", suit: "♥" },
      { rank: "Q", suit: "♥" },
    ],
    board: [
      { rank: "K", suit: "♠" },
      { rank: "Q", suit: "♣" },
      { rank: "7", suit: "♦" },
      { rank: "2", suit: "♥" },
    ],
    options: ["FOLD", "CALL $150 more", "RAISE to $500", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $150 more. You have top two pair on a dry board. While sets are possible, folding is too weak. Call and evaluate river.",
  },
  {
    id: 38,
    scenario:
      "You have T♣T♦. Board: 9♣8♣7♥6♦. Pot $150. Opponent shoves $100. Your decision?",
    heroCards: [
      { rank: "T", suit: "♣" },
      { rank: "T", suit: "♦" },
    ],
    board: [
      { rank: "9", suit: "♣" },
      { rank: "8", suit: "♣" },
      { rank: "7", suit: "♥" },
      { rank: "6", suit: "♦" },
    ],
    options: ["FOLD", "CALL $100", "RAISE", "Time bank"],
    correct: 1,
    rationale:
      "CALL $100. You have an overpair with straight blockers. Getting 2.5:1 pot odds, you need 29% equity. Tens have enough equity against their range.",
  },
  {
    id: 39,
    scenario:
      "You have J♣J♥. Flop: T♥9♥8♥. Pot $75. Villain bets $60. What's optimal?",
    heroCards: [
      { rank: "J", suit: "♣" },
      { rank: "J", suit: "♥" },
    ],
    board: [
      { rank: "T", suit: "♥" },
      { rank: "9", suit: "♥" },
      { rank: "8", suit: "♥" },
    ],
    options: ["FOLD", "CALL $60", "RAISE to $180", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. This board is terrible for jacks. Any heart, queen, or seven beats you. With so many better hands possible, folding is correct.",
  },
  {
    id: 40,
    scenario:
      "You have A♦Q♦. Board: A♣Q♠6♦3♦. River: 2♦. Pot $200. You bet $150, villain raises to $450. Your action?",
    heroCards: [
      { rank: "A", suit: "♦" },
      { rank: "Q", suit: "♦" },
    ],
    board: [
      { rank: "A", suit: "♣" },
      { rank: "Q", suit: "♠" },
      { rank: "6", suit: "♦" },
      { rank: "3", suit: "♦" },
      { rank: "2", suit: "♦" },
    ],
    options: ["FOLD", "CALL $300 more", "RAISE all-in", "Use time bank"],
    correct: 2,
    rationale:
      "RAISE all-in. You have the nut flush with top two pair. Only 66, 33, or 22 beat you, which is unlikely. Get maximum value from worse flushes and two pairs.",
  },
  {
    id: 41,
    scenario:
      "You have 4♥4♠. Board: 8♥7♥6♣5♣. Pot $100. Villain bets $80. Your move?",
    heroCards: [
      { rank: "4", suit: "♥" },
      { rank: "4", suit: "♠" },
    ],
    board: [
      { rank: "8", suit: "♥" },
      { rank: "7", suit: "♥" },
      { rank: "6", suit: "♣" },
      { rank: "5", suit: "♣" },
    ],
    options: ["FOLD", "CALL $80", "RAISE to $240", "ALL-IN"],
    correct: 2,
    rationale:
      "RAISE to $240. You have the nut straight. Many worse hands will call (two pairs, sets, worse straights). Raise for maximum value.",
  },
  {
    id: 42,
    scenario:
      "You have K♦J♦. Board: K♣J♣5♦2♣. Pot $150. Opponent shoves $120. Your decision?",
    heroCards: [
      { rank: "K", suit: "♦" },
      { rank: "J", suit: "♦" },
    ],
    board: [
      { rank: "K", suit: "♣" },
      { rank: "J", suit: "♣" },
      { rank: "5", suit: "♦" },
      { rank: "2", suit: "♣" },
    ],
    options: ["FOLD", "CALL $120", "Already all-in", "Time out"],
    correct: 0,
    rationale:
      "FOLD. Three clubs on board makes flushes very likely. Your two pair is no good against their shoving range. Save your chips.",
  },
  {
    id: 43,
    scenario:
      "You have 8♠8♦. Flop: 8♣6♠4♦. Turn: 7♥. River: 5♠. Pot $200. Villain bets $180. Your play?",
    heroCards: [
      { rank: "8", suit: "♠" },
      { rank: "8", suit: "♦" },
    ],
    board: [
      { rank: "8", suit: "♣" },
      { rank: "6", suit: "♠" },
      { rank: "4", suit: "♦" },
      { rank: "7", suit: "♥" },
      { rank: "5", suit: "♠" },
    ],
    options: ["FOLD", "CALL $180", "RAISE to $540", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. The board shows a straight (8-7-6-5-4). Your set is no good. Any 9 or 3 has you beat. Clear fold despite having a set.",
  },
  {
    id: 44,
    scenario:
      "You have A♣K♠. Board: A♥K♥9♥3♣2♥. Pot $250. You check, villain bets $200. Your action?",
    heroCards: [
      { rank: "A", suit: "♣" },
      { rank: "K", suit: "♠" },
    ],
    board: [
      { rank: "A", suit: "♥" },
      { rank: "K", suit: "♥" },
      { rank: "9", suit: "♥" },
      { rank: "3", suit: "♣" },
      { rank: "2", suit: "♥" },
    ],
    options: ["FOLD", "CALL $200", "RAISE to $600", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. Four hearts on board means any heart beats your two pair. The betting pattern suggests villain has a flush. Disciplined fold required.",
  },
  {
    id: 45,
    scenario:
      "You have Q♣Q♦. Board: Q♠T♠9♠8♦7♦. Pot $300. Villain shoves $250. What should you do?",
    heroCards: [
      { rank: "Q", suit: "♣" },
      { rank: "Q", suit: "♦" },
    ],
    board: [
      { rank: "Q", suit: "♠" },
      { rank: "T", suit: "♠" },
      { rank: "9", suit: "♠" },
      { rank: "8", suit: "♦" },
      { rank: "7", suit: "♦" },
    ],
    options: ["FOLD", "CALL $250", "Raise", "Check"],
    correct: 0,
    rationale:
      "FOLD. Any jack makes a straight, three spades make a flush. Your set is beat by too many hands. Getting 2.2:1 isn't enough.",
  },
  {
    id: 46,
    scenario:
      "You have 7♥7♣. Board: 7♦5♣3♥2♠A♦. Pot $150. You bet $100, get raised to $300. Your move?",
    heroCards: [
      { rank: "7", suit: "♥" },
      { rank: "7", suit: "♣" },
    ],
    board: [
      { rank: "7", suit: "♦" },
      { rank: "5", suit: "♣" },
      { rank: "3", suit: "♥" },
      { rank: "2", suit: "♠" },
      { rank: "A", suit: "♦" },
    ],
    options: ["FOLD", "CALL $200 more", "RAISE to $800", "ALL-IN"],
    correct: 1,
    rationale:
      "CALL $200 more. You have a set but 64 makes a straight. The ace likely improved villain's hand. Call to keep bluffs in their range.",
  },
  {
    id: 47,
    scenario:
      "You have A♥A♣. Board: 9♦8♦7♣6♦5♦. Pot $400. Villain bets $350. Your decision?",
    heroCards: [
      { rank: "A", suit: "♥" },
      { rank: "A", suit: "♣" },
    ],
    board: [
      { rank: "9", suit: "♦" },
      { rank: "8", suit: "♦" },
      { rank: "7", suit: "♣" },
      { rank: "6", suit: "♦" },
      { rank: "5", suit: "♦" },
    ],
    options: ["FOLD", "CALL $350", "RAISE", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. Four diamonds and a straight on board. Your aces are crushed. Any diamond or ten beats you. Easy fold despite having aces.",
  },
  {
    id: 48,
    scenario:
      "You have J♠T♠. Board: 9♠8♠7♦K♠Q♠. Pot $200. You bet $150, villain raises to $500. Your action?",
    heroCards: [
      { rank: "J", suit: "♠" },
      { rank: "T", suit: "♠" },
    ],
    board: [
      { rank: "9", suit: "♠" },
      { rank: "8", suit: "♠" },
      { rank: "7", suit: "♦" },
      { rank: "K", suit: "♠" },
      { rank: "Q", suit: "♠" },
    ],
    options: ["FOLD", "CALL $350 more", "RAISE all-in", "Check"],
    correct: 0,
    rationale:
      "FOLD. You have a straight and jack-high flush, but A♠ makes a better flush. The big raise likely indicates the nut flush. Fold and save chips.",
  },
  {
    id: 49,
    scenario:
      "You have 6♦6♣. Board: A♦K♦Q♦J♦T♦. Pot $500. Villain shoves $400. What's your play?",
    heroCards: [
      { rank: "6", suit: "♦" },
      { rank: "6", suit: "♣" },
    ],
    board: [
      { rank: "A", suit: "♦" },
      { rank: "K", suit: "♦" },
      { rank: "Q", suit: "♦" },
      { rank: "J", suit: "♦" },
      { rank: "T", suit: "♦" },
    ],
    options: ["FOLD", "CALL $400", "Already folded", "Time bank"],
    correct: 0,
    rationale:
      "FOLD immediately. The board shows a royal flush. Your pocket sixes and 6♦ flush are worthless. Anyone playing this board has you beat.",
  },
  {
    id: 50,
    scenario:
      "You have A♠Q♣. Board: A♦K♣J♠T♥. Pot $300. Opponent bets $250. Your optimal play?",
    heroCards: [
      { rank: "A", suit: "♠" },
      { rank: "Q", suit: "♣" },
    ],
    board: [
      { rank: "A", suit: "♦" },
      { rank: "K", suit: "♣" },
      { rank: "J", suit: "♠" },
      { rank: "T", suit: "♥" },
    ],
    options: ["FOLD", "CALL $250", "RAISE to $750", "ALL-IN"],
    correct: 2,
    rationale:
      "RAISE to $750. You have broadway straight (ace-high straight). Only another AQ ties. Raise for value as worse hands like two pair will call.",
  },
  {
    id: 51,
    scenario:
      "You have T♥T♠. Board: T♦9♣8♦7♣6♥. Pot $250. Villain shoves $200. Your decision?",
    heroCards: [
      { rank: "T", suit: "♥" },
      { rank: "T", suit: "♠" },
    ],
    board: [
      { rank: "T", suit: "♦" },
      { rank: "9", suit: "♣" },
      { rank: "8", suit: "♦" },
      { rank: "7", suit: "♣" },
      { rank: "6", suit: "♥" },
    ],
    options: ["FOLD", "CALL $200", "Raise", "Time"],
    correct: 0,
    rationale:
      "FOLD. The board shows a straight. Any jack, any five, or specifically JT has you beat. Your set is no good here.",
  },
  {
    id: 52,
    scenario:
      "You have K♠K♥. Board: K♣Q♣J♣T♣9♣. Pot $400. You check, villain bets $350. Your play?",
    heroCards: [
      { rank: "K", suit: "♠" },
      { rank: "K", suit: "♥" },
    ],
    board: [
      { rank: "K", suit: "♣" },
      { rank: "Q", suit: "♣" },
      { rank: "J", suit: "♣" },
      { rank: "T", suit: "♣" },
      { rank: "9", suit: "♣" },
    ],
    options: ["FOLD", "CALL $350", "RAISE", "ALL-IN"],
    correct: 0,
    rationale:
      "FOLD. Five clubs on board means any club beats your set. The straight flush is also possible. Clear fold despite having set of kings.",
  },
];

interface Answer {
  selected: number;
  correct: boolean;
}

const NUMBER_OF_QUESTIONS = 20;

// Main Quiz Component
const PokerMathQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Initialize quiz with random 50 questions
  useEffect(() => {
    const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
    setSelectedQuestions(shuffled.slice(0, NUMBER_OF_QUESTIONS));
  }, []);

  // Legend Modal Component
  const LegendModal = () => {
    if (!showLegend) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[40vh] flex flex-col">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-poker-gold font-avenir">
              Poker Terms Guide
            </h2>
            <button
              onClick={() => setShowLegend(false)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-poker-gold" />
            </button>
          </div>

          <div
            className="overflow-y-scroll p-3 flex-grow"
            style={{ scrollbarWidth: "thin" }}
          >
            {Object.entries(pokerTerms).map(([category, terms]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-semibold text-poker-gold mb-2 capitalize bg-gray-50 p-1 rounded font-avenir">
                  {category === "positions"
                    ? "Table Positions"
                    : category === "general"
                    ? "General Terms"
                    : category === "actions"
                    ? "Actions"
                    : category === "hands"
                    ? "Hand Rankings"
                    : "Other Terms"}
                </h3>
                <div className="space-y-1">
                  {terms.map((item: Term, idx: number) => (
                    <div
                      key={idx}
                      className="border-l-2 border-green-500 pl-2 py-0.5"
                    >
                      <span className="font-semibold text-poker-gold text-xs font-avenir">
                        {item.term}
                      </span>
                      <span className="text-poker-gold text-xs font-avenir">
                        {" "}
                        - {item.definition}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Card rendering component with responsive sizing
  const Card = ({
    card,
    isHeroCard = false,
  }: {
    card: Card;
    isHeroCard?: boolean;
  }) => {
    const cardString: string = card.rank + SUIT_TO_CHAR[card.suit];

    // Fixed sizing based on card type - no responsive changes
    const getCardSizeClasses = () => {
      if (isHeroCard) {
        // Hero cards - larger and more prominent, fixed size
        return "w-20 h-28";
      } else {
        // Board cards - fixed size that remains consistent
        return "w-20 h-28";
      }
    };

    return (
      <div
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
        className={`${getCardSizeClasses()} overflow-hidden transform transition-transform duration-200 hover:scale-105`}
      >
        <img
          src={`/cards/${cardString}.svg`}
          alt={`${card.rank} of ${card.suit}`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowAnswer(true);

    const isCorrect =
      answerIndex === selectedQuestions[currentQuestion].correct;
    if (isCorrect) {
      setScore(score + 1);
    }

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = {
      selected: answerIndex,
      correct: isCorrect,
    };
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < selectedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setScore(0);
    setUserAnswers([]);
    setQuizComplete(false);
    const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
    setSelectedQuestions(shuffled.slice(0, NUMBER_OF_QUESTIONS));
  };

  const handleReset = () => {
    if (currentQuestion > 0) {
      const confirmReset = window.confirm(
        "Are you sure you want to reset? Your current progress will be lost."
      );
      if (confirmReset) {
        restartQuiz();
      }
    } else {
      restartQuiz();
    }
  };

  if (selectedQuestions.length === 0) {
    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6" style={wallpaperStyle}>
        <LegendModal />
        <div className="flex items-center justify-center h-screen">
          <div className="text-poker-gold text-lg sm:text-xl font-avenir">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / selectedQuestions.length) * 100);
    let message = "";
    if (percentage >= 90) message = "Outstanding! You're a poker math master!";
    else if (percentage >= 80)
      message = "Excellent work! Your poker math is solid.";
    else if (percentage >= 70)
      message = "Good job! Keep practicing to improve.";
    else if (percentage >= 60) message = "Not bad! More study will help.";
    else message = "Keep practicing! Poker math takes time to master.";

    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6" style={wallpaperStyle}>
        <LegendModal />
        <div className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center mx-4 sm:mx-6 lg:mx-8">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowLegend(true)}
                className="p-1.5 sm:p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                title="Poker Terms Guide"
              >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </button>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">
              Quiz Complete!
            </h2>
            <div className="mb-8 sm:mb-10">
              <p className="text-4xl sm:text-5xl font-bold text-green-600 mb-3 sm:mb-4">
                {score}/{selectedQuestions.length}
              </p>
              <p className="text-xl sm:text-2xl text-[#d0b090] mb-4 sm:mb-6">
                {percentage}%
              </p>
              <p className="text-lg sm:text-xl mt-4 text-[#d0b090] leading-relaxed px-2 sm:px-4">
                {message}
              </p>
            </div>
            <button
              onClick={restartQuiz}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:from-green-700 hover:to-green-800 transition-all"
            >
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = selectedQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / selectedQuestions.length) * 100;

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6" style={wallpaperStyle}>
      <LegendModal />
      <div className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {/* Question Card */}
        <div
          style={{
            borderStyle: "groove",
            filter: "drop-shadow(0 1rem 1rem black)",
          }}
          className="bg-gradient-to-br from-[#0060a0] via-[#004080] to-[#0060a0] rounded-[2rem] p-6 sm:p-8 md:p-10 lg:p-12 mx-4 sm:mx-8 lg:mx-16 border-28 border-[#d0b090] relative overflow-hidden shadow-xl"
        >
          {/* Felt texture overlay */}
          <div className="absolute inset-0 opacity-[0.15] bg-gradient-to-r from-transparent via-white to-transparent"></div>
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3)_0%,transparent_50%)]"></div>

          {/* Content wrapper to ensure it's above the texture */}
          <div className="relative z-10">
            {/* Scenario */}
            <p className="text-sm sm:text-base text-poker-gold mb-4 sm:mb-6 leading-relaxed font-avenir px-2 sm:px-4">
              {question.scenario}
            </p>

            {question.board.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-br from-[#004080] to-[#002060] p-4 sm:p-6 md:p-8 rounded-lg border-[#d0b090] border-2 shadow-inner relative overflow-hidden">
                  {/* Board felt texture */}
                  <div className="absolute inset-0 opacity-[0.1] bg-gradient-to-r from-transparent via-white to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center">
                      {/* Flexible board layout - all cards in one row, wrapping only when necessary */}
                      <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 justify-center flex-wrap max-w-full">
                        {question.board.map((card, idx) => (
                          <Card key={idx} card={card} isHeroCard={false} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cards Display */}
            <div className="mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-6">
                <div className="p-4 sm:p-6 md:p-8 rounded-lg flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8 relative overflow-hidden">
                  {/* Player area felt texture */}
                  {/* <div className="absolute inset-0 opacity-[0.1] bg-gradient-to-r from-transparent via-white to-transparent"></div> */}
                  <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8">
                    {/* Left side - Logo */}
                    <div className="flex items-center text-poker-gold order-2 lg:order-1 flex-shrink-0">
                      <span className="font-bold font-high-empathy text-2xl">
                        Poker Brain
                      </span>
                    </div>

                    {/* Center - Player Cards */}
                    <div className="flex justify-center order-1 lg:order-2 flex-shrink-0">
                      {/* Hero cards - always 2, prominently displayed */}
                      <div className="flex gap-3">
                        {question.heroCards.map((card, idx) => (
                          <Card key={idx} card={card} isHeroCard={true} />
                        ))}
                      </div>
                    </div>

                    {/* Right side - Score and Controls */}
                    <div className="flex flex-col items-center lg:items-end space-y-2 lg:space-y-3 order-3 flex-shrink-0">
                      <div className="text-xs sm:text-sm font-semibold text-poker-gold font-avenir text-center sm:text-right">
                        Score: {score}/{userAnswers.length}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => setShowLegend(true)}
                          className="p-1.5 sm:p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                          title="Poker Terms Guide"
                        >
                          <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={handleReset}
                          className="p-1.5 sm:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                          title="Reset Quiz"
                        >
                          <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-poker-gold" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar Section - Inside the poker table */}
            <div className="mt-6 sm:mt-8 px-4 sm:px-6">
              <div className="max-w-sm mx-auto">
                <div className="flex items-center justify-start text-poker-gold font-avenir text-sm mb-3">
                  <span>
                    Question {currentQuestion + 1} of {selectedQuestions.length}
                  </span>
                  <span></span>
                </div>
                <div className="w-full bg-[#001040] rounded-full h-4 border-2 border-[#d0b090] shadow-inner relative overflow-hidden">
                  <div
                    className="bg-[#d0b090] h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Enhanced progress bar effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
          {/* Answer Options */}
          <div className="mb-8 sm:mb-10">
            {/* Grid layout: A,B on top row, C,D on bottom row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={showAnswer}
                  style={{
                    filter: "drop-shadow(0 0.5rem 0.5rem black)",
                  }}
                  className={`w-full text-left px-4 sm:px-5 py-4 sm:py-5 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base font-medium font-avenir relative overflow-hidden
                    ${
                      showAnswer && idx === question.correct
                        ? "bg-gradient-to-br from-green-100 to-green-50 border-green-400 text-green-700 shadow-green-200"
                        : showAnswer &&
                          idx === selectedAnswer &&
                          idx !== question.correct
                        ? "bg-gradient-to-br from-red-100 to-red-50 border-red-400 text-red-700 shadow-red-200"
                        : "bg-gradient-to-br from-[#301007] via-[#170703] to-[#301007] border-[#F5DEB3] border-4 text-[#F5DEB3] hover:from-[#9B5523] hover:via-[#B0623D] hover:to-[#7B4420] hover:shadow-xl"
                    }
                    ${
                      !showAnswer &&
                      "cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    }
                    ${showAnswer && "cursor-not-allowed"}
                  `}
                >
                  {/* Leather texture overlay for answer buttons */}
                  {!showAnswer && (
                    <>
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-[#F5DEB3] to-transparent"></div>
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,rgba(245,222,179,0.4)_0%,transparent_60%)]"></div>
                    </>
                  )}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center flex-1">
                      <span className="font-bold mr-3 text-base sm:text-lg min-w-[1.2rem] flex-shrink-0">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="flex-1 leading-relaxed break-words">
                        {option}
                      </span>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {showAnswer && idx === question.correct && (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      )}
                      {showAnswer &&
                        idx === selectedAnswer &&
                        idx !== question.correct && (
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Answer Feedback */}
          {showAnswer && (
            <div
              className={`mb-8 sm:mb-10 p-5 sm:p-7 rounded-xl border-l-4 text-sm sm:text-base shadow-sm ${
                selectedAnswer === question.correct
                  ? "bg-green-50 border-green-500"
                  : "bg-yellow-50 border-yellow-500"
              }`}
            >
              <p
                className={`font-semibold mb-3 text-base sm:text-lg ${
                  selectedAnswer === question.correct
                    ? "text-green-700"
                    : "text-yellow-700"
                }`}
              >
                {selectedAnswer === question.correct
                  ? "Correct!"
                  : "Learning Opportunity"}
              </p>
              <p className="text-poker-gold font-avenir leading-relaxed">
                {question.rationale}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-center">
            {!showAnswer && (
              <button
                onClick={handleShowAnswer}
                style={{
                  filter: "drop-shadow(0 0.5rem 0.5rem black)",
                }}
                className="w-full max-w-sm bg-gradient-to-br from-[#F5DEB3] via-[#E6D3A3] to-[#D4C4A0] text-[#8B4513] px-6 sm:px-8 py-4 sm:py-5 rounded-xl font-semibold text-base sm:text-lg border-2 border-[#D4C4A0] hover:from-[#E6D3A3] hover:via-[#D4C4A0] hover:to-[#C4B490] hover:border-[#C4B490] transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] relative overflow-hidden"
              >
                {/* Subtle shine effect for show answer button */}
                <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                <div className="relative z-10">Show Answer</div>
              </button>
            )}
            {showAnswer && (
              <button
                onClick={handleNext}
                className="w-full max-w-sm bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-xl font-semibold text-base sm:text-lg border-2 border-green-500 hover:from-green-700 hover:via-green-800 hover:to-green-900 hover:border-green-600 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] relative overflow-hidden"
              >
                {/* Subtle shine effect for next button */}
                <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                <div className="relative z-10">
                  {currentQuestion < selectedQuestions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokerMathQuiz;
