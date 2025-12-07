/**
 * Mock Stripe client for unit tests
 */

export const createMockStripeClient = () => {
  return {
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/test",
          status: "complete",
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: "cs_test_123",
          status: "complete",
          customer: "cus_test_123",
          metadata: {},
        }),
      },
    },
    customers: {
      create: jest.fn().mockResolvedValue({
        id: "cus_test_123",
        email: "test@example.com",
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: "cus_test_123",
        email: "test@example.com",
      }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({
        id: "sub_test_123",
        status: "active",
        customer: "cus_test_123",
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: "sub_test_123",
        status: "active",
        customer: "cus_test_123",
      }),
      update: jest.fn().mockResolvedValue({
        id: "sub_test_123",
        status: "active",
      }),
      cancel: jest.fn().mockResolvedValue({
        id: "sub_test_123",
        status: "canceled",
      }),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            status: "complete",
          },
        },
      }),
    },
  };
};

export type MockStripeClient = ReturnType<typeof createMockStripeClient>;

