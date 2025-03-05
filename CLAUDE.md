# PIM Project Commands & Style Guide

## Commands

- Build: `npm run build`
- Start: `npm start`
- Development: `npm run dev`
- Test all: `npm test`
- Test specific suites: `npm run test:parser`, `npm run test:config`, `npm run test:db`
- Run test with pattern: `npm test -- -t "pattern"` or `npm test -- tests/parser.test.js`
- Run Ollama parser test: `npm run test-parser`
- Lint: `npm run lint`
- Fix lint issues: `npm run lint:fix`
- Clean database: `npm run clean-db`

## Code Style

- Follows Airbnb style guide
- Plain JavaScript
- Do not use Typescript or Vue.js
- Use ES modules (`import`/`export`) with `.js` extensions
- Prefer async/await over promises with then/catch
- Use descriptive camelCase variable names
- Components/Classes use PascalCase
- Error handling: use try/catch for async operations
- Use consistent indentation (2 spaces)
- Include JSDoc comments for public functions
- Use Jest for testing with descriptive test names

## Project Structure

- Main process: `src/main.cjs`
- Renderer code: `src/renderer/`
- Services: `src/services/`
- Utils: `src/utils/`
