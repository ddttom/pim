import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ActionParser');

// Module-level pattern definitions for performance
const ACTION_PATTERNS = {
  todo: /\b(TODO|TO-DO):\s*(.+)$/im,
  action: /\b(ACTION):\s*(.+)$/im,
  task: /\b(TASK):\s*(.+)$/im
};

export const name = 'action';

export async function parse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  const patterns = {
    explicit_verb: /\b(need\s+to|must|should|have\s+to)?\s*(call|review|send|complete|do|make|write|create|update|delete|check|verify|confirm|schedule|book|reserve|pay|buy|get|find|research|analyze|prepare|organize|clean|fix|implement|test|debug|deploy|submit|upload|download|install|configure|setup|maintain|monitor|backup|restore|archive|print|scan|fax|mail|ship|deliver|pick\s+up|drop\s+off|meet|visit|attend|participate|join|lead|manage|supervise|train|teach|learn|study|read|watch|listen|speak|present|report|document|edit|proofread|format|design|draw|paint|photograph|record|film|animate|code|program|develop|build|construct|assemble|repair|maintain|service|inspect|examine|evaluate|assess|measure|calculate|estimate|plan|arrange|coordinate|facilitate|moderate|mediate|negotiate|sell|market|advertise|promote|distribute|allocate|assign|delegate|approve|authorize|sign|endorse|process|handle|sort|file|catalog|index|register|enroll|subscribe|unsubscribe|start|begin|end|finish|close|open|launch|initiate|terminate|cancel|pause|resume|continue|repeat|follow\s+up|remind|notify|inform|contact|reach\s+out|respond|reply|answer|acknowledge|thank|apologize|request|ask|inquire|investigate|explore|search|locate|identify|select|choose|decide|determine|resolve|solve|troubleshoot|diagnose|analyze|review|audit|survey|interview|question|quiz|grade|score|rate|rank|compare|contrast|match|link|connect|disconnect|separate|divide|combine|merge|integrate|import|export|convert|transform|translate|interpret|understand|explain|clarify|specify|define|outline|summarize|conclude|recommend|suggest|propose|offer|accept|reject|approve|disapprove|agree|disagree|support|oppose|resist|object|protest|appeal|petition|claim|defend|protect|secure|insure|guarantee|warrant|promise|pledge|commit|dedicate|devote|allocate|budget|fund|finance|invest|spend|save|earn|profit|benefit|succeed|fail|win|lose|gain|acquire|obtain|receive|collect|gather|harvest|extract|mine|drill|dig|plant|grow|cultivate|nurture|feed|water|irrigate|fertilize|spray|treat|cure|heal|recover|restore|rehabilitate|exercise|practice|train|condition|strengthen|weaken|reduce|increase|expand|shrink|compress|stretch|bend|twist|turn|rotate|spin|slide|glide|float|sink|swim|dive|fly|jump|run|walk|crawl|climb|descend|fall|rise|lift|lower|raise|drop|catch|throw|hit|strike|kick|punch|push|pull|drag|carry|hold|release|free|trap|capture|seize|grab|clutch|grip|grasp|touch|feel|sense|detect|observe|notice|spot|find|discover|uncover|reveal|expose|hide|conceal|cover|wrap|pack|unpack|empty|fill|pour|spill|leak|drip|flow|stream|spray|splash|wash|clean|dirty|soil|stain|mark|label|tag|name|title|head|lead|direct|guide|steer|drive|ride|sail|navigate|orbit|circle|square|triangle|line|curve|wave|vibrate|shake|quake|break|crack|split|tear|rip|cut|slice|dice|chop|mince|grind|crush|pound|beat|whip|stir|mix|blend|fold|knead|roll|spread|smooth|rough|polish|shine|glow|burn|melt|freeze|boil|steam|cook|bake|broil|fry|grill|roast|toast|warm|cool|chill|refrigerate|preserve|store|keep|maintain|retain|hold|contain|include|exclude|omit|skip|miss|avoid|dodge|escape|flee|run|hide|seek|search|hunt|track|trail|follow|lead|guide|direct|manage|control|operate|run|execute|perform|conduct|carry\s+out|undertake|attempt|try|test|check|verify|validate|prove|demonstrate|show|display|exhibit|present|represent|stand\s+for|mean|signify|indicate|suggest|imply|denote|connote|symbolize|exemplify|illustrate|clarify|explain|describe|define|specify|state|declare|announce|proclaim|pronounce|voice|express|communicate|convey|transmit|send|receive|get|take|give|put|place|set|lay|stand|sit|lie|rest|stay|remain|continue|persist|endure|last|survive|live|exist|be|become|grow|develop|evolve|change|alter|modify|adjust|adapt|accommodate|fit|suit|match|correspond|agree|differ|vary|diverge|converge|meet|join|unite|separate|divide|split|break|part|leave|arrive|depart|return|come|go|move|travel|journey|venture|roam|wander|stray|drift|float|fly|soar|glide|dive|plunge|fall|drop|rise|climb|ascend|descend|enter|exit|pass|cross|traverse|span|bridge|link|connect|join|attach|detach|separate|remove|extract|withdraw|deposit|insert|inject|input|output|process|handle|manage|deal|cope|struggle|fight|battle|contest|compete|race|run|rush|hurry|hasten|slow|delay|wait|pause|stop|end)\b/i,
    to_prefix: /\bto\s+(\w+)\s+(\w+)/i,
    completed_action: /[✓✔]\s*(\w+)\s+(.*)/i
  };

  let bestMatch = null;
  let highestConfidence = 0;

  for (const [pattern, regex] of Object.entries(patterns)) {
    const match = text.match(regex);
    if (match) {
      let verb;
      let object;
      let isComplete = false;
      let confidence;

      switch (pattern) {
        case 'explicit_verb':
          verb = match[2];
          object = text.slice(match.index + match[0].length).trim();
          confidence = 0.85;
          break;
        case 'to_prefix':
          verb = match[1];
          object = match[2];
          confidence = 0.8;
          break;
        case 'completed_action':
          verb = match[1];
          object = match[2];
          isComplete = true;
          confidence = 0.9;
          break;
      }

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          type: 'action',
          value: {
            verb,
            object,
            isComplete
          },
          metadata: {
            confidence,
            pattern,
            originalMatch: match[0]
          }
        };
      }
    }
  }

  return bestMatch;
}

function extractValue(matches) {
  return matches[2].trim();
}

function calculateConfidence(matches, fullText) {
  // Base confidence
  let confidence = 0.7;

  // Increase confidence based on match position and context
  if (matches.index === 0) confidence += 0.1;
  if (matches[0].toUpperCase() === matches[0]) confidence += 0.1;
  
  // Cap confidence at 1.0
  return Math.min(confidence, 1.0);
}
