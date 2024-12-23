describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit contexts', async () => {
    const result = await parse('[context:work]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred contexts', async () => {
    const result = await parse('at work');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
}); 
