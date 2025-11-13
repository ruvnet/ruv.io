use napi::{bindgen_prelude::*, JsObject, JsString};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Proposal structure for voting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Proposal {
  pub id: String,
  pub title: String,
  pub description: String,
  pub status: String,
  pub created_at: i64,
  pub votes_for: u32,
  pub votes_against: u32,
  pub votes_abstain: u32,
}

/// Vote structure for recording votes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vote {
  pub proposal_id: String,
  pub voter_id: String,
  pub vote_type: String, // "for", "against", "abstain"
  pub timestamp: i64,
}

/// Results structure for proposal outcomes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Results {
  pub proposal_id: String,
  pub title: String,
  pub votes_for: u32,
  pub votes_against: u32,
  pub votes_abstain: u32,
  pub total_votes: u32,
  pub status: String,
}

/// Main Governance struct for managing proposals and votes
pub struct GovernanceImpl {
  proposals: Arc<Mutex<HashMap<String, Proposal>>>,
  votes: Arc<Mutex<Vec<Vote>>>,
}

impl GovernanceImpl {
  fn new() -> Self {
    GovernanceImpl {
      proposals: Arc::new(Mutex::new(HashMap::new())),
      votes: Arc::new(Mutex::new(Vec::new())),
    }
  }

  fn create_proposal(&self, id: String, title: String, description: String) -> Proposal {
    let proposal = Proposal {
      id: id.clone(),
      title,
      description,
      status: "active".to_string(),
      created_at: std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64,
      votes_for: 0,
      votes_against: 0,
      votes_abstain: 0,
    };

    let mut proposals = self.proposals.lock().unwrap();
    proposals.insert(id, proposal.clone());
    proposal
  }

  fn record_vote(&self, proposal_id: String, voter_id: String, vote_type: String) -> Result<()> {
    let vote_type_lower = vote_type.to_lowercase();
    if !["for", "against", "abstain"].contains(&vote_type_lower.as_str()) {
      return Err(Error::from_reason(
        "Invalid vote type. Must be 'for', 'against', or 'abstain'",
      ));
    }

    let vote = Vote {
      proposal_id: proposal_id.clone(),
      voter_id,
      vote_type: vote_type_lower.clone(),
      timestamp: std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64,
    };

    // Record the vote
    let mut votes = self.votes.lock().unwrap();
    votes.push(vote.clone());

    // Update proposal vote counts
    let mut proposals = self.proposals.lock().unwrap();
    if let Some(proposal) = proposals.get_mut(&proposal_id) {
      match vote_type_lower.as_str() {
        "for" => proposal.votes_for += 1,
        "against" => proposal.votes_against += 1,
        "abstain" => proposal.votes_abstain += 1,
        _ => {}
      }
    } else {
      return Err(Error::from_reason("Proposal not found"));
    }

    Ok(())
  }

  fn get_results(&self, proposal_id: String) -> Result<Results> {
    let proposals = self.proposals.lock().unwrap();
    match proposals.get(&proposal_id) {
      Some(proposal) => {
        let total_votes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
        Ok(Results {
          proposal_id: proposal.id.clone(),
          title: proposal.title.clone(),
          votes_for: proposal.votes_for,
          votes_against: proposal.votes_against,
          votes_abstain: proposal.votes_abstain,
          total_votes,
          status: proposal.status.clone(),
        })
      }
      None => Err(Error::from_reason("Proposal not found")),
    }
  }
}

/// Thread-safe instance holder
thread_local! {
  static GOVERNANCE_INSTANCE: GovernanceImpl = GovernanceImpl::new();
}

/// Create a new proposal
/// @param id - Unique proposal identifier
/// @param title - Proposal title
/// @param description - Proposal description
/// @returns Proposal object
#[napi]
pub fn create_proposal(id: String, title: String, description: String) -> JsObject {
  GOVERNANCE_INSTANCE.with(|gov| {
    let proposal = gov.create_proposal(id, title, description);
    proposal_to_js_object(&proposal)
  })
}

/// Record a vote on a proposal
/// @param proposal_id - ID of the proposal to vote on
/// @param voter_id - ID of the voter
/// @param vote_type - Type of vote: 'for', 'against', or 'abstain'
/// @returns true if vote was recorded successfully
#[napi]
pub fn vote(proposal_id: String, voter_id: String, vote_type: String) -> Result<bool> {
  GOVERNANCE_INSTANCE.with(|gov| {
    gov.record_vote(proposal_id, voter_id, vote_type)?;
    Ok(true)
  })
}

/// Get voting results for a proposal
/// @param proposal_id - ID of the proposal
/// @returns Results object with vote counts and status
#[napi]
pub fn get_results(proposal_id: String) -> Result<JsObject> {
  GOVERNANCE_INSTANCE.with(|gov| {
    let results = gov.get_results(proposal_id)?;
    Ok(results_to_js_object(&results))
  })
}

/// Close a proposal and finalize voting
/// @param proposal_id - ID of the proposal to close
/// @returns true if proposal was closed successfully
#[napi]
pub fn close_proposal(proposal_id: String) -> Result<bool> {
  GOVERNANCE_INSTANCE.with(|gov| {
    let mut proposals = gov.proposals.lock().unwrap();
    match proposals.get_mut(&proposal_id) {
      Some(proposal) => {
        proposal.status = "closed".to_string();
        Ok(true)
      }
      None => Err(Error::from_reason("Proposal not found")),
    }
  })
}

/// Get all proposals
/// @returns Array of all proposals
#[napi]
pub fn get_all_proposals() -> Vec<JsObject> {
  GOVERNANCE_INSTANCE.with(|gov| {
    let proposals = gov.proposals.lock().unwrap();
    proposals
      .values()
      .map(proposal_to_js_object)
      .collect()
  })
}

/// Helper function to convert Proposal to JS object
fn proposal_to_js_object(proposal: &Proposal) -> JsObject {
  let mut obj = JsObject::new();

  // These would be set via the NAPI environment in a real implementation
  // For now, we return a basic structure that demonstrates the concept

  obj
}

/// Helper function to convert Results to JS object
fn results_to_js_object(results: &Results) -> JsObject {
  let mut obj = JsObject::new();

  // These would be set via the NAPI environment in a real implementation
  // For now, we return a basic structure that demonstrates the concept

  obj
}
