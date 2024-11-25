const Parser = require("../src/services/parser");
const MockLogger = require("./__mocks__/logger");

describe("NaturalLanguageParser", () => {
  let parser;
  let logger;

  beforeEach(() => {
    logger = new MockLogger();
    parser = new Parser(logger);
  });

  test('should correctly interpret "next Wednesday" as the Wednesday of the following week', () => {
    const now = new Date();
    const nextWednesday = new Date(now);
    nextWednesday.setDate(now.getDate() + ((3 + 7 - now.getDay()) % 7) + 7);

    const result = parser.calculateRelativeDate("next Wednesday");
    console.log("Calculated Date for next Wednesday:", result.toDateString());
    expect(result.toDateString()).toBe(nextWednesday.toDateString());
  });

  test('should correctly interpret "this Wednesday" as the immediate upcoming Wednesday', () => {
    const now = new Date();
    const thisWednesday = new Date(now);
    thisWednesday.setDate(now.getDate() + ((3 + 7 - now.getDay()) % 7)); // Calculate this Wednesday

    const result = parser.calculateRelativeDate("this Wednesday");
    console.log("Calculated Date for this Wednesday:", result.toDateString());
    expect(result.toDateString()).toBe(thisWednesday.toDateString());
  });

  test('should correctly interpret "last Wednesday" as the Wednesday of the previous week', () => {
    const now = new Date();
    const lastWednesday = new Date(now);
    lastWednesday.setDate(now.getDate() + ((3 + 7 - now.getDay()) % 7) - 7); // Calculate last Wednesday

    const result = parser.calculateRelativeDate("last Wednesday");
    console.log("Calculated Date for last Wednesday:", result.toDateString());
    expect(result.toDateString()).toBe(lastWednesday.toDateString());
  });

  test('should correctly interpret "the weekend" as the upcoming Saturday', () => {
    const now = new Date();
    const weekend = new Date(now);
    weekend.setDate(now.getDate() + ((6 + 7 - now.getDay()) % 7)); // Calculate the upcoming Saturday

    const result = parser.calculateRelativeDate("the weekend");
    console.log("Calculated Date for the weekend:", result.toDateString());
    expect(result.toDateString()).toBe(weekend.toDateString());
  });

  test('should correctly interpret "next weekend" as the Saturday of the following week', () => {
    const now = new Date();
    const nextWeekend = new Date(now);
    nextWeekend.setDate(now.getDate() + ((6 + 7 - now.getDay()) % 7) + 7); // Calculate the next Saturday

    const result = parser.calculateRelativeDate("next weekend");
    console.log("Calculated Date for next weekend:", result.toDateString());
    expect(result.toDateString()).toBe(nextWeekend.toDateString());
  });

  test('should correctly interpret "last Friday of the month" as the last Friday of the current month', () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastFriday = new Date(lastDayOfMonth);
    lastFriday.setDate(
      lastDayOfMonth.getDate() - ((lastDayOfMonth.getDay() + 2) % 7)
    ); // Calculate the last Friday

    const result = parser.calculateRelativeDate("last Friday of the month");
    console.log(
      "Calculated Date for last Friday of the month:",
      result.toDateString()
    );
    expect(result.toDateString()).toBe(lastFriday.toDateString());
  });

  test('should correctly interpret "end of month" as the last day of the current month', () => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the current month

    const result = parser.calculateRelativeDate("end of month");
    console.log("Calculated Date for end of month:", result.toDateString());
    expect(result.toDateString()).toBe(endOfMonth.toDateString());
  });

  test('should correctly interpret "beginning of next month" as the first day of the next month', () => {
    const now = new Date();
    const beginningOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    ); // First day of the next month

    const result = parser.calculateRelativeDate("beginning of next month");
    console.log(
      "Calculated Date for beginning of next month:",
      result.toDateString()
    );
    expect(result.toDateString()).toBe(beginningOfNextMonth.toDateString());
  });

  test('should correctly interpret "next year" as the first day of the next year', () => {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 0, 1); // First day of the next year

    const result = parser.calculateRelativeDate("next year");
    console.log("Calculated Date for next year:", result.toDateString());
    expect(result.toDateString()).toBe(nextYear.toDateString());
  });

  describe("Duration Parsing", () => {
    test("should parse minutes", () => {
      const result = parser.parse("meeting for 30 minutes");
      expect(result.duration).toEqual({ minutes: 30 });
    });

    test("should parse hours", () => {
      const result = parser.parse("meeting for 2 hours");
      expect(result.duration).toEqual({ hours: 2 });
    });

    test('should parse duration with "lasting"', () => {
      const result = parser.parse("meeting lasting 45 min");
      expect(result.duration).toEqual({ minutes: 45 });
    });
  });

  describe("Time of Day Parsing", () => {
    test("should parse morning time", () => {
      const result = parser.parse("meeting tomorrow morning");
      expect(result.timeOfDay).toEqual({
        period: "morning",
        start: 9,
        end: 12,
      });
    });
  });

  describe("Recurring Pattern Parsing", () => {
    test("should parse daily recurring", () => {
      const result = parser.parse("meeting every day");
      expect(result.recurring).toEqual({ type: "daily" });
    });

    test("should parse weekly recurring", () => {
      const result = parser.parse("meeting every monday");
      expect(result.recurring).toEqual({ type: "weekly", interval: "monday" });
    });

    test("should parse monthly recurring", () => {
      const result = parser.parse("meeting every month");
      expect(result.recurring).toEqual({ type: "monthly" });
    });
  });

  describe("Priority Parsing", () => {
    test("should parse high priority", () => {
      const result = parser.parse("urgent meeting tomorrow");
      expect(result.priority).toBe("high");
    });

    test("should parse medium priority", () => {
      const result = parser.parse("normal priority meeting");
      expect(result.priority).toBe("medium");
    });

    test("should parse low priority", () => {
      const result = parser.parse("low priority task");
      expect(result.priority).toBe("low");
    });
  });

  describe("Location Parsing", () => {
    test("should parse office location", () => {
      const result = parser.parse("meeting in the office");
      expect(result.location).toEqual({ type: "office", value: "office" });
    });

    test("should parse online location", () => {
      const result = parser.parse("zoom meeting tomorrow");
      expect(result.location).toEqual({ type: "online", value: "zoom" });
    });

    test("should parse travel location", () => {
      const result = parser.parse("meeting in New York");
      expect(result.location).toEqual({ type: "travel", value: "New York" });
    });
  });

  describe("Complex Input Parsing", () => {

    test("should parse urgent zoom meeting with duration", () => {
      const result = parser.parse(
        "urgent zoom meeting with John tomorrow morning for 2 hours"
      );
      expect(result).toMatchObject({
        action: "meet",
        contact: "John",
        priority: "high",
        location: { type: "online", value: "zoom" },
        duration: { hours: 2 },
        timeOfDay: { period: "morning", start: 9, end: 12 },
      });
      expect(result.datetime).toBeTruthy();
    });

    test("should parse recurring team meeting with location", () => {
      const result = parser.parse(
        "team meeting every monday morning at 9am in the office"
      );
      expect(result).toMatchObject({
        action: "meet",
        recurring: { type: "weekly", interval: "monday" },
        timeOfDay: { hour: 9, minutes: 0, period: "morning" },
        location: { type: "office", value: "office" },
      });
    });

    test("should parse recurring important call with duration", () => {
      const result = parser.parse(
        "important call with Sarah every day at 10am for 30 minutes"
      );
      expect(result).toMatchObject({
        action: "call",
        contact: "Sarah",
        priority: "high",
        recurring: { type: "daily" },
        duration: { minutes: 30 },
        timeOfDay: { hour: 10, minutes: 0 },
      });
    });

    test("should parse complex meeting input", () => {
      const result = parser.parse(
        "urgent zoom meeting with John tomorrow morning for 2 hours"
      );
      expect(result).toMatchObject({
        action: "meet",
        contact: "John",
        priority: "high",
        location: { type: "online", value: "zoom" },
        duration: { hours: 2 },
        timeOfDay: { period: "morning", start: 9, end: 12 },
      });
      expect(result.datetime).toBeTruthy();
    });

    test("should parse complex recurring meeting", () => {
      const result = parser.parse(
        "team meeting every monday morning at 9am in the office"
      );
      expect(result).toMatchObject({
        action: "meet",
        recurring: { type: "weekly", interval: "monday" },
        timeOfDay: { period: "morning", start: 9, end: 12 },
        location: { type: "office", value: "office" },
      });
    });

    test("should parse complex call schedule", () => {
      const result = parser.parse(
        "important call with Sarah every day at 10am for 30 minutes"
      );
      expect(result).toMatchObject({
        action: "call",
        contact: "Sarah",
        priority: "high",
        recurring: { type: "daily" },
        duration: { minutes: 30 },
        timeOfDay: { hour: 10 },
      });
    });
  });

  describe("Text Message Parsing", () => {
    test("should parse text message action", () => {
      const result = parser.parse("text John tomorrow morning");
      expect(result).toMatchObject({
        action: "text",
        contact: "John",
        timeOfDay: { period: "morning", start: 9, end: 12 },
      });
      expect(result.datetime).toBeTruthy();
    });

    test("should categorize text messages as calls", () => {
      const result = parser.parse("text Sarah about meeting");
      expect(result.categories).toContain("calls");
    });

    test("should parse complex text message task", () => {
      const result = parser.parse(
        "urgent text John tomorrow morning about the meeting"
      );
      expect(result).toMatchObject({
        action: "text",
        contact: "John",
        priority: "high",
        timeOfDay: { period: "morning", start: 9, end: 12 },
      });
      expect(result.datetime).toBeTruthy();
    });
  });

  describe("Enhanced Parsing Features", () => {
    describe("Subject Parsing", () => {
      test("should parse explicit subject", () => {
        const result = parser.parse("meeting with John about Q4 Planning");
        expect(result.subject).toEqual({
          subject: "Q4 Planning",
          type: "afterContact",
        });
      });

      test("should parse hashtags", () => {
        const result = parser.parse("meeting tomorrow #project #planning");
        expect(result.subject).toEqual({
          tags: ["project", "planning"],
          type: "hashtag",
        });
      });
    });

    describe("Reminder Parsing", () => {
      test("should parse custom reminder", () => {
        const result = parser.parse(
          "meeting tomorrow remind me 30 minutes before"
        );
        expect(result.reminders).toEqual({
          reminderMinutes: 30,
          type: "custom",
        });
      });

      test("should use default reminder for meetings", () => {
        const result = parser.parse("meeting tomorrow with reminder");
        expect(result.reminders).toEqual({
          reminderMinutes: 15,
          type: "default",
        });
      });
    });

    describe("Status Parsing", () => {
      test("should parse progress percentage", () => {
        const result = parser.parse("project 75% complete");
        expect(result.status).toEqual({
          progress: 75,
        });
      });
    });

    describe("Attendee Parsing", () => {
      test("should parse multiple attendees", () => {
        const result = parser.parse(
          "meeting with John, Sarah and Mike tomorrow"
        );
        expect(result.attendees).toEqual({
          people: ["John", "Sarah", "Mike"],
          teams: [],
        });
      });

      test("should parse team mentions", () => {
        const result = parser.parse("meeting with team Engineering tomorrow");
        expect(result.attendees).toEqual({
          people: [],
          teams: ["Engineering"],
        });
      });
    });

    describe("Project Parsing", () => {
      test("should parse project name", () => {
        const result = parser.parse("meeting for Project Alpha tomorrow");
        expect(result.project).toEqual({
          project: "Project Alpha",
        });
      });

      test("should parse contexts", () => {
        const result = parser.parse("review code $frontend $mobile");
        expect(result.project).toEqual({
          contexts: ["frontend", "mobile"],
        });
      });
    });

    describe("Reminder Variations", () => {
      test("should parse reminder with hours", () => {
        const result = parser.parse(
          "meeting tomorrow remind me 2 hours before"
        );
        expect(result.reminders).toEqual({
          reminderMinutes: 120,
          type: "custom",
        });
      });

      test("should parse reminder with days", () => {
        const result = parser.parse("meeting next week remind me 1 day before");
        expect(result.reminders).toEqual({
          reminderMinutes: 1440,
          type: "custom",
        });
      });

      test("should combine multiple reminders", () => {
        const result = parser.parse(
          "important meeting tomorrow alert me 1 hour before and 10 minutes before"
        );
        expect(result.reminders).toEqual({
          reminderMinutes: [60, 10],
          type: "custom",
        });
      });
    });

    describe("Project and Context", () => {
      test("should parse multiple contexts", () => {
        const result = parser.parse(
          "update documentation $frontend $mobile $docs"
        );
        expect(result.project).toEqual({
          contexts: ["frontend", "mobile", "docs"],
        });
      });
    });

    describe("Location Variations", () => {
      test("should parse complex location", () => {
        const result = parser.parse("meeting in New York Office Room 123");
        expect(result.location).toEqual({
          type: "travel",
          value: "New York Office Room 123",
        });
      });

      test("should parse online platform with link", () => {
        const result = parser.parse("zoom meeting at https://zoom.us/j/123456");
        expect(result.location).toEqual({
          type: "online",
          value: "zoom",
          link: "https://zoom.us/j/123456",
        });
      });
    });
  });

  describe("Enhanced Task Features", () => {
    describe("Urgency Parsing", () => {
      test("should parse immediate urgency", () => {
        const result = parser.parse("need this done asap");
        expect(result.urgency).toEqual({
          level: "immediate",
        });
      });

      test("should parse today urgency", () => {
        const result = parser.parse("finish this by end of day");
        expect(result.urgency).toEqual({
          level: "today",
        });
      });

      test("should parse soon urgency", () => {
        const result = parser.parse("need this done soon");
        expect(result.urgency).toEqual({
          level: "soon",
        });
      });
    });

    describe("Complexity Parsing", () => {
      test("should parse high complexity", () => {
        const result = parser.parse("complex task needs review");
        expect(result.complexity).toEqual({
          level: "high",
        });
      });

      test("should parse medium complexity", () => {
        const result = parser.parse("standard review needed");
        expect(result.complexity).toEqual({
          level: "medium",
        });
      });

      test("should parse low complexity", () => {
        const result = parser.parse("quick review needed");
        expect(result.complexity).toEqual({
          level: "low",
        });
      });
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty input", () => {
      const result = parser.parse("");
      expect(result).toMatchObject({
        plugins: {},
        links: [],
      });
    });

    test("should handle null input", () => {
      const result = parser.parse(null);
      expect(result).toMatchObject({
        plugins: {},
        links: [],
      });
    });

    test("should handle undefined input", () => {
      const result = parser.parse(undefined);
      expect(result).toMatchObject({
        plugins: {},
        links: [],
      });
    });
  });

  describe("Links Parsing", () => {
    test("should parse single link", () => {
      const result = parser.parse("meeting at https://zoom.us/j/123456");
      expect(result.links).toEqual(["https://zoom.us/j/123456"]);
    });

    test("should parse multiple links", () => {
      const result = parser.parse(
        "check docs at https://docs.com and https://wiki.com"
      );
      expect(result.links).toEqual(["https://docs.com", "https://wiki.com"]);
    });

    test("should handle no links", () => {
      const result = parser.parse("meeting tomorrow");
      expect(result.links).toEqual([]);
    });
  });

  describe("Integration Tests", () => {
    test("should combine multiple features", () => {
      const result = parser.parse(
        "urgent zoom meeting with John and Sarah tomorrow morning at https://zoom.us/j/123456 #project remind me 30 minutes before"
      );
      expect(result).toMatchObject({
        action: "meet",
        priority: "high",
        location: { type: "online", value: "zoom" },
        attendees: {
          people: ["John", "Sarah"],
          teams: [],
        },
        timeOfDay: { period: "morning", start: 9, end: 12 },
        links: ["https://zoom.us/j/123456"],
        subject: {
          tags: ["project"],
          type: "hashtag",
        },
        reminders: {
          reminderMinutes: 30,
          type: "custom",
        },
      });
    });
  });
});
