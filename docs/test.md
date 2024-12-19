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

1. Create test file in appropriate directory
2. Import required modules and mocks
3. Set up test data and mocks
4. Write test cases
5. Verify both success and failure scenarios
6. Clean up test data
7. Update test documentation

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
