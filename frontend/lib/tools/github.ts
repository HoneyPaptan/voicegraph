/**
 * GitHub API Integration
 * Provides repository operations, issue management, and code search
 */

// Default GitHub username - can be overridden
const DEFAULT_GITHUB_USERNAME = 'HoneyPaptan';

/**
 * Parses GitHub URL to extract owner and repository name
 * Supports various GitHub URL formats
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Clean the URL
    const cleanUrl = url.trim().toLowerCase();
    
    // Common GitHub URL patterns
    const patterns = [
      // Standard GitHub URLs
      /github\.com\/([^\/]+)\/([^\/\?#]+)/,
      // Git clone URLs
      /git@github\.com:([^\/]+)\/(.+?)(?:\.git)?$/,
      // Raw GitHub URLs
      /raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        const owner = match[1];
        const repo = match[2].replace(/\.git$/, ''); // Remove .git suffix if present
        
        console.log(`🔗 Parsed GitHub URL: ${owner}/${repo}`);
        return { owner, repo };
      }
    }
    
    // If no pattern matches, treat as owner/repo format
    if (cleanUrl.includes('/')) {
      const [owner, repo] = cleanUrl.split('/');
      if (owner && repo) {
        console.log(`🔗 Parsed owner/repo format: ${owner}/${repo}`);
        return { owner, repo };
      }
    }
    
    console.warn(`⚠️ Could not parse GitHub URL: ${url}`);
    return null;
  } catch (error) {
    console.error(`❌ Error parsing GitHub URL "${url}":`, error);
    return null;
  }
}

/**
 * Validates GitHub API response and provides helpful error messages
 */
function handleGitHubApiError(response: Response, context: string): { success: false; error: string } {
  const status = response.status;
  
  switch (status) {
    case 401:
      return {
        success: false,
        error: `GitHub API authentication failed. Please check your GITHUB_API_KEY in .env.local`,
      };
    case 403:
      return {
        success: false,
        error: `GitHub API rate limit exceeded or access forbidden. ${context}`,
      };
    case 404:
      return {
        success: false,
        error: `GitHub resource not found. ${context}. Make sure the repository/user exists and is public.`,
      };
    case 422:
      return {
        success: false,
        error: `GitHub API validation error. ${context}. Check the repository name and parameters.`,
      };
    default:
      return {
        success: false,
        error: `GitHub API error ${status}. ${context}`,
      };
  }
}

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
  };
}

/**
 * Get GitHub user or organization repositories
 * @param username - GitHub username, organization name, or GitHub URL (defaults to HoneyPaptan)
 * @param maxRepos - Maximum number of repos to fetch (default: 10)
 */
