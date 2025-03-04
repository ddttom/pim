# Ollama Parser Implementation

This document describes the implementation of the Ollama-based parser for the PIM application.

## Overview

The parser has been reimplemented to use Ollama, a local large language model (LLM) service, to provide more accurate and comprehensive parsing of text content. This replaces the previous regex-based parser system with a more intelligent, context-aware parsing solution.

## Requirements

- Ollama installed and running locally (<https://ollama.ai/>)
- A compatible LLM model (default: hhao/qwen2.5-coder-tools:32b)

## How It Works

The Ollama parser works by:

1. Sending text content to the Ollama API
2. Using a carefully crafted prompt to instruct the LLM to extract structured information
3. Parsing the JSON response from the LLM
4. Formatting the result to match the expected structure for the application

## Setup Instructions

### 1. Install Ollama

Follow the installation instructions at [ollama.ai/download](https://ollama.ai/download).

**macOS**:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Linux**:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows**:
Download the installer from [ollama.ai/download](https://ollama.ai/download).

### 2. Start the Ollama Service

After installation, start the Ollama service:

```bash
ollama serve
```

This will start the Ollama service on <http://localhost:11434>.

### 3. Pull the Required Model

In a new terminal window, pull the qwen2.5-coder-tools model:

```bash
ollama pull hhao/qwen2.5-coder-tools:32b
```

You can also use other models by modifying the `DEFAULT_MODEL` constant in `src/services/parser.js`.

Available models include:

- llama2
- mistral
- gemma
- phi
- orca-mini
- vicuna
- And many more from [Ollama Library](https://ollama.ai/library)

## Testing the Parser

A test script is provided to verify that the Ollama parser is working correctly:

```bash
npm run test-parser
```

This will run several test cases and display the parsed results.

## Troubleshooting

### Common Issues

1. **"Model not found" error**:
   - Ensure you've pulled the model with `ollama pull hhao/qwen2.5-coder-tools:32b`
   - Check available models with `ollama list`
   - The parser will automatically use the first available model if the default model is not found

2. **"Ollama is not available" error**:
   - Ensure Ollama is installed correctly
   - Make sure the Ollama service is running with `ollama serve`
   - Check if you can access the Ollama API at <http://localhost:11434/api/tags>

3. **Empty results returned**:
   - This usually means Ollama is not running or the model is not available
   - Follow the setup instructions again
   - Check the logs for specific error messages

4. **JSON parsing errors**:
   - The parser includes robust JSON parsing with multiple fallback mechanisms
   - If the LLM returns malformed JSON, the parser will attempt to fix it
   - If JSON parsing fails completely, the parser will extract key information using regex patterns
   - Special handling is included for common patterns like hashtags and priorities

### Checking Ollama Status

To check if Ollama is running and what models are available:

```bash
# List all available models
ollama list

# Check running models
ollama ps

# Check Ollama version
ollama --version

# Test a model directly
ollama run hhao/qwen2.5-coder-tools:32b "Hello, world!"
```

## Implementation Details

### Parser Interface

The parser maintains the same interface as the previous implementation:

```javascript
// Parse text content
const result = parser.parse(text);
```

### Parser Structure

The parser is implemented as a class with the following methods:

- `initialize()`: Connect to the Ollama service and check if the model is available
- `parse(content)`: Parse text content and return structured information
- `generateCompletion(prompt)`: Send a prompt to Ollama and get a completion
- `buildParsingPrompt(text)`: Build a prompt for parsing text content
- `extractJsonFromCompletion(completion)`: Extract JSON from Ollama's response
- `cleanJsonString(jsonStr)`: Clean up JSON string by removing common issues
- `fixJsonPropertyNames(jsonStr)`: Fix JSON property names by ensuring they are properly quoted
- `extractKeyInformation(completion)`: Extract key information manually when JSON parsing fails
- `getEmptyResult(text)`: Get an empty result object for invalid input or errors
- `resetPlugins()`: No-op method kept for compatibility with tests
- `getAvailableModels()`: Get a list of available models
- `setModel(model)`: Set the model to use for parsing

### JSON Parsing and Fallback Mechanisms

The parser includes a robust JSON parsing system with multiple fallback mechanisms:

1. **Initial JSON Extraction**: Attempts to extract JSON from markdown code blocks or direct JSON objects
2. **JSON Cleaning**: Cleans the extracted JSON string by removing common issues like trailing commas and unquoted property names
3. **JSON Fixing**: If parsing fails, attempts to fix common JSON issues like missing quotes around property names
4. **Manual Extraction**: If all JSON parsing attempts fail, extracts key information using regex patterns
5. **Special Case Handling**: Includes special handling for common patterns like hashtags and priorities

This multi-layered approach ensures that the parser can extract useful information even when the LLM returns malformed JSON.

### Error Handling

The parser includes comprehensive error handling:

- Checks if Ollama is available during initialization
- Handles connection errors when communicating with the Ollama API
- Provides fallback empty results when parsing fails
- Logs detailed error information for debugging
- Automatically selects available models if the default model is not found

## Advantages Over Previous Implementation

1. **Improved Accuracy**: LLMs can understand context and nuance better than regex patterns
2. **Better Handling of Edge Cases**: More flexible parsing that can adapt to different text formats
3. **Simplified Maintenance**: Single parser file instead of multiple parser modules
4. **Enhanced Capabilities**: Can extract more complex relationships and information from text
5. **Robust Fallback Mechanisms**: Multiple layers of fallback to ensure useful information is extracted even when the LLM returns malformed responses

## Limitations

1. **Dependency on Ollama**: Requires Ollama to be installed and running
2. **Performance**: May be slower than the regex-based approach for simple parsing tasks
3. **Resource Usage**: LLMs require more system resources than regex patterns

## Future Improvements

1. **Caching**: Add caching to improve performance for repeated parsing of similar text
2. **Configuration**: Add more configuration options for Ollama URL, model selection, etc.
3. **Performance Optimization**: Fine-tune prompts and model parameters for faster parsing
4. **Model Customization**: Create a custom model specifically trained for parsing tasks
5. **Prompt Engineering**: Refine the prompt to improve parsing accuracy for specific use cases
