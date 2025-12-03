/**
 * Supabase Auth Service Tests
 *
 * Tests for authentication functions in src/shared/services/supabase.ts
 */

import {
  getCurrentUser,
  signUp,
  signIn,
  signOut,
  resetPasswordForEmail,
  updatePassword,
  findEmailByPhone,
  findEmailByName,
} from '../supabase';

// Mock the supabase module
jest.mock('../supabase', () => {
  const originalModule = jest.requireActual('../supabase');

  // Create a mock supabase instance
  const mockAuth = {
    getUser: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  };

  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }));

  const mockSupabase = {
    auth: mockAuth,
    from: mockFrom,
  };

  return {
    ...originalModule,
    supabase: mockSupabase,
    __mockAuth: mockAuth,
    __mockFrom: mockFrom,
  };
});

// Get mock references
const { __mockAuth: mockAuth, __mockFrom: mockFrom, supabase } = jest.requireMock('../supabase');

describe('Supabase Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockAuth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('signUp', () => {
    it('should create a new user with email and password', async () => {
      const mockData = {
        user: { id: 'new-user-id', email: 'new@example.com' },
        session: null,
      };

      mockAuth.signUp.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await signUp('new@example.com', 'password123');

      expect(result).toEqual(mockData);
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: { data: {} },
      });
    });

    it('should pass metadata to signup', async () => {
      const metadata = { name: 'Test User', role: 'parent' };
      const mockData = {
        user: { id: 'new-user-id' },
        session: null,
      };

      mockAuth.signUp.mockResolvedValue({
        data: mockData,
        error: null,
      });

      await signUp('new@example.com', 'password123', metadata);

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: { data: metadata },
      });
    });

    it('should throw error on signup failure', async () => {
      const mockError = new Error('Email already exists');

      mockAuth.signUp.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(signUp('existing@example.com', 'password123')).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  describe('signIn', () => {
    it('should sign in user with email and password', async () => {
      const mockData = {
        user: { id: 'user-id', email: 'test@example.com' },
        session: { access_token: 'token' },
      };

      mockAuth.signInWithPassword.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await signIn('test@example.com', 'password123');

      expect(result).toEqual(mockData);
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error on invalid credentials', async () => {
      const mockError = new Error('Invalid login credentials');

      mockAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(signIn('wrong@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid login credentials'
      );
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockAuth.signOut.mockResolvedValue({ error: null });

      await expect(signOut()).resolves.toBeUndefined();
      expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should throw error on signout failure', async () => {
      const mockError = new Error('Signout failed');

      mockAuth.signOut.mockResolvedValue({ error: mockError });

      await expect(signOut()).rejects.toThrow('Signout failed');
    });
  });

  describe('resetPasswordForEmail', () => {
    it('should send password reset email', async () => {
      mockAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

      await expect(resetPasswordForEmail('test@example.com')).resolves.toBeUndefined();
      expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
        redirectTo: 'pillcare://reset-password',
      });
    });

    it('should throw error if email not found', async () => {
      const mockError = new Error('User not found');

      mockAuth.resetPasswordForEmail.mockResolvedValue({ error: mockError });

      await expect(resetPasswordForEmail('unknown@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockAuth.updateUser.mockResolvedValue({ error: null });

      await expect(updatePassword('newpassword123')).resolves.toBeUndefined();
      expect(mockAuth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('should throw error on password update failure', async () => {
      const mockError = new Error('Password too weak');

      mockAuth.updateUser.mockResolvedValue({ error: mockError });

      await expect(updatePassword('weak')).rejects.toThrow('Password too weak');
    });
  });

  describe('findEmailByPhone', () => {
    it('should find and mask email by phone number', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { email: 'test@example.com' },
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQueryBuilder);

      const result = await findEmailByPhone('010-1234-5678');

      expect(result.found).toBe(true);
      expect(result.maskedEmail).toBe('t**t@example.com');
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('should return found: false when phone not found', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockFrom.mockReturnValue(mockQueryBuilder);

      const result = await findEmailByPhone('010-0000-0000');

      expect(result.found).toBe(false);
      expect(result.maskedEmail).toBeUndefined();
    });
  });

  describe('findEmailByName', () => {
    it('should find and mask emails by name', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ email: 'john@example.com' }, { email: 'johnny@test.com' }],
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQueryBuilder);

      const result = await findEmailByName('john');

      expect(result.found).toBe(true);
      expect(result.maskedEmails).toHaveLength(2);
    });

    it('should return found: false when name not found', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQueryBuilder);

      const result = await findEmailByName('unknownname');

      expect(result.found).toBe(false);
    });

    it('should escape SQL wildcards in name search', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockFrom.mockReturnValue(mockQueryBuilder);

      await findEmailByName('test%user');

      // The ilike should receive escaped wildcards
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%test\\%user%');
    });
  });
});

describe('Email masking utility', () => {
  // Note: maskEmail is a private function, but we can test its behavior through findEmailByPhone

  it('should mask email with length > 2 correctly', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { email: 'longname@example.com' },
        error: null,
      }),
    };

    mockFrom.mockReturnValue(mockQueryBuilder);

    const result = await findEmailByPhone('010-1234-5678');

    // 'longname' -> 'l******e'
    expect(result.maskedEmail).toMatch(/^l\*+e@example\.com$/);
  });

  it('should handle short email local parts', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { email: 'ab@example.com' },
        error: null,
      }),
    };

    mockFrom.mockReturnValue(mockQueryBuilder);

    const result = await findEmailByPhone('010-1234-5678');

    // 'ab' -> 'a*'
    expect(result.maskedEmail).toBe('a*@example.com');
  });
});