export async function getGitHubRepos(
  usernameOrUrl?: string,
  maxRepos: number = 10
): Promise<{ success: boolean; data?: string; error?: string }> {
  const apiKey = process.env.GITHUB_API_KEY;

  if (!apiKey) {
    console.error('❌ GITHUB_API_KEY not found in environment variables');
    return {
      success: false,
      error: 'GitHub API key not configured. Please add GITHUB_API_KEY to .env.local',
    };
  }

  // Use default username if none provided
  let username = usernameOrUrl || DEFAULT_GITHUB_USERNAME;
  
  // Try to parse as GitHub URL first
  if (usernameOrUrl && (usernameOrUrl.includes('github.com') || usernameOrUrl.includes('/'))) {
    const parsed = parseGitHubUrl(usernameOrUrl);
    if (parsed) {
      username = parsed.owner;
    }
  }

  username = username.trim();
  if (!username) {
    return {
      success: false,
      error: 'GitHub username cannot be empty',
    };
  }

  console.log(`📦 Fetching GitHub repos for: ${username}`);
  console.log(`🔍 Max repos: ${maxRepos}`);

  try {
    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=${maxRepos}`;
    console.log(`🌐 API Request: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'VoiceGraph-Workflow-App',
      },
    });

    if (!response.ok) {
      const context = `Failed to fetch repositories for user "${username}"`;
      return handleGitHubApiError(response, context);
    }

    const repos: GitHubRepo[] = await response.json();
    console.log(`✅ GitHub API returned ${repos.length} repositories`);

    if (repos.length === 0) {
      console.log('⚠️ No repositories found for user:', username);
      return {
        success: true,
        data: `# GitHub Repositories for ${username}\n\n📂 No public repositories found.\n\nThis could mean:\n- The user has no public repositories\n- All repositories are private\n- The username doesn't exist`,
      };
    }

    console.log(`✅ Found ${repos.length} repositories`);

    // Format as markdown with enhanced information
    let formattedData = `# 📦 GitHub Repositories for ${username}\n\n`;
    formattedData += `**Total Repositories:** ${repos.length}\n`;
    formattedData += `**Profile URL:** https://github.com/${username}\n\n`;

    repos.forEach((repo, index) => {
      formattedData += `## ${index + 1}. ${repo.name}\n`;
      formattedData += `**Full Name:** ${repo.full_name}\n`;
      formattedData += `**Description:** ${repo.description || '📝 No description available'}\n`;
      formattedData += `**Language:** ${repo.language || '🤷 Not specified'}\n`;
      formattedData += `**Stats:** ⭐ ${repo.stargazers_count} stars | 🍴 ${repo.forks_count} forks\n`;
      formattedData += `**Last Updated:** ${new Date(repo.updated_at).toLocaleDateString()}\n`;
      formattedData += `**Repository URL:** ${repo.html_url}\n`;
      formattedData += `---\n\n`;
    });

    return {
      success: true,
      data: formattedData,
    };
  } catch (error: any) {
    console.error('❌ GitHub repos fetch failed:', error);
    return {
      success: false,
      error: `Network error while fetching GitHub repos: ${error.message}. Check your internet connection and GitHub API status.`,
    };
  }
}

/**
 * Get issues from a GitHub repository
 * @param repoUrl - GitHub repository URL or owner/repo format
 * @param state - Issue state: 'open', 'closed', or 'all' (default: 'open')  
 * @param maxIssues - Maximum number of issues (default: 10)
 */
export async function getGitHubIssues(
  repoUrl: string,
  state: 'open' | 'closed' | 'all' = 'open',
  maxIssues: number = 10
): Promise<{ success: boolean; data?: string; error?: string }> {
  const apiKey = process.env.GITHUB_API_KEY;

  if (!apiKey) {
    console.error('❌ GITHUB_API_KEY not found in environment variables');
    return {
      success: false,
      error: 'GitHub API key not configured',
    };
  }

  // Parse the repository URL or owner/repo format
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return {
      success: false,
      error: `Invalid GitHub repository format: "${repoUrl}". Expected format: "owner/repo" or full GitHub URL`,
    };
  }

  const { owner, repo } = parsed;

  console.log(`🐛 Fetching ${state} issues from ${owner}/${repo}`);
  console.log(`🔍 Max issues: ${maxIssues}`);

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${maxIssues}`;
    console.log(`🌐 API Request: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'VoiceGraph-Workflow-App',
      },
    });

    if (!response.ok) {
      const context = `Failed to fetch ${state} issues from repository "${owner}/${repo}"`;
      return handleGitHubApiError(response, context);
    }

    const issues: GitHubIssue[] = await response.json();
    console.log(`✅ GitHub API returned ${issues.length} issues`);

    if (issues.length === 0) {
      console.log(`⚠️ No ${state} issues found`);
      return {
        success: true,
        data: `# 🐛 Issues for ${owner}/${repo}\n\n📂 No ${state} issues found.\n\n**Repository:** https://github.com/${owner}/${repo}\n\nThis could mean:\n- All issues are in a different state (${state === 'open' ? 'closed' : 'open'})\n- Issues are disabled for this repository\n- The repository has no issues yet`,
      };
    }

    console.log(`✅ Found ${issues.length} issues`);

    // Format as markdown with enhanced information
    let formattedData = `# 🐛 ${state.charAt(0).toUpperCase() + state.slice(1)} Issues for ${owner}/${repo}\n\n`;
    formattedData += `**Total Issues:** ${issues.length}\n`;
    formattedData += `**Repository:** https://github.com/${owner}/${repo}\n`;
    formattedData += `**Issues URL:** https://github.com/${owner}/${repo}/issues\n\n`;

    issues.forEach((issue, index) => {
      formattedData += `## ${index + 1}. #${issue.number} - ${issue.title}\n`;
      formattedData += `**Status:** ${issue.state === 'open' ? '🟢 Open' : '🔴 Closed'}\n`;
      formattedData += `**Author:** @${issue.user.login}\n`;
      formattedData += `**Created:** ${new Date(issue.created_at).toLocaleDateString()}\n`;
      formattedData += `**Updated:** ${new Date(issue.updated_at).toLocaleDateString()}\n`;
      formattedData += `**Issue URL:** ${issue.html_url}\n\n`;
      
      if (issue.body && issue.body.trim().length > 0) {
        const bodyPreview = issue.body.slice(0, 300);
        formattedData += `**Description:**\n${bodyPreview}${issue.body.length > 300 ? '...\n\n[Read more](' + issue.html_url + ')' : ''}\n\n`;
      } else {
        formattedData += `**Description:** _No description provided_\n\n`;
      }
      
      formattedData += `---\n\n`;
    });

    return {
      success: true,
      data: formattedData,
    };
  } catch (error: any) {
    console.error('❌ GitHub issues fetch failed:', error);
    return {
      success: false,
      error: `Network error while fetching GitHub issues: ${error.message}. Check your internet connection and GitHub API status.`,
    };
  }
}

