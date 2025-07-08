interface WikipediaCategory {
  title: string;
}

interface WikidataAlias {
  language: string;
  value: string;
}

interface WikipediaResponse {
  query?: {
    pages?: Record<string, {
      categories?: WikipediaCategory[];
    }>;
  };
}

interface WikidataResponse {
  entities?: Record<string, {
    aliases?: Record<string, WikidataAlias[]>;
  }>;
}

export class WikipediaClient {
  private readonly baseUrl = 'https://en.wikipedia.org/w/api.php';
  private readonly wikidataUrl = 'https://www.wikidata.org/w/api.php';
  private readonly userAgent = process.env.WIKIPEDIA_USER_AGENT || 'TaxonomyMystery/1.0';

  async getCategories(title: string): Promise<string[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('action', 'query');
    url.searchParams.set('format', 'json');
    url.searchParams.set('titles', title);
    url.searchParams.set('prop', 'categories');
    url.searchParams.set('clshow', '!hidden'); // Show non-hidden categories (gets more categories)
    url.searchParams.set('cllimit', 'max'); // Get maximum categories available
    url.searchParams.set('origin', '*'); // CORS support

    try {
      const response = await this.retryRequest(() => 
        fetch(url.toString(), {
          headers: {
            'User-Agent': this.userAgent
          }
        })
      );

      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }

      const data: WikipediaResponse = await response.json();
      const pages = data.query?.pages;
      
      if (!pages) {
        return [];
      }

      const page = Object.values(pages)[0];
      const categories = page?.categories || [];

      // Filter and clean category names
      return categories
        .map(cat => cat.title.replace(/^Category:/, ''))
        .filter(cat => this.isValidCategory(cat));

    } catch (error) {
      console.error(`Failed to fetch categories for "${title}":`, error);
      return [];
    }
  }

  async getAliases(title: string): Promise<string[]> {
    const url = new URL(this.wikidataUrl);
    url.searchParams.set('action', 'wbgetentities');
    url.searchParams.set('format', 'json');
    url.searchParams.set('titles', title);
    url.searchParams.set('sites', 'enwiki');
    url.searchParams.set('props', 'aliases');
    url.searchParams.set('origin', '*'); // CORS support

    try {
      const response = await this.retryRequest(() =>
        fetch(url.toString(), {
          headers: {
            'User-Agent': this.userAgent
          }
        })
      );

      if (!response.ok) {
        throw new Error(`Wikidata API error: ${response.status}`);
      }

      const data: WikidataResponse = await response.json();
      const entities = data.entities;

      if (!entities) {
        return [];
      }

      const entity = Object.values(entities)[0];
      const aliases = entity?.aliases?.en || [];

      return aliases
        .map(alias => alias.value)
        .filter(alias => alias !== title); // Remove self-references

    } catch (error) {
      console.error(`Failed to fetch aliases for "${title}":`, error);
      return [];
    }
  }

  private isValidCategory(category: string): boolean {
    const bannedPatterns = [
      /^Pages with/i,
      /^Articles with/i,
      /^CS1/i,
      /^Webarchive/i,
      /^Use \w+ dates/i,
      /^Wikipedia/i,
      /^All articles/i,
    ];

    return !bannedPatterns.some(pattern => pattern.test(category));
  }

  private async retryRequest(fn: () => Promise<Response>, maxRetries = 3): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fn();
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`API request failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}