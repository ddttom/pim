import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TagsParser');

export default {
  name: 'tags',
  parse(text) {
    logger.debug('Entering tags parser', { text });
    try {
      // Match hashtag patterns
      const tagMatches = Array.from(text.matchAll(/#([a-zA-Z]\w*)/g));
      
      // Match "tags: tag1, tag2" pattern
      const tagsListMatch = text.match(/tags:\s*([\w\s,]+)(?=\s*(?:,|\.|$|\s+(?:about|with)))/i);
      
      let tags = [];
      
      // Process hashtags
      if (tagMatches.length > 0) {
        const hashTags = tagMatches.map(match => match[1].toLowerCase());
        tags.push(...hashTags);
      }
      
      // Process tags list
      if (tagsListMatch) {
        const listTags = tagsListMatch[1]
          .split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0);
        tags.push(...listTags);
      }
      
      if (tags.length > 0) {
        const result = {
          tags: [...new Set(tags)] // Remove duplicates
        };
        logger.debug('Tags parser found matches', { result });
        return result;
      }
      
      logger.debug('Tags parser found no matches');
      return null;
    } catch (error) {
      logger.error('Error in tags parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting tags parser');
    }
  }
};
