import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProposal,
  vote,
  getResults,
  closeProposal,
  getAllProposals,
  type Proposal,
  type Results,
} from '../src/index';

describe('Governance Package', () => {
  beforeEach(() => {
    // Clean up before each test
    // In a real implementation, you'd reset the governance state
  });

  describe('createProposal', () => {
    it('should create a new proposal', () => {
      const proposal = createProposal(
        'prop-001',
        'Increase Trading Capital',
        'Proposal to increase neural trader capital allocation'
      );

      expect(proposal).toBeDefined();
      expect(proposal.id).toBe('prop-001');
      expect(proposal.title).toBe('Increase Trading Capital');
      expect(proposal.description).toBe(
        'Proposal to increase neural trader capital allocation'
      );
      expect(proposal.status).toBe('active');
      expect(proposal.votes_for).toBe(0);
      expect(proposal.votes_against).toBe(0);
      expect(proposal.votes_abstain).toBe(0);
    });

    it('should set correct created_at timestamp', () => {
      const beforeTime = Math.floor(Date.now() / 1000);
      const proposal = createProposal(
        'prop-002',
        'Test Proposal',
        'Test Description'
      );
      const afterTime = Math.floor(Date.now() / 1000);

      expect(proposal.created_at).toBeGreaterThanOrEqual(beforeTime);
      expect(proposal.created_at).toBeLessThanOrEqual(afterTime + 1);
    });
  });

  describe('vote', () => {
    it('should record a vote for a proposal', () => {
      createProposal(
        'prop-003',
        'Test Vote Proposal',
        'Testing vote functionality'
      );

      const result = vote('prop-003', 'voter-001', 'for');
      expect(result).toBe(true);
    });

    it('should record votes against a proposal', () => {
      createProposal(
        'prop-004',
        'Test Against Vote',
        'Testing against vote'
      );

      const result = vote('prop-004', 'voter-002', 'against');
      expect(result).toBe(true);
    });

    it('should record abstain votes', () => {
      createProposal('prop-005', 'Test Abstain Vote', 'Testing abstain vote');

      const result = vote('prop-005', 'voter-003', 'abstain');
      expect(result).toBe(true);
    });

    it('should reject invalid vote types', () => {
      createProposal('prop-006', 'Invalid Vote Test', 'Testing invalid vote');

      expect(() => {
        vote('prop-006', 'voter-004', 'invalid' as any);
      }).toThrow();
    });

    it('should reject votes on non-existent proposals', () => {
      expect(() => {
        vote('non-existent-prop', 'voter-005', 'for');
      }).toThrow();
    });
  });

  describe('getResults', () => {
    it('should return voting results for a proposal', () => {
      createProposal(
        'prop-007',
        'Results Test Proposal',
        'Testing results retrieval'
      );

      vote('prop-007', 'voter-006', 'for');
      vote('prop-007', 'voter-007', 'for');
      vote('prop-007', 'voter-008', 'against');

      const results = getResults('prop-007');

      expect(results).toBeDefined();
      expect(results.proposal_id).toBe('prop-007');
      expect(results.title).toBe('Results Test Proposal');
      expect(results.votes_for).toBe(2);
      expect(results.votes_against).toBe(1);
      expect(results.votes_abstain).toBe(0);
      expect(results.total_votes).toBe(3);
    });

    it('should calculate total votes correctly', () => {
      createProposal('prop-008', 'Total Votes Test', 'Testing total votes');

      vote('prop-008', 'voter-009', 'for');
      vote('prop-008', 'voter-010', 'against');
      vote('prop-008', 'voter-011', 'abstain');
      vote('prop-008', 'voter-012', 'abstain');

      const results = getResults('prop-008');

      expect(results.votes_for).toBe(1);
      expect(results.votes_against).toBe(1);
      expect(results.votes_abstain).toBe(2);
      expect(results.total_votes).toBe(4);
    });

    it('should throw error for non-existent proposal', () => {
      expect(() => {
        getResults('non-existent-prop-results');
      }).toThrow();
    });
  });

  describe('closeProposal', () => {
    it('should close an active proposal', () => {
      createProposal('prop-009', 'Close Proposal Test', 'Testing proposal close');

      const result = closeProposal('prop-009');
      expect(result).toBe(true);
    });

    it('should update proposal status to closed', () => {
      createProposal('prop-010', 'Status Update Test', 'Testing status update');
      closeProposal('prop-010');

      const results = getResults('prop-010');
      expect(results.status).toBe('closed');
    });

    it('should throw error for non-existent proposal', () => {
      expect(() => {
        closeProposal('non-existent-close-prop');
      }).toThrow();
    });

    it('should allow voting before closure', () => {
      createProposal('prop-011', 'Vote Before Close', 'Testing vote before close');
      vote('prop-011', 'voter-013', 'for');
      closeProposal('prop-011');

      const results = getResults('prop-011');
      expect(results.votes_for).toBe(1);
    });
  });

  describe('getAllProposals', () => {
    it('should return all created proposals', () => {
      createProposal('prop-012', 'Proposal 1', 'Description 1');
      createProposal('prop-013', 'Proposal 2', 'Description 2');
      createProposal('prop-014', 'Proposal 3', 'Description 3');

      const proposals = getAllProposals();

      expect(proposals.length).toBeGreaterThanOrEqual(3);
      const ids = proposals.map((p) => p.id);
      expect(ids).toContain('prop-012');
      expect(ids).toContain('prop-013');
      expect(ids).toContain('prop-014');
    });

    it('should return proposals with correct structure', () => {
      createProposal('prop-015', 'Structure Test', 'Testing structure');

      const proposals = getAllProposals();
      const proposal = proposals.find((p) => p.id === 'prop-015');

      expect(proposal).toBeDefined();
      expect(proposal).toHaveProperty('id');
      expect(proposal).toHaveProperty('title');
      expect(proposal).toHaveProperty('description');
      expect(proposal).toHaveProperty('status');
      expect(proposal).toHaveProperty('created_at');
      expect(proposal).toHaveProperty('votes_for');
      expect(proposal).toHaveProperty('votes_against');
      expect(proposal).toHaveProperty('votes_abstain');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete proposal lifecycle', () => {
      // Create proposal
      const proposal = createProposal(
        'prop-integration-001',
        'Complete Lifecycle Test',
        'Testing complete governance lifecycle'
      );
      expect(proposal.status).toBe('active');

      // Add votes
      vote('prop-integration-001', 'voter-014', 'for');
      vote('prop-integration-001', 'voter-015', 'for');
      vote('prop-integration-001', 'voter-016', 'against');

      // Check results
      let results = getResults('prop-integration-001');
      expect(results.votes_for).toBe(2);
      expect(results.votes_against).toBe(1);

      // Close proposal
      closeProposal('prop-integration-001');

      // Verify closed status
      results = getResults('prop-integration-001');
      expect(results.status).toBe('closed');
    });

    it('should handle multiple concurrent proposals', () => {
      const proposalIds = [];
      for (let i = 0; i < 5; i++) {
        const proposal = createProposal(
          `prop-concurrent-${i}`,
          `Concurrent Proposal ${i}`,
          `Description for concurrent proposal ${i}`
        );
        proposalIds.push(proposal.id);
      }

      // Add votes to multiple proposals
      for (let i = 0; i < 5; i++) {
        vote(`prop-concurrent-${i}`, `voter-${i}`, 'for');
      }

      // Verify all proposals have votes
      for (let i = 0; i < 5; i++) {
        const results = getResults(`prop-concurrent-${i}`);
        expect(results.votes_for).toBe(1);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle proposal with no votes', () => {
      createProposal('prop-no-votes', 'No Votes Proposal', 'Testing no votes');

      const results = getResults('prop-no-votes');
      expect(results.votes_for).toBe(0);
      expect(results.votes_against).toBe(0);
      expect(results.votes_abstain).toBe(0);
      expect(results.total_votes).toBe(0);
    });

    it('should handle special characters in proposal title and description', () => {
      const specialTitle = "Test & Proposal's with \"quotes\"";
      const specialDesc =
        'Description with <html> and other &special; characters';

      const proposal = createProposal(
        'prop-special',
        specialTitle,
        specialDesc
      );
      expect(proposal.title).toBe(specialTitle);
      expect(proposal.description).toBe(specialDesc);
    });

    it('should handle numeric strings in proposal IDs', () => {
      const proposal = createProposal('12345', 'Numeric ID Test', 'Testing');
      expect(proposal.id).toBe('12345');
    });
  });
});
