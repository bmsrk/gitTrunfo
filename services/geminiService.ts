import { GithubRepo, Player, StatType } from "../types";

// Helper for random selection
const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const generateMatchupAnalysis = async (p1: Player, p2: Player): Promise<string> => {
  const templates = [
    `The stage is set! ${p1.user.login} faces off against ${p2.user.login}.`,
    `It's a clash of code! Can ${p1.user.login}'s deck defeat ${p2.user.login}?`,
    `Battle initialized. ${p1.user.login} vs ${p2.user.login}. Who has the better stats?`,
    `${p1.user.login} brings their top repos to challenge ${p2.user.login}!`,
    `Two developers enter, one leaves! ${p1.user.login} vs ${p2.user.login}.`
  ];

  return pickRandom(templates);
};

export const generateTurnCommentary = async (
  winnerName: string,
  loserName: string,
  stat: string,
  val1: number,
  val2: number,
  repoName: string
): Promise<string> => {
   const templates = [
     `What a hit! ${winnerName} takes it with ${val1} ${stat}.`,
     `${repoName} proves superior! ${val1} vs ${val2} ${stat}.`,
     `${winnerName} dominates this round with a massive ${val1} ${stat}!`,
     `${loserName}'s ${val2} ${stat} wasn't enough against ${repoName}.`,
     `Clean win for ${winnerName} using ${stat}.`,
     `${stat} check! ${winnerName}: ${val1}, ${loserName}: ${val2}.`,
     `The community speaks! ${winnerName} wins on ${stat}.`
   ];

   return pickRandom(templates);
};

export const getAiMove = async (card: GithubRepo, availableStats: StatType[]): Promise<StatType> => {
    let bestStat: StatType = 'stargazers_count';
    let maxScore = -1;

    // Normalize roughly to compare "strength" across different scales
    // This heuristic helps the AI pick its strongest attribute
    const scores = {
        stargazers_count: card.stargazers_count / 100, // 100 stars = 1 pt
        forks_count: card.forks_count / 20,            // 20 forks = 1 pt
        watchers_count: card.watchers_count / 20,      // 20 watchers = 1 pt
        open_issues_count: card.open_issues_count / 10, // 10 issues = 1 pt
        size: card.size / 5000,                        // 5MB = 1 pt
    };

    for (const stat of availableStats) {
        // @ts-ignore
        const score = scores[stat] || 0;
        if (score > maxScore) {
            maxScore = score;
            bestStat = stat;
        }
    }

    return bestStat;
}