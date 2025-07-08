export class CategoryFilter {
  private readonly bannedCategoryPatterns = [
    /^Pages with/i,           // Maintenance categories
    /^Articles with/i,        // Maintenance categories  
    /^CS1/i,                  // Citation style categories
    /^Webarchive/i,           // Archive categories
    /^Use \w+ dates/i,        // Date format categories
    /^Wikipedia/i,            // Meta Wikipedia categories
    /^All articles/i,         // Maintenance categories
  ];

  private readonly selfReferentialWords = [
    'articles', 'pages', 'categories', 'lists', 'templates'
  ];

  filterCategories(articleTitle: string, categories: string[]): string[] {
    return categories
      .filter(cat => !this.isMaintenance(cat))
      .filter(cat => !this.isSelfReferential(articleTitle, cat))
      .filter(cat => !this.isTooGeneric(cat))
      .filter(cat => !this.isTooSpecific(cat))
      .slice(0, 15); // Limit to prevent overwhelming players
  }

  private isMaintenance(category: string): boolean {
    return this.bannedCategoryPatterns.some(pattern => pattern.test(category));
  }

  private isSelfReferential(title: string, category: string): boolean {
    const titleWords = title.toLowerCase().split(/\s+/);
    const categoryLower = category.toLowerCase();
    
    // Check if category contains the article title words
    return titleWords.some(word => 
      word.length > 3 && categoryLower.includes(word)
    );
  }

  private isTooGeneric(category: string): boolean {
    const genericCategories = ['All articles', 'Articles', 'Main topic classifications'];
    return genericCategories.some(generic => category.includes(generic));
  }

  private isTooSpecific(category: string): boolean {
    // Categories with very specific years, names, or technical terms
    return /\b(19|20)\d{2}\b/.test(category) || // Specific years
           category.includes('births') ||
           category.includes('deaths') ||
           category.length > 50; // Very long categories tend to be too specific
  }
}