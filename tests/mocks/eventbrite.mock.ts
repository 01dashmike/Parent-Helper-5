/**
 * Mock Eventbrite API responses
 */

export const mockEventbriteEvents = [
  {
    id: "123456789",
    name: { text: "Baby Sensory Class" },
    start: { local: "2024-12-01T10:00:00" },
    end: { local: "2024-12-01T11:00:00" },
    venue: { name: "Community Centre" },
    url: "https://eventbrite.com/e/test",
  },
  {
    id: "987654321",
    name: { text: "Toddler Music Session" },
    start: { local: "2024-12-02T14:00:00" },
    end: { local: "2024-12-02T15:00:00" },
    venue: { name: "Library Hall" },
    url: "https://eventbrite.com/e/test2",
  },
];

export const createMockEventbriteClient = () => {
  return {
    searchEvents: jest.fn().mockResolvedValue({
      events: mockEventbriteEvents,
    }),
    getEvent: jest.fn().mockResolvedValue(mockEventbriteEvents[0]),
  };
};

