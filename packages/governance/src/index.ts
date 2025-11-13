// TypeScript type definitions and exports for governance

/**
 * Proposal interface for voting
 */
export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'cancelled';
  created_at: number;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
}

/**
 * Vote interface for recording votes
 */
export interface Vote {
  proposal_id: string;
  voter_id: string;
  vote_type: 'for' | 'against' | 'abstain';
  timestamp: number;
}

/**
 * Results interface for proposal outcomes
 */
export interface Results {
  proposal_id: string;
  title: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  total_votes: number;
  status: string;
}

// Import and re-export native bindings with types
const nativeBindings = require('../index');

/**
 * Create a new proposal
 * @param id - Unique proposal identifier
 * @param title - Proposal title
 * @param description - Proposal description
 * @returns Proposal object
 */
export const createProposal: (id: string, title: string, description: string) => Proposal = nativeBindings.createProposal;

/**
 * Record a vote on a proposal
 * @param proposal_id - ID of the proposal to vote on
 * @param voter_id - ID of the voter
 * @param vote_type - Type of vote: 'for', 'against', or 'abstain'
 * @returns true if vote was recorded successfully
 * @throws Error if vote type is invalid or proposal doesn't exist
 */
export const vote: (proposal_id: string, voter_id: string, vote_type: 'for' | 'against' | 'abstain') => boolean = nativeBindings.vote;

/**
 * Get voting results for a proposal
 * @param proposal_id - ID of the proposal
 * @returns Results object with vote counts and status
 * @throws Error if proposal not found
 */
export const getResults: (proposal_id: string) => Results = nativeBindings.getResults;

/**
 * Close a proposal and finalize voting
 * @param proposal_id - ID of the proposal to close
 * @returns true if proposal was closed successfully
 * @throws Error if proposal not found
 */
export const closeProposal: (proposal_id: string) => boolean = nativeBindings.closeProposal;

/**
 * Get all proposals
 * @returns Array of all proposals
 */
export const getAllProposals: () => Proposal[] = nativeBindings.getAllProposals;