/**
 * Create a GitHub issue
 * @param repoUrl - GitHub repository URL or owner/repo format
 * @param title - Issue title
 * @param body - Issue body/description
 */
export async function createGitHubIssue(
  repoUrl: string,
  title: string,
  body: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  const apiKey = process.env.GITHUB_API_KEY;

  if (!apiKey) {
    console.error('❌ GITHUB_API_KEY not found in environment variables');
    return {
      success: false,
      error: 'GitHub API key not configured',
    };
  }

  // Parse the repository URL or owner/repo format
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return {
      success: false,
      error: `Invalid GitHub repository format: "${repoUrl}". Expected format: "owner/repo" or full GitHub URL`,
    };
  }

  const { owner, repo } = parsed;

  if (!title || title.trim().length === 0) {
    return {
      success: false,
      error: 'Issue title cannot be empty',
    };
  }

  const cleanTitle = title.trim();
  const cleanBody = body?.trim() || '';

  console.log(`✏️ Creating issue in ${owner}/${repo}`);
  console.log(`📝 Title: "${cleanTitle}"`);
  console.log(`📄 Body length: ${cleanBody.length} characters`);

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
    console.log(`🌐 API Request: POST ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'VoiceGraph-Workflow-App',
      },
      body: JSON.stringify({
        title: cleanTitle,
        body: cleanBody,
      }),
    });

    if (!response.ok) {
      const context = `Failed to create issue "${cleanTitle}" in repository "${owner}/${repo}"`;
      
      // Special handling for common issue creation errors
      if (response.status === 410) {
        return {
          success: false,
          error: `Issues are disabled for the repository "${owner}/${repo}". The repository owner needs to enable issues in repository settings.`,
        };
      }
      
      return handleGitHubApiError(response, context);
    }

    const issue: GitHubIssue = await response.json();
    console.log(`✅ Issue created successfully: #${issue.number}`);
    console.log(`🔗 Issue URL: ${issue.html_url}`);

    return {
      success: true,
      data: `# 🎉 GitHub Issue Created Successfully!\n\n**Repository:** ${owner}/${repo}\n**Issue #${issue.number}:** ${issue.title}\n**Author:** @${issue.user.login}\n**Status:** 🟢 Open\n**Created:** ${new Date(issue.created_at).toLocaleDateString()}\n**Direct URL:** ${issue.html_url}\n\n**Description Preview:**\n${cleanBody.slice(0, 200)}${cleanBody.length > 200 ? '...' : ''}\n\n---\n\n✅ Your issue is now live on GitHub and ready for collaboration!`,
    };
  } catch (error: any) {
    console.error('❌ GitHub issue creation failed:', error);
    return {
      success: false,
      error: `Network error while creating GitHub issue: ${error.message}. Check your internet connection and try again.`,
    };
  }
}

