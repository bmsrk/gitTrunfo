import { GithubRepo, GithubUser, Player } from '../types';

const BASE_URL = 'https://api.github.com';

// Constants
const MIN_REPOS_REQUIRED = 3;
const MAX_REPOS_PER_DECK = 10;

// DUMMY DATA FOR OFFLINE MODE
const DUMMY_USER_1: GithubUser = {
  login: "offline_hero",
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=hero",
  name: "Offline Hero",
  bio: "Coding without internet",
  public_repos: 42,
  followers: 100,
  following: 10
};

const DUMMY_USER_2: GithubUser = {
  login: "offline_cpu",
  avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=cpu",
  name: "Offline CPU",
  bio: "I live in your cache",
  public_repos: 999,
  followers: 0,
  following: 0
};

/**
 * Generate dummy repositories for offline mode or fallback
 * @param count Number of repositories to generate
 * @param prefix Prefix for repository names
 * @returns Array of dummy GitHub repositories
 */
const generateDummyRepos = (count: number, prefix: string): GithubRepo[] => {
    const languages = ['TypeScript', 'JavaScript', 'Rust', 'Go', 'Python'];
    
    return Array.from({ length: count }).map((_, i) => ({
        id: Date.now() + i,
        name: `${prefix}-repo-${i}`,
        description: `A dummy repository for offline testing ${i}`,
        stargazers_count: Math.floor(Math.random() * 5000) + 100,
        forks_count: Math.floor(Math.random() * 1000),
        watchers_count: Math.floor(Math.random() * 1000),
        open_issues_count: Math.floor(Math.random() * 50),
        size: Math.floor(Math.random() * 10000) + 100,
        language: languages[Math.floor(Math.random() * languages.length)],
        html_url: '#',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));
};

/**
 * Fetch GitHub user profile
 * @param username GitHub username
 * @returns User profile data
 * @throws Error if user not found or API fails (with fallback)
 */
export const fetchGithubUser = async (username: string): Promise<GithubUser> => {
  if (!username || username.trim().length === 0) {
    throw new Error('Username cannot be empty');
  }

  try {
    const response = await fetch(`${BASE_URL}/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("RATE_LIMIT");
      }
      if (response.status === 404) {
        throw new Error(`User '${username}' not found on GitHub`);
      }
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage === "RATE_LIMIT" || errorMessage.includes("Failed to fetch")) {
      console.warn(`GitHub API unavailable, using offline fallback for user: ${username}`);
      
      const isCpu = username.toLowerCase().includes('cpu') || username.toLowerCase() === 'google';
      const dummyBase = isCpu ? DUMMY_USER_2 : DUMMY_USER_1;
      
      return {
        ...dummyBase,
        login: username,
        name: username === 'p2' ? 'Offline CPU' : username
      };
    }
    throw error;
  }
};

/**
 * Fetch user's repositories
 * @param username GitHub username
 * @returns Top repositories sorted by stars
 * @throws Error if API fails (with fallback)
 */
export const fetchUserRepos = async (username: string): Promise<GithubRepo[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/users/${username}/repos?sort=pushed&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("RATE_LIMIT");
      }
      throw new Error(`Failed to fetch repositories: ${response.statusText}`);
    }

    const repos: GithubRepo[] = await response.json();
    
    // Sort by stars and take top repositories
    return repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, MAX_REPOS_PER_DECK);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage === "RATE_LIMIT" || errorMessage.includes("Failed to fetch")) {
      console.warn(`GitHub API unavailable, using offline fallback for repos: ${username}`);
      return generateDummyRepos(MAX_REPOS_PER_DECK, username)
        .sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
    throw error;
  }
};

/**
 * Create a player with their deck of repository cards
 * @param username GitHub username
 * @param id Player ID (p1 or p2)
 * @param isAi Whether this player is AI controlled
 * @returns Player object with user info and deck
 * @throws Error if user has insufficient repositories
 */
export const createPlayer = async (
  username: string,
  id: string,
  isAi: boolean = false
): Promise<Player> => {
  const user = await fetchGithubUser(username);
  const deck = await fetchUserRepos(username);
  
  if (deck.length < MIN_REPOS_REQUIRED) {
    throw new Error(
      `User '${username}' needs at least ${MIN_REPOS_REQUIRED} repositories to play. Found: ${deck.length}`
    );
  }

  return {
    id,
    user,
    deck,
    score: 0,
    isAi
  };
};