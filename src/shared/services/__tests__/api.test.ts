/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Service Tests
 *
 * Tests for medication, family connections, and user profile API functions.
 */

import {
  getMedications,
  getMedication,
  createMedication,
  updateMedication,
  deleteMedication,
  getMedicationLogs,
  getTodayLogs,
  logMedicationTaken,
  logMedicationMissed,
  getFamilyConnections,
  generateInvitationCode,
  connectWithCode,
  removeFamilyConnection,
  getConnectedChildren,
  getConnectedParent,
  getUserProfile,
  updateUserProfile,
  getParentMedications,
  calculateAdherenceRate,
  getWeeklyAdherenceData,
  savePushToken,
  createMissedMedicationEvent,
} from '../api';
import { supabase } from '../supabase';
import {
  createMockMedication,
  createMockMedicationLog,
  createMockUser,
  createMockFamilyConnection,
} from '../../../test/test-utils';

// Mock the supabase client
jest.mock('../supabase', () => {
  const mockQueryBuilder = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  });

  return {
    supabase: {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(mockQueryBuilder),
      functions: {
        invoke: jest.fn(),
      },
      rpc: jest.fn(),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      })),
      removeChannel: jest.fn(),
    },
  };
});

// Mock notifications service
jest.mock('../../../features/notifications/services/notifications', () => ({
  scheduleMedicationNotifications: jest.fn().mockResolvedValue(['notif-1', 'notif-2']),
  cancelMedicationNotifications: jest.fn().mockResolvedValue(undefined),
  rescheduleMedicationNotifications: jest.fn().mockResolvedValue(['new-notif-1', 'new-notif-2']),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Medications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedications', () => {
    it('should return active medications for current user', async () => {
      const mockMedications = [
        createMockMedication({ id: 'med-1' }),
        createMockMedication({ id: 'med-2' }),
      ];

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockMedications, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getMedications();

      expect(result).toEqual(mockMedications);
      expect(mockSupabase.from).toHaveBeenCalledWith('medications');
      expect(mockBuilder.eq).toHaveBeenCalledWith('active', true);
    });

    it('should return empty array when no medications', async () => {
      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getMedications();

      expect(result).toEqual([]);
    });

    it('should throw error on database error', async () => {
      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      await expect(getMedications()).rejects.toThrow('Database error');
    });
  });

  describe('getMedication', () => {
    it('should return single medication by ID', async () => {
      const mockMedication = createMockMedication({ id: 'med-123' });

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockMedication, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getMedication('med-123');

      expect(result).toEqual(mockMedication);
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'med-123');
    });

    it('should throw error when medication not found', async () => {
      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Row not found' },
        }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      await expect(getMedication('non-existent')).rejects.toBeDefined();
    });
  });

  describe('createMedication', () => {
    it('should create new medication', async () => {
      const newMedication = {
        user_id: 'user-123',
        name: 'Test Med',
        dosage: '100mg',
        frequency: 'daily',
        reminder_times: ['09:00'],
        start_date: '2024-01-01',
        active: true,
      };
      const createdMedication = createMockMedication(newMedication);

      const mockBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: createdMedication, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await createMedication(newMedication);

      expect(result).toEqual(createdMedication);
      expect(mockBuilder.insert).toHaveBeenCalledWith([newMedication]);
    });
  });

  describe('updateMedication', () => {
    it('should update existing medication', async () => {
      const updates = { name: 'Updated Name', dosage: '200mg' };
      const updatedMedication = createMockMedication(updates);

      const mockBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedMedication, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await updateMedication('med-123', updates);

      expect(result).toEqual(updatedMedication);
      expect(mockBuilder.update).toHaveBeenCalledWith(updates);
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'med-123');
    });
  });

  describe('deleteMedication', () => {
    it('should soft delete medication by setting active to false', async () => {
      const mockBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      await deleteMedication('med-123');

      expect(mockBuilder.update).toHaveBeenCalledWith({ active: false });
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'med-123');
    });
  });
});

describe('Medication Logs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMedicationLogs', () => {
    it('should return logs with optional filters', async () => {
      const mockLogs = [createMockMedicationLog(), createMockMedicationLog()];

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockLogs, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getMedicationLogs(
        'med-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual(mockLogs);
      expect(mockBuilder.eq).toHaveBeenCalledWith('medication_id', 'med-123');
    });

    it('should return all logs when no medication ID specified', async () => {
      const mockLogs = [createMockMedicationLog()];

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockLogs, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      await getMedicationLogs(null);

      // eq should not be called for medication_id when null
      expect(mockBuilder.select).toHaveBeenCalled();
    });
  });

  describe('logMedicationTaken', () => {
    it('should create log with taken status', async () => {
      const mockLog = createMockMedicationLog({ taken: true });
      const scheduledAt = new Date('2024-01-15T09:00:00Z');
      const takenAt = new Date('2024-01-15T09:05:00Z');

      const mockBuilder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLog, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await logMedicationTaken('med-123', scheduledAt, takenAt);

      expect(result.taken).toBe(true);
      expect(mockBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          medication_id: 'med-123',
          taken: true,
        }),
        { onConflict: 'medication_id,scheduled_at' }
      );
    });
  });

  describe('logMedicationMissed', () => {
    it('should create log with missed status and optional reason', async () => {
      const mockLog = createMockMedicationLog({ taken: false, skipped_reason: 'Forgot' });
      const scheduledAt = new Date('2024-01-15T09:00:00Z');

      const mockBuilder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLog, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await logMedicationMissed('med-123', scheduledAt, 'Forgot');

      expect(result.taken).toBe(false);
      expect(result.skipped_reason).toBe('Forgot');
      expect(mockBuilder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          medication_id: 'med-123',
          taken: false,
          skipped_reason: 'Forgot',
        }),
        { onConflict: 'medication_id,scheduled_at' }
      );
    });
  });
});

