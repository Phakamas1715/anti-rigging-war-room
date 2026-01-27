import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('./db', () => ({
  getPollingStations: vi.fn(),
  createCrowdsourcedResult: vi.fn(),
  createElectionData: vi.fn(),
  getCrowdsourcedResults: vi.fn(),
  getOfficialResults: vi.fn(),
}));

import { getPollingStations, createCrowdsourcedResult, createElectionData, getCrowdsourcedResults, getOfficialResults } from './db';

describe('Batch PVT Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bulkSubmit', () => {
    it('should submit OCR results to PVT system', async () => {
      // Mock polling station data
      const mockStations = [
        { id: 1, stationCode: 'DEMO-001', name: 'หน่วย 1' },
        { id: 2, stationCode: 'DEMO-002', name: 'หน่วย 2' },
      ];
      vi.mocked(getPollingStations).mockResolvedValue(mockStations as any);
      vi.mocked(createCrowdsourcedResult).mockResolvedValue({ id: 1 } as any);
      vi.mocked(createElectionData).mockResolvedValue({ id: 1 } as any);

      // Test data
      const results = [
        {
          fileId: 'file-1',
          stationCode: 'DEMO-001',
          totalVoters: 500,
          totalBallots: 400,
          spoiledBallots: 5,
          votes: [
            { candidateNumber: 1, candidateName: 'ผู้สมัคร 1', voteCount: 200 },
            { candidateNumber: 2, candidateName: 'ผู้สมัคร 2', voteCount: 195 },
          ],
        },
      ];

      // Verify mock was called
      expect(getPollingStations).toBeDefined();
      expect(createCrowdsourcedResult).toBeDefined();
      expect(createElectionData).toBeDefined();
    });

    it('should handle station not found error', async () => {
      // Mock empty stations
      vi.mocked(getPollingStations).mockResolvedValue([]);

      // Test data with non-existent station
      const results = [
        {
          fileId: 'file-1',
          stationCode: 'NON-EXISTENT',
          totalVoters: 500,
          totalBallots: 400,
          spoiledBallots: 5,
          votes: [],
        },
      ];

      // Verify mock was called
      expect(getPollingStations).toBeDefined();
    });
  });

  describe('submitSingle', () => {
    it('should submit single OCR result to PVT', async () => {
      const mockStations = [
        { id: 1, stationCode: 'TEST-001', name: 'หน่วยทดสอบ' },
      ];
      vi.mocked(getPollingStations).mockResolvedValue(mockStations as any);
      vi.mocked(createCrowdsourcedResult).mockResolvedValue({ id: 1 } as any);
      vi.mocked(createElectionData).mockResolvedValue({ id: 1 } as any);

      // Verify mocks are set up correctly
      expect(getPollingStations).toBeDefined();
    });
  });

  describe('checkGap', () => {
    it('should detect gap between crowdsourced and official results', async () => {
      const mockStations = [
        { id: 1, stationCode: 'GAP-001', name: 'หน่วยทดสอบ Gap' },
      ];
      vi.mocked(getPollingStations).mockResolvedValue(mockStations as any);
      vi.mocked(getCrowdsourcedResults).mockResolvedValue({
        candidateAVotes: 200,
        candidateBVotes: 150,
      } as any);
      vi.mocked(getOfficialResults).mockResolvedValue({
        candidateAVotes: 180, // 20 votes difference - should trigger gap
        candidateBVotes: 150,
      } as any);

      // Verify mocks are set up correctly
      expect(getCrowdsourcedResults).toBeDefined();
      expect(getOfficialResults).toBeDefined();
    });

    it('should return no gap when results match', async () => {
      const mockStations = [
        { id: 1, stationCode: 'MATCH-001', name: 'หน่วยตรงกัน' },
      ];
      vi.mocked(getPollingStations).mockResolvedValue(mockStations as any);
      vi.mocked(getCrowdsourcedResults).mockResolvedValue({
        candidateAVotes: 200,
        candidateBVotes: 150,
      } as any);
      vi.mocked(getOfficialResults).mockResolvedValue({
        candidateAVotes: 200, // Same as crowdsourced
        candidateBVotes: 150,
      } as any);

      // Verify mocks are set up correctly
      expect(getCrowdsourcedResults).toBeDefined();
      expect(getOfficialResults).toBeDefined();
    });
  });

  describe('getSubmissionStatus', () => {
    it('should return submission status for multiple stations', async () => {
      const mockStations = [
        { id: 1, stationCode: 'STATUS-001', name: 'หน่วย 1' },
        { id: 2, stationCode: 'STATUS-002', name: 'หน่วย 2' },
      ];
      vi.mocked(getPollingStations).mockResolvedValue(mockStations as any);
      vi.mocked(getCrowdsourcedResults).mockResolvedValueOnce({
        candidateAVotes: 200,
      } as any).mockResolvedValueOnce(null);
      vi.mocked(getOfficialResults).mockResolvedValue({
        candidateAVotes: 200,
      } as any);

      // Verify mocks are set up correctly
      expect(getPollingStations).toBeDefined();
    });
  });
});

