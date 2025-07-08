export class CategoryFilter {
  private readonly bannedCategoryPatterns = [
    /^Pages with/i,           // Maintenance categories
    /^CS1/i,                  // Citation style categories
    /^Webarchive/i,           // Archive categories
  ];

  private readonly selfReferentialWords = [
    'pages', 'categories', 'lists', 'templates'
  ];

  filterCategories(articleTitle: string, categories: string[]): string[] {
    return categories
      .filter(cat => !this.isMaintenance(cat))
      .filter(cat => !this.isMetaCategory(cat))
      .filter(cat => !this.isSelfReferential(articleTitle, cat))
      .filter(cat => !this.isTooGeneric(cat))
  }

  private isMaintenance(category: string): boolean {
    return this.bannedCategoryPatterns.some(pattern => pattern.test(category));
  }

  private isMetaCategory(category: string): boolean {
    const categoryLower = category.toLowerCase();
    
    // Filter out categories mentioning articles, wikidata, or wikipedia
    return categoryLower.includes('articles') ||
           categoryLower.includes('wikidata') ||
           categoryLower.includes('wikipedia') ||
           categoryLower.includes('commons category') ||
           categoryLower.includes('commons link');
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
    const genericCategories = ['Main topic classifications'];
    return genericCategories.some(generic => category.includes(generic));
  }

}