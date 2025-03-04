# Testing Documentation

## Overview

The project uses Jest for testing and includes comprehensive test suites covering:

- Configuration management
- Database operations
- Parser functionality
- UI components
- Rich text editor
- Plugin system

## Test Environment

### Setup

The test environment is configured in `tests/setup.js` to:

- Use jsdom for DOM manipulation tests
- Create isolated test directories
- Clean up test data automatically
- Reset mocks between tests
- Handle file system operations safely

### Test Data Management

- Tests use isolated directory: `tests/__test_data__/`
- Each test run uses unique filenames with timestamps
- Example: `pim.test.1234567890.json`
- Automatic directory creation and cleanup
- Proper handling of test media files
- Safe concurrent test execution

## Test Suites

### Configuration Tests (`tests/config.test.js`)

- Settings management
- Environment variable overrides
- Configuration validation
- Default value handling

### Database Tests (`tests/database.test.js`)

- CRUD operations
- Entry filtering
- Batch operations
- Transaction handling
- Error recovery

### Parser Tests (`tests/parser.test.js`, `tests/parser-persist.test.js`)

- Message parsing
- Data persistence
- Complex parsing scenarios
- Example test message:

  ```bash
  "Call Fiona next wednesday re Project Cheesecake urgently with @robin and @ian #disaster"
  ```

