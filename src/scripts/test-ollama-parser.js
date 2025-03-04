#!/usr/bin/env node
import parser from '../services/parser.js';
import { createLogger } from '../utils/logger.js';
import fetch from 'node-fetch';

const logger = createLogger('TestOllamaParser');
const OLLAMA_BASE_URL = 'http://localhost:11434/api';

/**
 * Check if Ollama is running and get available models
 */
async function checkOllamaStatus() {
  try {
    logger.info('Checking Ollama status...');
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`);
    
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      
      if (models.length > 0) {
        logger.info('Ollama is running with the following models:');
        models.forEach(model => {
          console.log(`- ${model.name}`);
        });
      } else {
        logger.warn('Ollama is running but no models are available.');
        logger.info('Please pull a model using: ollama pull llama2');
      }
    } else {
      logger.error('Ollama service is not available.');
      logger.info('Please ensure Ollama is installed and running:');
      logger.info('1. Install Ollama from https://ollama.ai/download');
      logger.info('2. Start Ollama with: ollama serve');
      logger.info('3. Pull a model with: ollama pull llama2');
    }
  } catch (error) {
    logger.error('Error connecting to Ollama:', error.message);
    logger.info('Please ensure Ollama is installed and running:');
    logger.info('1. Install Ollama from https://ollama.ai/download');
    logger.info('2. Start Ollama with: ollama serve');
    logger.info('3. Pull a model with: ollama pull llama2');
  }
}

/**
 * Test the Ollama parser with sample text
 */
async function testParser() {
  logger.info('Testing Ollama parser...');
  
  // First check Ollama status
  await checkOllamaStatus();
  
  const testCases = [
    'Call John about Project Alpha next Monday at 2pm',
    'Meeting with Sarah in Conference Room B tomorrow for 1 hour',
    'Email the team about quarterly results by Friday #important',
    'Review documentation for the new API - 50% complete',
    'Lunch with clients at Bistro on Thursday at noon'
  ];
  
  try {
    // Initialize parser
    logger.info('\nInitializing parser...');
    await parser.initialize();
    
    // If parser is not available, exit early
    if (!parser.available) {
      logger.error('Parser is not available. Please check Ollama setup.');
      return;
    }
    
    // Test each case
    for (const text of testCases) {
      logger.info(`\nParsing: "${text}"`);
      const result = await parser.parse(text);
      
      // Log the parsed result
      logger.info('Parsed result:');
      console.log(JSON.stringify(result.parsed, null, 2));
    }
    
    logger.info('\nParser test completed successfully');
  } catch (error) {
    logger.error('Error testing parser:', error);
  }
}

// Run the test
testParser();