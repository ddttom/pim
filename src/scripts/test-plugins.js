import parser from '../services/parser.js';

// Enable debug mode
process.env.NODE_ENV = 'development';

// Test cases
const testCases = [
    "Meet John in Building A12, Room 305 at 2pm",
    "Team meeting at 123 Main Street tomorrow morning",
    "Call with Sarah on Zoom https://zoom.us/j/123456789",
    "Review documents in the office",
    "Lunch meeting at Floor B2",
    "Project review in Suite 400",
    "Coffee at 789 Park Avenue"
];

console.log('Plugin System Test\n');

// Show registered plugins
const stats = parser.getStats();
console.log('Registered Plugins:', stats.registeredPlugins);
console.log('Total Pattern Count:', stats.patternCount);
console.log('\nTesting Parser...\n');

// Test each case
testCases.forEach((text, index) => {
    console.log(`Test Case ${index + 1}: "${text}"`);
    const result = parser.parse(text);
    
    // Show parsed results
    if (result.parsed.plugins.location) {
        console.log('Location detected:', JSON.stringify(result.parsed.plugins.location, null, 2));
    }
    
    // Show other relevant plugins
    Object.entries(result.parsed.plugins)
        .filter(([name, value]) => value && name !== 'location')
        .forEach(([name, value]) => {
            console.log(`${name} detected:`, JSON.stringify(value, null, 2));
        });
    
    console.log('---\n');
});

// Show debug logs
console.log('\nDebug Logs:');
parser.getLogs().forEach(log => {
    console.log(`[${log.timestamp}] ${log.message}`);
    if (log.data) {
        console.log('Data:', JSON.stringify(log.data, null, 2));
    }
});
