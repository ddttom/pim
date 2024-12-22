// src/services/parser/index.js
import { createLogger } from '../../utils/logger.js';
import { compilePatterns } from './utils/patterns.js';

const logger = createLogger('ParserService');

class ParserService {
    constructor() {
        this.parsers = new Map();
        this.parserStats = new Map();
        this.compiledPatterns = new Map();
        
        // Parser middleware system for cross-cutting concerns
        this.middleware = [];
    }

    registerParser(name, parser) {
        if (!parser.parse || typeof parser.parse !== 'function') {
            throw new Error(`Invalid parser: ${name} must have a parse method`);
        }

        // Compile patterns if parser has them
        if (parser.patterns) {
            this.compiledPatterns.set(name, compilePatterns(parser.patterns));
        }

        this.parsers.set(name, parser);
        logger.info(`Parser registered: ${name}`);
    }

    // Add middleware for cross-cutting concerns
    use(middlewareFn) {
        this.middleware.push(middlewareFn);
    }

    async parse(text, options = {}) {
        if (!text || typeof text !== 'string') {
            logger.warn('Invalid input:', { text });
            return {
                success: false,
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            };
        }

        try {
            logger.debug('Starting parse:', { text, options });
            const startTime = performance.now();

            // Initialize result structure
            const result = {
                raw: text,
                parsed: {},
                metadata: {
                    parsers: {},
                    confidence: {},
                    performance: {},
                    tokens: this.tokenize(text)
                }
            };

            // Run middleware pipeline
            for (const mw of this.middleware) {
                await mw(text, result);
            }

            // Track errors without failing
            const errors = [];

            // Run each parser with dependency ordering
            const orderedParsers = this.getOrderedParsers();
            for (const [name, parser] of orderedParsers) {
                const parserStartTime = performance.now();
                try {
                    if (options.exclude?.includes(name)) continue;

                    // Get compiled patterns for this parser
                    const patterns = this.compiledPatterns.get(name);
                    
                    const parserResult = await parser.parse(text, patterns);
                    if (parserResult && parserResult.type !== 'error') {
                        result.parsed[name] = parserResult.value;
                        result.metadata.parsers[name] = parserResult.metadata;
                        result.metadata.confidence[name] = parserResult.metadata.confidence;
                    } else if (parserResult?.type === 'error') {
                        errors.push({
                            parser: name,
                            ...parserResult
                        });
                    }
                } catch (error) {
                    logger.error(`Parser ${name} failed:`, error);
                    errors.push({
                        parser: name,
                        error: 'PARSER_ERROR',
                        message: error.message
                    });
                }

                result.metadata.performance[name] = performance.now() - parserStartTime;
                this.updateParserStats(name, result.metadata.performance[name]);
            }

            // Post-process results
            this.postProcess(result);

            // Add timing and error information
            result.metadata.totalDuration = performance.now() - startTime;
            if (errors.length > 0) {
                result.metadata.errors = errors;
            }

            // Emit parse completed event for plugins
            this.emit('parseCompleted', result);

            return {
                success: true,
                result
            };

        } catch (error) {
            logger.error('Parse failed:', error);
            return {
                success: false,
                error: 'PARSER_ERROR',
                message: error.message
            };
        }
    }

    // Break input text into tokens for more efficient parsing
    tokenize(text) {
        return text.toLowerCase()
                  .split(/\s+/)
                  .filter(token => token.length > 0);
    }

    // Post-process parsed results
    postProcess(result) {
        // Resolve cross-parser dependencies
        if (result.parsed.subject && result.parsed.date) {
            result.parsed.subject.deadline = result.parsed.date.value;
        }

        // Calculate overall confidence
        result.metadata.overallConfidence = this.calculateOverallConfidence(
            result.metadata.confidence
        );

        // Add parsed summary
        result.summary = this.generateSummary(result);
    }

    // Order parsers based on dependencies
    getOrderedParsers() {
        // Implement topological sort based on parser dependencies
        // For now, return existing parsers
        return Array.from(this.parsers.entries());
    }

    // Generate human-readable summary
    generateSummary(result) {
        const summary = [];
        
        if (result.parsed.subject) {
            summary.push(`Task: ${result.parsed.subject.text}`);
        }
        if (result.parsed.date) {
            summary.push(`When: ${new Date(result.parsed.date.value).toLocaleString()}`);
        }
        if (result.parsed.priority) {
            summary.push(`Priority: ${result.parsed.priority}`);
        }

        return summary.join('\n');
    }

    // Event system for plugin architecture
    emit(eventName, data) {
        // Implement event emission for plugins
    }
}

export default new ParserService();