describe('Family Connections API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFamilyConnections', () => {
    it('should return family connections for authenticated user', async () => {
      const mockConnections = [createMockFamilyConnection()];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ data: mockConnections, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getFamilyConnections();

      expect(result).toEqual(mockConnections);
      expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(getFamilyConnections()).rejects.toThrow('Not authenticated');
    });
  });

  describe('generateInvitationCode', () => {
    it('should generate 6-digit invitation code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'parent-123' } },
        error: null,
      } as any);

      // Mock existing invitation check (none found)
      const mockSelectBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Mock unique code check
      const mockUniqueCheckBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Mock insert
      const mockInsertBuilder = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockSelectBuilder as any)
        .mockReturnValueOnce(mockUniqueCheckBuilder as any)
        .mockReturnValueOnce(mockInsertBuilder as any);

      const result = await generateInvitationCode();

      expect(result).toMatch(/^\d{6}$/); // 6-digit code
    });

    it('should return existing valid invitation code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'parent-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { invitation_code: '123456' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await generateInvitationCode();

      expect(result).toBe('123456');
    });
  });

  describe('connectWithCode', () => {
    it('should connect child to parent with valid code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'child-123' } },
        error: null,
      } as any);

      // Mock find invitation
      const mockFindBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'invitation-123',
            parent_id: 'parent-123',
            parent: { id: 'parent-123', name: 'Parent Name' },
          },
          error: null,
        }),
      };

      // Mock existing connection check
      const mockExistingBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Mock update
      const mockUpdateBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockFindBuilder as any)
        .mockReturnValueOnce(mockExistingBuilder as any)
        .mockReturnValueOnce(mockUpdateBuilder as any);

      const result = await connectWithCode('123456');

      expect(result.success).toBe(true);
      expect(result.parentName).toBe('Parent Name');
    });

    it('should return error for invalid code', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'child-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await connectWithCode('000000');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });
  });
});

describe('User Profile API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return current user profile', async () => {
      const mockUser = createMockUser();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getUserProfile();

      expect(result).toEqual(mockUser);
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(getUserProfile()).rejects.toThrow('Not authenticated');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', async () => {
      const updates = { name: 'New Name' };
      const updatedUser = createMockUser(updates);

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedUser, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await updateUserProfile(updates);

      expect(result.name).toBe('New Name');
    });
  });
});

describe('Child App API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConnectedParent', () => {
    it('should return connected parent info', async () => {
      const mockParent = createMockUser({ role: 'parent' });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'child-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { parent: mockParent },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getConnectedParent();

      expect(result).toEqual(mockParent);
    });

    it('should return null when not connected', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'child-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getConnectedParent();

      expect(result).toBeNull();
    });
  });

  describe('getParentMedications', () => {
    it('should return parent medications', async () => {
      const mockMedications = [createMockMedication(), createMockMedication()];

      const mockBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockMedications, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      const result = await getParentMedications('parent-123');

      expect(result).toEqual(mockMedications);
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'parent-123');
    });
  });

  describe('calculateAdherenceRate', () => {
    it('should calculate adherence percentage', async () => {
      // Mock getMedications query for parent
      const mockMedicationsBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 'med-1' }, { id: 'med-2' }],
          error: null,
        }),
      };

      // Mock medication logs with 3 taken, 1 missed
      const mockLogsBuilder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ taken: true }, { taken: true }, { taken: true }, { taken: false }],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockMedicationsBuilder as any)
        .mockReturnValueOnce(mockLogsBuilder as any);

      const result = await calculateAdherenceRate('parent-123', 7);

      expect(result).toBe(75); // 3 out of 4 = 75%
    });

    it('should return 0 when no logs', async () => {
      const mockMedicationsBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ id: 'med-1' }],
          error: null,
        }),
      };

      const mockLogsBuilder = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockMedicationsBuilder as any)
        .mockReturnValueOnce(mockLogsBuilder as any);

      const result = await calculateAdherenceRate('parent-123', 7);

      expect(result).toBe(0);
    });
  });
});

describe('Push Token API', () => {
  describe('savePushToken', () => {
    it('should save push token for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const mockBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      mockSupabase.from.mockReturnValue(mockBuilder as any);

      await savePushToken('ExponentPushToken[xxxxx]');

      expect(mockBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          push_token: 'ExponentPushToken[xxxxx]',
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(savePushToken('token')).rejects.toThrow('Not authenticated');
    });
  });
});