- Tests parsing of:
  - Actions (call)
  - People (Fiona)
  - Dates (next wednesday)
  - Topics (Project Cheesecake)
  - Priority (urgently → high)
  - Participants (@robin, @ian)
  - Tags (#disaster)

### Ollama Parser Tests

#### Manual Testing Script (`src/scripts/test-ollama-parser.js`)

- AI-powered text parsing
- Integration with Ollama LLM service
- Tests parsing of various text formats:
  - Meetings with location and duration
  - Tasks with deadlines and priorities
  - Projects with participants and tags
  - Status updates with completion percentages
- Tests JSON parsing and error handling
- Verifies model selection and availability
- Example test cases:

  ```bash
  "Call John about Project Alpha next Monday at 2pm"
  "Meeting with Sarah in Conference Room B tomorrow for 1 hour"
  "Email the team about quarterly results by Friday #important"
  "Review documentation for the new API - 50% complete"
  "Lunch with clients at Bistro on Thursday at noon"
  ```

#### Automated Jest Tests

##### Basic Structure and Error Handling (`tests/parsers/ollama.test.js`)

- Tests the parser's interface and structure
- Verifies error handling for various scenarios:
  - Ollama service unavailability
  - JSON parsing errors
  - Empty or invalid input
- Tests compatibility with existing code
- Mocks Ollama service to avoid external dependencies
- Ensures backward compatibility with resetPlugins method

##### Metadata Extraction (`tests/parsers/ollama-parsing.test.js`)

- Tests specific parsing capabilities:
  - Action parsing (call, email, meet)
  - Contact parsing (people names)
  - Project parsing (project names and details)
  - Date parsing (deadlines and events)
  - Location parsing (meeting venues)
  - Duration parsing (time spans)
  - Priority parsing (importance levels)
  - Tags parsing (hashtags)
  - Status parsing (progress states)
  - Participants parsing (people involved)
- Tests complex parsing with multiple metadata types
- Tests JSON extraction from various formats
- Tests JSON cleaning and fixing for malformed input

### Renderer Tests (`tests/renderer.test.js`)

- UI component rendering
- Event handling
- User interactions
- Image upload handling
- Settings updates

### Rich Text Tests (`tests/rich-text.test.js`)

- Editor initialization
- Text formatting
- Image handling
- State management
- Content persistence

### Plugin Tests (`tests/plugins.test.js`)

- Plugin loading
- Plugin execution
- Error handling
- Plugin data persistence

## Mock Implementations

### Editor Mock

```javascript
jest.mock('../src/renderer/editor/editor.js', () => {
  const mockEditor = {
    root: { innerHTML: '' },
    getSelection: jest.fn(() => ({ index: 0 })),
    insertEmbed: jest.fn()
  };
  
  return {
    initializeEditor: jest.fn(() => mockEditor),
    getEditor: jest.fn(() => mockEditor),
    handleImageUpload: jest.fn(),
    showEditor: jest.fn(),
    clearEditor: jest.fn(),
    getEditorContent: jest.fn()
  };
});
```

### Database Mock (`tests/__mocks__/database.js`)

- Simulates database operations
- Handles transactions
- Manages test data

### Logger Mock (`tests/__mocks__/logger.js`)

- Captures log messages
- Enables log verification
- Prevents console noise

### Ollama Mock

```javascript
jest.mock('node-fetch', () => {
  return jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        models: [{ name: 'test-model' }],
        response: '```json\n{"result": "success"}\n```'
      })
    })
  );
});
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Suites

```bash
npm run test:config      # Configuration tests
npm run test:db         # Database operations
npm run test:parser     # Parser functionality
npm run test:renderer   # UI components
npm run test:rich-text  # Editor features
npm run test:plugins    # Plugin system
```

### Testing Ollama Parser

```bash
# Test the Ollama parser with the manual test script
npm run test-parser
```

This will:

- Check if Ollama is running and list available models
- Initialize the parser with the default or available model
- Run test cases with various text inputs
- Display the parsed results for each test case

```bash
# Run the automated Jest tests for the Ollama parser
npm test -- tests/parsers/ollama.test.js tests/parsers/ollama-parsing.test.js
```

This will run the automated tests for the Ollama parser, which mock the Ollama service to avoid external dependencies.

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm test -- --coverage
```

## Best Practices

1. **Test Isolation**
   - Each test should be independent
   - Clean up test data after each test
   - Reset mocks between tests
   - Avoid test interdependencies

2. **Mock Implementation**
   - Keep mocks simple
   - Mock only what's necessary
   - Use jest.fn() for function mocks
   - Implement mock verification

3. **Test Data**
   - Use unique filenames
   - Clean up after tests
   - Use realistic test data
   - Handle edge cases

4. **Assertions**
   - Test one thing at a time
   - Use clear assertion messages
   - Check both success and failure cases
   - Verify side effects

5. **Test Organization**
   - Group related tests
   - Use clear test descriptions
   - Follow arrange-act-assert pattern
   - Keep tests focused

## Adding New Tests

1. Do not add tests unless the user requests them
2. Create test file in appropriate directory, tests/....
3. Import required modules and mocks
4. Set up test data and mocks
5. Write test cases
6. Verify both success and failure scenarios
7. Clean up test data
8. Update test documentation

## Common Patterns

### Testing Async Operations

```javascript
test('handles async operations', async () => {
  // Arrange
  const data = await setupTestData();
  
  // Act
  const result = await performOperation(data);
  
  // Assert
  expect(result).toBeDefined();
  expect(result.status).toBe('success');
});
```

### Testing UI Components

```javascript
test('handles user interactions', async () => {
  // Setup DOM
  document.body.innerHTML = '<div id="root"></div>';
  
  // Initialize component
  const component = await initComponent();
  
  // Trigger event
  fireEvent.click(component);
  
  // Verify result
  expect(component.classList.contains('active')).toBe(true);
});
```

### Testing Error Cases

```javascript
test('handles errors properly', async () => {
  // Setup error condition
  mockFunction.mockRejectedValue(new Error('Test error'));
  
  // Verify error handling
  await expect(async () => {
    await functionUnderTest();
  }).rejects.toThrow('Test error');
});
```

### Testing Ollama with JS

```javascript
test('parses text with Ollama', async () => {
  // Initialize parser
  await parser.initialize();
  
  // Parse text
  const result = await parser.parse('Call John about Project Alpha next Monday at 2pm');
  
  // Verify parsed data
  expect(result.parsed.action).toBe('call');
  expect(result.parsed.contact).toBe('John');
  expect(result.parsed.project.project).toBe('Project Alpha');
  expect(result.parsed.final_deadline).toBeDefined();
});
```

### Testing JSON Parsing

```javascript
test('extracts JSON from Ollama response', () => {
  // Test with JSON in code block
  const jsonInCodeBlock = '```json\n{"action": "call", "contact": "John"}\n```';
  const result = parser.extractJsonFromCompletion(jsonInCodeBlock);
  
  // Verify extracted JSON
  expect(result).toEqual({ action: 'call', contact: 'John' });
});
