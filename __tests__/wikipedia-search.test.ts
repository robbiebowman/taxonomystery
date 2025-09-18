import { fetchWikipediaSummaryStatus, resolveWikipediaArticle } from '../lib/wikiSearch';

jest.setTimeout(20000);

describe('Wikipedia search resolver', () => {
  it('resolves fuzzy titles to a working article link', async () => {
    const result = await resolveWikipediaArticle('Yoruba talking drums');

    expect(result).not.toBeNull();
    expect(result?.resolvedTitle).toBe('Talking drum');
    expect(result?.status).toBe(200);

    const status = await fetchWikipediaSummaryStatus(result!.resolvedTitle);
    expect(status).toBe(200);
  });

  it('reports 404 for an erroneous article name', async () => {
    const bogusTitle = 'Taxonomystery_Nonexistent_Article_Integration_Test';
    const status = await fetchWikipediaSummaryStatus(bogusTitle);

    expect(status).toBe(404);
  });
});
