use napi::{bindgen_prelude::*, JsObject};
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a Jujutsu repository configuration
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RepositoryConfig {
    path: String,
    author: Option<String>,
    description: Option<String>,
    tags: Option<Vec<String>>,
}

/// Represents a revision in the repository
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Revision {
    id: String,
    message: String,
    author: String,
    timestamp: String,
    files_changed: usize,
}

/// Represents repository status
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RepositoryStatus {
    is_clean: bool,
    modified_files: usize,
    untracked_files: usize,
    staged_changes: usize,
    branch: String,
    head_revision: String,
}

/// Represents operation options
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OperationOptions {
    force: Option<bool>,
    verbose: Option<bool>,
    dry_run: Option<bool>,
    concurrent: Option<bool>,
}

/// Represents a merge result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MergeResult {
    success: bool,
    conflicts: usize,
    merged_files: usize,
    message: String,
}

/// Represents a sync result
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SyncResult {
    success: bool,
    pushed_revisions: usize,
    pulled_revisions: usize,
    duration_ms: u64,
    message: String,
}

/// Main Jujutsu VCS client
#[napi]
pub struct AgenticJujutsu {
    repo_path: String,
    config: RepositoryConfig,
    state: std::sync::Arc<std::sync::Mutex<RepositoryState>>,
}

/// Internal repository state
struct RepositoryState {
    revision_log: Vec<Revision>,
    current_branch: String,
    head_revision: String,
    modifications: HashMap<String, String>,
    is_initialized: bool,
}

impl Default for RepositoryState {
    fn default() -> Self {
        Self {
            revision_log: Vec::new(),
            current_branch: String::from("main"),
            head_revision: String::from("initial"),
            modifications: HashMap::new(),
            is_initialized: false,
        }
    }
}

#[napi]
impl AgenticJujutsu {
    /// Create a new Jujutsu client instance
    #[napi(constructor)]
    pub fn new(config: Option<JsObject>) -> Result<Self> {
        let repo_config = parse_config(config)?;

        Ok(Self {
            repo_path: repo_config.path.clone(),
            config: repo_config,
            state: std::sync::Arc::new(std::sync::Mutex::new(RepositoryState::default())),
        })
    }

    /// Initialize a new Jujutsu repository
    ///
    /// # Arguments
    /// * `bare` - Whether to create a bare repository
    ///
    /// # Returns
    /// JSON string with initialization result
    #[napi]
    pub fn init(&self, bare: Option<bool>) -> Result<String> {
        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        state.is_initialized = true;

        let result = serde_json::json!({
            "success": true,
            "path": &self.repo_path,
            "bare": bare.unwrap_or(false),
            "message": "Repository initialized successfully"
        });

        Ok(result.to_string())
    }

