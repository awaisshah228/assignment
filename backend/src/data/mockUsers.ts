import { User } from '../types/user';

export const mockUsers: Record<number, User> = {
  1: { id: 1, name: 'John Doe', email: 'john@example.com' },
  2: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  3: { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
};

// Function to simulate database delay
export const simulateDbCall = async <T>(data: T, delay: number = 200): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

