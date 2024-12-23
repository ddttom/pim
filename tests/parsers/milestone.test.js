describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit milestones', async () => {
    const result = await parse('[milestone:Beta Release]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred milestones', async () => {
    const result = await parse('beta milestone');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
}); 
