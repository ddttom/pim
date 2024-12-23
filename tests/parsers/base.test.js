describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit patterns', async () => {
    const result = await parse('[base:value]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred patterns', async () => {
    const result = await parse('basic value');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
}); 
