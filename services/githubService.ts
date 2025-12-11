import { GithubRepo, GithubUser } from '../types';

const BASE_URL = 'https://api.github.com';

export const fetchGithubUser = async (username: string): Promise<GithubUser> => {
  const response = await fetch(`${BASE_URL}/users/${username}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error(`User ${username} not found`);
    if (response.status === 403) throw new Error(`API Rate limit exceeded. Try again later.`);
    throw new Error('Failed to fetch user');
  }
  return response.json();
};

export const fetchUserRepos = async (username: string): Promise<GithubRepo[]> => {
  // Fetch up to 100 repos sorted by pushed date to get active ones, 
  // but we will client-side sort by stars to give the player their "best" deck.
  const response = await fetch(`${BASE_URL}/users/${username}/repos?sort=pushed&per_page=100`);
  if (!response.ok) {
    throw new Error('Failed to fetch repos');
  }
  const repos: GithubRepo[] = await response.json();
  
  // Filter out forks if desired, or keep them. For Trunfo, original work is usually better, 
  // but let's keep it simple. We sort by stars descending to give players a strong deck.
  // We take the top 10 repos as the "Deck".
  return repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10);
};

export const createPlayer = async (username: string, id: string, isAi: boolean = false) => {
  const user = await fetchGithubUser(username);
  const deck = await fetchUserRepos(username);
  
  if (deck.length < 3) {
    throw new Error(`${username} needs at least 3 repositories to play.`);
  }

  return {
    id,
    user,
    deck,
    score: 0,
    isAi
  };
};