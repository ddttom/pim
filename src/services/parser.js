import { createLogger } from '../utils/logger.js';

const logger = createLogger('ParserService');

class ParserService {
    constructor() {
        // Initialize parser registry
        this.parsers = new Map();

        // Initialize plugins registry
        this.plugins = new Map();

        // Track parser performance
        this.parserStats = new Map();
    }

    resetPlugins() {
        this.plugins.clear();
    }

    registerPlugin(name, plugin) {
        if (!plugin.parse || typeof plugin.parse !== 'function') {
            throw new Error('Invalid plugin: must have a parse method');
        }
        this.plugins.set(name, plugin);
    }

    parse(text, options = {}) {
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
                parsed: {
                    plugins: {}
                },
                metadata: {
                    parsers: {},
                    confidence: {},
                    performance: {}
                }
            };

            // Track errors without failing
            const errors = [];

            // Run each parser
            for (const [name, parser] of this.parsers) {
                // Skip if parser is excluded in options
                if (options.exclude?.includes(name)) {
                    continue;
                }

                const parserStartTime = performance.now();
                try {
                    const parserResult = parser.parse(text);
                    
                    // Handle successful parse
                    if (parserResult && parserResult.type !== 'error') {
                        result.parsed[name] = parserResult.value;
                        result.metadata.parsers[name] = parserResult.metadata;
                        result.metadata.confidence[name] = parserResult.metadata.confidence;
                    }
                    // Handle parser errors
                    else if (parserResult?.type === 'error') {
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

                // Record parser performance
                const parserDuration = performance.now() - parserStartTime;
                result.metadata.performance[name] = parserDuration;
                this.updateParserStats(name, parserDuration);
            }

            // Run each plugin
            for (const [name, plugin] of this.plugins) {
                // Skip if parser is excluded in options
                if (options.exclude?.includes(name)) {
                    continue;
                }

                try {
                    const pluginResult = plugin.parse(text);
                    if (pluginResult) {
                        result.parsed.plugins[name] = pluginResult;
                    }
                } catch (error) {
                    console.error('Plugin error failed:', error);
                }
            }

            // Calculate overall confidence
            result.metadata.overallConfidence = this.calculateOverallConfidence(
                result.metadata.confidence
            );

            // Add timing information
            result.metadata.totalDuration = performance.now() - startTime;

            // Add errors if any occurred
            if (errors.length > 0) {
                result.metadata.errors = errors;
            }

            logger.debug('Parse completed:', {
                duration: result.metadata.totalDuration,
                confidence: result.metadata.overallConfidence,
                errorCount: errors.length
            });

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

    calculateOverallConfidence(confidences) {
        if (!confidences || Object.keys(confidences).length === 0) {
            return 0;
        }

        // Weight parsers differently based on importance
        const weights = {
            date: 1.2,
            project: 1.1,
            priority: 1.0,
            tags: 0.9,
            recurring: 0.8
        };

        let totalWeight = 0;
        let weightedSum = 0;

        for (const [parser, confidence] of Object.entries(confidences)) {
            const weight = weights[parser] || 1;
            weightedSum += confidence * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    updateParserStats(parser, duration) {
        if (!this.parserStats.has(parser)) {
            this.parserStats.set(parser, {
                count: 0,
                totalDuration: 0,
                minDuration: Infinity,
                maxDuration: -Infinity
            });
        }

        const stats = this.parserStats.get(parser);
        stats.count++;
        stats.totalDuration += duration;
        stats.minDuration = Math.min(stats.minDuration, duration);
        stats.maxDuration = Math.max(stats.maxDuration, duration);
    }

    getPerformanceStats() {
        const stats = {};
        for (const [parser, data] of this.parserStats) {
            stats[parser] = {
                count: data.count,
                avgDuration: data.totalDuration / data.count,
                minDuration: data.minDuration,
                maxDuration: data.maxDuration
            };
        }
        return stats;
    }

    registerParser(name, parser) {
        if (!parser.parse || typeof parser.parse !== 'function') {
            throw new Error(`Invalid parser: ${name} must have a parse method`);
        }
        this.parsers.set(name, parser);
        logger.info(`Parser registered: ${name}`);
    }

    unregisterParser(name) {
        if (this.parsers.delete(name)) {
            logger.info(`Parser unregistered: ${name}`);
            return true;
        }
        return false;
    }
}

export default new ParserService();