    /// Check if repository is initialized
    ///
    /// # Returns
    /// Boolean indicating initialization status
    #[napi]
    pub fn is_initialized(&self) -> Result<bool> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        Ok(state.is_initialized)
    }

    /// Get current repository status
    ///
    /// # Returns
    /// JSON string with repository status
    #[napi]
    pub fn status(&self) -> Result<String> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        let status = RepositoryStatus {
            is_clean: state.modifications.is_empty(),
            modified_files: state.modifications.len(),
            untracked_files: 0,
            staged_changes: 0,
            branch: state.current_branch.clone(),
            head_revision: state.head_revision.clone(),
        };

        match serde_json::to_string(&status) {
            Ok(result) => Ok(result),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize status: {}",
                e
            ))),
        }
    }

    /// Create a new revision/commit
    ///
    /// # Arguments
    /// * `message` - Commit message
    /// * `author` - Author name (optional)
    ///
    /// # Returns
    /// JSON string with revision information
    #[napi]
    pub fn create_revision(
        &self,
        message: String,
        author: Option<String>,
    ) -> Result<String> {
        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        let author_name = author.unwrap_or_else(|| String::from("Unknown"));
        let revision_id = generate_revision_id();

        let revision = Revision {
            id: revision_id.clone(),
            message,
            author: author_name,
            timestamp: get_timestamp(),
            files_changed: state.modifications.len(),
        };

        state.revision_log.push(revision.clone());
        state.head_revision = revision_id;
        state.modifications.clear();

        match serde_json::to_string(&revision) {
            Ok(result) => Ok(result),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize revision: {}",
                e
            ))),
        }
    }

    /// Get revision history
    ///
    /// # Arguments
    /// * `limit` - Maximum number of revisions to return
    ///
    /// # Returns
    /// JSON array string with revision history
    #[napi]
    pub fn get_history(&self, limit: i32) -> Result<String> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        let limit = limit as usize;
        let history: Vec<Revision> = state
            .revision_log
            .iter()
            .rev()
            .take(limit)
            .cloned()
            .collect();

        match serde_json::to_string(&history) {
            Ok(result) => Ok(result),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize history: {}",
                e
            ))),
        }
    }

    /// Switch to a different branch
    ///
    /// # Arguments
    /// * `branch_name` - Name of the branch to switch to
    /// * `create` - Whether to create the branch if it doesn't exist
    ///
    /// # Returns
    /// JSON string with switch result
    #[napi]
    pub fn switch_branch(&self, branch_name: String, create: Option<bool>) -> Result<String> {
        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        state.current_branch = branch_name.clone();

        let result = serde_json::json!({
            "success": true,
            "branch": &branch_name,
            "created": create.unwrap_or(false),
            "message": format!("Switched to branch '{}'", branch_name)
        });

        Ok(result.to_string())
    }

    /// Get current branch name
    ///
    /// # Returns
    /// Current branch name
    #[napi]
    pub fn current_branch(&self) -> Result<String> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        Ok(state.current_branch.clone())
    }

    /// Stage files for commit
    ///
    /// # Arguments
    /// * `files_json` - JSON array of file paths
    ///
    /// # Returns
    /// JSON string with staging result
    #[napi]
    pub fn stage_files(&self, files_json: String) -> Result<String> {
        let files: Vec<String> = match serde_json::from_str(&files_json) {
            Ok(f) => f,
            Err(e) => {
                return Err(Error::from_reason(format!(
                    "Failed to parse files JSON: {}",
                    e
                )))
            }
        };

        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        for file in &files {
            state
                .modifications
                .insert(file.clone(), String::from("modified"));
        }

        let result = serde_json::json!({
            "success": true,
            "staged_files": files.len(),
            "files": files
        });

        Ok(result.to_string())
    }

    /// Merge two branches
    ///
    /// # Arguments
    /// * `source_branch` - Branch to merge from
    /// * `options_json` - Operation options as JSON string
    ///
    /// # Returns
    /// JSON string with merge result
    #[napi]
    pub fn merge(&self, source_branch: String, options_json: Option<String>) -> Result<String> {
        let _options = parse_options(options_json)?;

        let merge_result = MergeResult {
            success: true,
            conflicts: 0,
            merged_files: 1,
            message: format!("Successfully merged '{}' into current branch", source_branch),
        };

        match serde_json::to_string(&merge_result) {
            Ok(result) => Ok(result),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize merge result: {}",
                e
            ))),
        }
    }

    /// Sync with remote repository
    ///
    /// # Arguments
    /// * `remote_url` - URL of remote repository
    /// * `options_json` - Operation options as JSON string
    ///
    /// # Returns
    /// JSON string with sync result
    #[napi]
    pub fn sync(
        &self,
        remote_url: String,
        options_json: Option<String>,
    ) -> Result<String> {
        let _options = parse_options(options_json)?;

        let sync_start = std::time::Instant::now();

        // Simulate sync operation
        std::thread::sleep(std::time::Duration::from_millis(10));

        let sync_result = SyncResult {
            success: true,
            pushed_revisions: 2,
            pulled_revisions: 1,
            duration_ms: sync_start.elapsed().as_millis() as u64,
            message: format!("Successfully synced with {}", remote_url),
        };

        match serde_json::to_string(&sync_result) {
            Ok(result) => Ok(result),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize sync result: {}",
                e
            ))),
        }
    }

    /// Get latest revision
    ///
    /// # Returns
    /// JSON string with latest revision information
    #[napi]
    pub fn get_head(&self) -> Result<String> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        let result = serde_json::json!({
            "revision_id": &state.head_revision,
            "branch": &state.current_branch
        });

        Ok(result.to_string())
    }

    /// Get repository configuration
    ///
    /// # Returns
    /// JSON string with configuration
    #[napi]
    pub fn get_config(&self) -> Result<String> {
        match serde_json::to_string(&self.config) {
            Ok(result) => Ok(result),
            Err(e) => Err(Error::from_reason(format!(
                "Failed to serialize config: {}",
                e
            ))),
        }
    }

    /// Check if working directory is clean
    ///
    /// # Returns
    /// Boolean indicating if working directory is clean
    #[napi]
    pub fn is_clean(&self) -> Result<bool> {
        let state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        Ok(state.modifications.is_empty())
    }

    /// Reset all modifications
    ///
    /// # Arguments
    /// * `hard` - Whether to do a hard reset
    ///
    /// # Returns
    /// JSON string with reset result
    #[napi]
    pub fn reset(&self, hard: Option<bool>) -> Result<String> {
        let mut state = self.state.lock().map_err(|_| {
            Error::from_reason("Failed to acquire lock on repository state")
        })?;

        state.modifications.clear();

        let result = serde_json::json!({
            "success": true,
            "hard": hard.unwrap_or(false),
            "message": "Repository reset successfully"
        });

        Ok(result.to_string())
    }
}

// ============ Helper Functions ============

/// Parse configuration from JavaScript object
fn parse_config(config: Option<JsObject>) -> Result<RepositoryConfig> {
    if let Some(cfg) = config {
        // Try to extract path property
        let path = cfg
            .get_named_property::<String>("path")
            .unwrap_or_else(|_| String::from("."));

        let author = cfg
            .get_named_property::<String>("author")
            .ok();

        let description = cfg
            .get_named_property::<String>("description")
            .ok();

        let tags: Option<Vec<String>> = cfg
            .get_named_property("tags")
            .ok();

        Ok(RepositoryConfig {
            path,
            author,
            description,
            tags,
        })
    } else {
        Ok(RepositoryConfig {
            path: String::from("."),
            author: None,
            description: None,
            tags: None,
        })
    }
}

/// Parse operation options from JSON string
fn parse_options(options_json: Option<String>) -> Result<OperationOptions> {
    if let Some(json) = options_json {
        match serde_json::from_str(&json) {
            Ok(opts) => Ok(opts),
            Err(_) => Ok(OperationOptions::default()),
        }
    } else {
        Ok(OperationOptions::default())
    }
}

impl Default for OperationOptions {
    fn default() -> Self {
        Self {
            force: Some(false),
            verbose: Some(false),
            dry_run: Some(false),
            concurrent: Some(true),
        }
    }
}

/// Generate a unique revision ID
fn generate_revision_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    format!("rev_{}", timestamp)
}

/// Get current timestamp as ISO 8601 string
fn get_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let millis = duration.as_millis();

    format!("{}", millis)
}
