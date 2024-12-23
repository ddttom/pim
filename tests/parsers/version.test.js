describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit versions', async () => {
    const result = await parse('[version:1.0.0]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred versions', async () => {
    const result = await parse('version 1.0.0');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
}); 