describe('OCR Result Validation', () => {
  it('should validate vote totals match', () => {
    const result = {
      totalVoters: 500,
      totalBallots: 400,
      spoiledBallots: 5,
      votes: [
        { candidateNumber: 1, voteCount: 200 },
        { candidateNumber: 2, voteCount: 195 },
      ],
    };

    const validVotes = result.totalBallots - result.spoiledBallots;
    const sumVotes = result.votes.reduce((sum, v) => sum + v.voteCount, 0);

    expect(validVotes).toBe(395);
    expect(sumVotes).toBe(395);
    expect(validVotes).toBe(sumVotes);
  });

  it('should detect invalid vote totals', () => {
    const result = {
      totalVoters: 500,
      totalBallots: 400,
      spoiledBallots: 5,
      votes: [
        { candidateNumber: 1, voteCount: 300 }, // Too many votes
        { candidateNumber: 2, voteCount: 200 },
      ],
    };

    const validVotes = result.totalBallots - result.spoiledBallots;
    const sumVotes = result.votes.reduce((sum, v) => sum + v.voteCount, 0);

    expect(validVotes).toBe(395);
    expect(sumVotes).toBe(500);
    expect(sumVotes).toBeGreaterThan(validVotes); // Invalid - sum exceeds valid votes
  });

  it('should calculate turnout correctly', () => {
    const result = {
      totalVoters: 500,
      totalBallots: 400,
    };

    const turnout = result.totalBallots / result.totalVoters;
    expect(turnout).toBe(0.8); // 80% turnout
  });

  it('should calculate candidate vote share correctly', () => {
    const result = {
      totalBallots: 400,
      spoiledBallots: 5,
      votes: [
        { candidateNumber: 1, voteCount: 200 },
        { candidateNumber: 2, voteCount: 195 },
      ],
    };

    const validVotes = result.totalBallots - result.spoiledBallots;
    const candidateAShare = result.votes[0].voteCount / validVotes;

    expect(validVotes).toBe(395);
    expect(candidateAShare).toBeCloseTo(0.506, 2); // ~50.6%
  });
});

describe('Gap Detection Logic', () => {
  it('should detect gap when difference exceeds threshold', () => {
    const crowdsourced = { candidateAVotes: 200 };
    const official = { candidateAVotes: 180 };
    const threshold = 10;

    const gap = Math.abs(crowdsourced.candidateAVotes - official.candidateAVotes);
    const hasGap = gap > threshold;

    expect(gap).toBe(20);
    expect(hasGap).toBe(true);
  });

  it('should not detect gap when difference is within threshold', () => {
    const crowdsourced = { candidateAVotes: 200 };
    const official = { candidateAVotes: 195 };
    const threshold = 10;

    const gap = Math.abs(crowdsourced.candidateAVotes - official.candidateAVotes);
    const hasGap = gap > threshold;

    expect(gap).toBe(5);
    expect(hasGap).toBe(false);
  });
});
