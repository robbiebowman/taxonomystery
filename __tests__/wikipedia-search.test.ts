import { fetchWikipediaSummaryStatus, resolveWikipediaArticle } from '../lib/wikiSearch';

describe('Wikipedia search resolver', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves fuzzy titles to a working article link', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementationOnce(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          query: {
            search: [
              {
                title: 'Talking drum'
              }
            ]
          }
        })
      } as Response;
    }).mockImplementationOnce(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({})
      } as Response;
    });

    const result = await resolveWikipediaArticle('Yoruba talking drums');

    expect(result).not.toBeNull();
    expect(result?.resolvedTitle).toBe('Talking drum');
    expect(result?.status).toBe(200);

    expect(fetchSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('srsearch=Yoruba+talking+drums'), expect.objectContaining({
      headers: expect.objectContaining({ 'User-Agent': expect.any(String) })
    }));

    expect(fetchSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('/Talking_drum'), expect.objectContaining({
      headers: expect.objectContaining({ 'User-Agent': expect.any(String) })
    }));
  });

  it('reports 404 for an erroneous article name', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({})
    } as Response);

    const bogusTitle = 'Taxonomystery_Nonexistent_Article_Integration_Test';
    const status = await fetchWikipediaSummaryStatus(bogusTitle);

    expect(status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/Taxonomystery_Nonexistent_Article_Integration_Test'),
      expect.objectContaining({ headers: expect.objectContaining({ 'User-Agent': expect.any(String) }) })
    );
  });
});
