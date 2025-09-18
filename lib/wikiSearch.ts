const WIKIPEDIA_API_ENDPOINT = 'https://en.wikipedia.org/w/api.php';
const WIKIPEDIA_SUMMARY_ENDPOINT = 'https://en.wikipedia.org/api/rest_v1/page/summary';

const wikipediaUserAgent = process.env.WIKIPEDIA_USER_AGENT || 'Taxonomystery/1.0 (scripts/seed-articles-search)';

export interface ResolvedWikipediaArticle {
  originalTitle: string;
  resolvedTitle: string;
  wikipediaUrl: string;
  status: number;
}

interface WikipediaSearchResponse {
  query?: {
    search?: Array<{
      title: string;
    }>;
  };
}

/**
 * Resolve a potentially fuzzy article title into a concrete Wikipedia link using the search API.
 */
export async function resolveWikipediaArticle(query: string): Promise<ResolvedWikipediaArticle | null> {
  const searchUrl = new URL(WIKIPEDIA_API_ENDPOINT);
  searchUrl.searchParams.set('action', 'query');
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('list', 'search');
  searchUrl.searchParams.set('srsearch', query);
  searchUrl.searchParams.set('utf8', '1');
  searchUrl.searchParams.set('srlimit', '1');

  const response = await fetch(searchUrl.toString(), {
    headers: {
      'User-Agent': wikipediaUserAgent,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Wikipedia search failed with status ${response.status}`);
  }

  const data: WikipediaSearchResponse = await response.json();
  const match = data.query?.search?.[0];

  if (!match) {
    return null;
  }

  const resolvedTitle = match.title;
  const wikipediaUrl = buildWikipediaUrl(resolvedTitle);
  const status = await fetchWikipediaSummaryStatus(resolvedTitle);

  return {
    originalTitle: query,
    resolvedTitle,
    wikipediaUrl,
    status
  };
}

/**
 * Perform a lightweight existence check against the Wikipedia REST API.
 * Returns 200 when the page exists, 404 when it does not.
 */
export async function fetchWikipediaSummaryStatus(title: string): Promise<number> {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
  const summaryUrl = `${WIKIPEDIA_SUMMARY_ENDPOINT}/${encodedTitle}`;
  const response = await fetch(summaryUrl, {
    headers: {
      'User-Agent': wikipediaUserAgent,
      'Accept': 'application/json'
    },
    redirect: 'follow'
  });

  return response.status;
}

export function buildWikipediaUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}
