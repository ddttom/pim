describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit costs', async () => {
    const result = await parse('[cost:$500]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred costs', async () => {
    const result = await parse('costs $500');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
}); 
