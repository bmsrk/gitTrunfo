import { GithubRepo, Player, StatType } from "../types";

/**
 * Helper function to randomly select an item from an array
 * @param arr Array to pick from
 * @returns Random item from array
 */
const pickRandom = <T>(arr: T[]): T => {
  if (arr.length === 0) {
    throw new Error('Cannot pick from empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Generate battle introduction commentary
 * @param p1 Player 1
 * @param p2 Player 2
 * @returns Commentary string
 */
export const generateMatchupAnalysis = async (p1: Player, p2: Player): Promise<string> => {
  const templates = [
    `The stage is set! ${p1.user.login} faces off against ${p2.user.login}.`,
    `It's a clash of code! Can ${p1.user.login}'s deck defeat ${p2.user.login}?`,
    `Battle initialized. ${p1.user.login} vs ${p2.user.login}. Who has the better stats?`,
    `${p1.user.login} brings their top repos to challenge ${p2.user.login}!`,
    `Two developers enter, one leaves! ${p1.user.login} vs ${p2.user.login}.`,
    `⚔️ ${p1.user.login} vs ${p2.user.login}. May the best codebase win!`
  ];

  return pickRandom(templates);
};

/**
 * Generate turn commentary based on battle outcome
 * @param winnerName Winner's username
 * @param loserName Loser's username
 * @param stat Stat used for comparison
 * @param val1 Winner's stat value
 * @param val2 Loser's stat value
 * @param repoName Winning repository name
 * @returns Commentary string
 */
export const generateTurnCommentary = async (
  winnerName: string,
  loserName: string,
  stat: string,
  val1: number,
  val2: number,
  repoName: string
): Promise<string> => {
  const templates = [
    `🎯 What a hit! ${winnerName} takes it with ${val1} ${stat}.`,
    `⚡ ${repoName} proves superior! ${val1} vs ${val2} ${stat}.`,
    `🔥 ${winnerName} dominates this round with a massive ${val1} ${stat}!`,
    `💥 ${loserName}'s ${val2} ${stat} wasn't enough against ${repoName}.`,
    `✨ Clean win for ${winnerName} using ${stat}.`,
    `📊 ${stat} check! ${winnerName}: ${val1}, ${loserName}: ${val2}.`,
    `👑 The community speaks! ${winnerName} wins on ${stat}.`,
    `⭐ ${repoName} crushes the competition with ${val1} ${stat}!`
  ];

  return pickRandom(templates);
};

/**
 * AI decision-making for selecting optimal stat
 * @param card Repository card
 * @param availableStats Available stats to choose from
 * @returns Best stat to play
 */
export const getAiMove = async (
  card: GithubRepo,
  availableStats: StatType[]
): Promise<StatType> => {
  if (availableStats.length === 0) {
    throw new Error('No available stats to choose from');
  }

  let bestStat: StatType = availableStats[0];
  let maxScore = -1;

  // Normalize stats to comparable scales
  // Higher normalized values indicate stronger stats
  const scores: Record<StatType, number> = {
    stargazers_count: card.stargazers_count / 100,      // 100 stars = 1 pt
    forks_count: card.forks_count / 20,                 // 20 forks = 1 pt
    watchers_count: card.watchers_count / 20,           // 20 watchers = 1 pt
    open_issues_count: card.open_issues_count / 10,     // 10 issues = 1 pt
    size: card.size / 5000,                             // 5MB = 1 pt
  };

  for (const stat of availableStats) {
    const score = scores[stat] || 0;
    if (score > maxScore) {
      maxScore = score;
      bestStat = stat;
    }
  }

  return bestStat;
};