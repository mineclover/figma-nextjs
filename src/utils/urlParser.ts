export interface GitHubURLComponents {
  userId: string;
  projectName: string;
  branchOrHash: string;
  filePath: string;
  lineNumber?: string;
}

export function parseGitHubCodeURL(url: string): GitHubURLComponents | null {
  // 서치 파라미터 제거 (해시 이전의 '?' 이후 부분 제거)
  const [urlWithoutSearch, hash] = url.split("#");
  const cleanUrl = urlWithoutSearch.split("?")[0] + (hash ? "#" + hash : "");

  // GitHub URL 패턴에 맞는 정규 표현식 (해시 포함)
  const githubRegex =
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+?)(#L\d+)?$/;
  const match = cleanUrl.match(githubRegex);

  if (!match) {
    console.error("Invalid GitHub URL format");
    return null;
  }

  const [, userId, projectName, branchOrHash, filePath, lineNumber] = match;

  return {
    userId,
    projectName,
    branchOrHash,
    filePath,
    lineNumber: lineNumber ? lineNumber.slice(2) : undefined, // '#L' 제거
  };
}
