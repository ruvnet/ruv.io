/**
 * TypeScript bindings for agentic-jujutsu native module
 * Provides high-level API for Jujutsu VCS operations
 */

// Import the native module
const { AgenticJujutsu: NativeAgenticJujutsu } = require('../index.js')

// Type definitions
export interface RepositoryConfig {
  path: string
  author?: string
  description?: string
  tags?: string[]
}

export interface Revision {
  id: string
  message: string
  author: string
  timestamp: string
  files_changed: number
}

export interface RepositoryStatus {
  is_clean: boolean
  modified_files: number
  untracked_files: number
  staged_changes: number
  branch: string
  head_revision: string
}

export interface OperationOptions {
  force?: boolean
  verbose?: boolean
  dry_run?: boolean
  concurrent?: boolean
}

export interface MergeResult {
  success: boolean
  conflicts: number
  merged_files: number
  message: string
}

export interface SyncResult {
  success: boolean
  pushed_revisions: number
  pulled_revisions: number
  duration_ms: number
  message: string
}

export interface RevisionInfo {
  revision_id: string
  branch: string
}

export class AgenticJujutsuError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'AgenticJujutsuError'
  }
}

/**
 * Main Jujutsu VCS client
 * Provides methods for version control operations
 */
export class AgenticJujutsu {
  private inner: any

  constructor(config?: RepositoryConfig) {
    try {
      this.inner = new NativeAgenticJujutsu(config)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to create Jujutsu client: ${error}`,
        'INITIALIZATION_ERROR'
      )
    }
  }

  /**
   * Initialize a new Jujutsu repository
   * @param bare - Whether to create a bare repository (default: false)
   * @returns Initialization result
   */
  init(bare: boolean = false): Record<string, any> {
    try {
      const result = this.inner.init(bare)
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to initialize repository: ${error}`,
        'INIT_FAILED'
      )
    }
  }

  /**
   * Check if repository is initialized
   * @returns True if repository is initialized
   */
  isInitialized(): boolean {
    try {
      return this.inner.isInitialized()
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to check initialization status: ${error}`,
        'CHECK_FAILED'
      )
    }
  }

  /**
   * Get current repository status
   * @returns Repository status
   */
  status(): RepositoryStatus {
    try {
      const result = this.inner.status()
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to get repository status: ${error}`,
        'STATUS_FAILED'
      )
    }
  }

  /**
   * Create a new revision/commit
   * @param message - Commit message
   * @param author - Author name (optional)
   * @returns Revision information
   */
  createRevision(message: string, author?: string): Revision {
    try {
      const result = this.inner.createRevision(message, author)
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to create revision: ${error}`,
        'REVISION_FAILED'
      )
    }
  }

  /**
   * Get revision history
   * @param limit - Maximum number of revisions to return (default: 10)
   * @returns Array of revisions
   */
  getHistory(limit: number = 10): Revision[] {
    try {
      const result = this.inner.getHistory(limit)
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to get history: ${error}`,
        'HISTORY_FAILED'
      )
    }
  }

  /**
   * Switch to a different branch
   * @param branchName - Name of the branch to switch to
   * @param create - Whether to create the branch if it doesn't exist
   * @returns Switch result
   */
  switchBranch(branchName: string, create: boolean = false): Record<string, any> {
    try {
      const result = this.inner.switchBranch(branchName, create)
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to switch branch: ${error}`,
        'SWITCH_FAILED'
      )
    }
  }

  /**
   * Get current branch name
   * @returns Current branch name
   */
  currentBranch(): string {
    try {
      return this.inner.currentBranch()
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to get current branch: ${error}`,
        'BRANCH_FAILED'
      )
    }
  }

  /**
   * Stage files for commit
   * @param files - Array of file paths to stage
   * @returns Staging result
   */
  stageFiles(files: string[]): Record<string, any> {
    try {
      const result = this.inner.stageFiles(JSON.stringify(files))
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to stage files: ${error}`,
        'STAGE_FAILED'
      )
    }
  }

  /**
   * Merge two branches
   * @param sourceBranch - Branch to merge from
   * @param options - Operation options
   * @returns Merge result
   */
  merge(sourceBranch: string, options?: OperationOptions): MergeResult {
    try {
      const result = this.inner.merge(
        sourceBranch,
        options ? JSON.stringify(options) : undefined
      )
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to merge branches: ${error}`,
        'MERGE_FAILED'
      )
    }
  }

  /**
   * Sync with remote repository
   * @param remoteUrl - URL of remote repository
   * @param options - Operation options
   * @returns Sync result
   */
  sync(remoteUrl: string, options?: OperationOptions): SyncResult {
    try {
      const result = this.inner.sync(
        remoteUrl,
        options ? JSON.stringify(options) : undefined
      )
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to sync repository: ${error}`,
        'SYNC_FAILED'
      )
    }
  }

  /**
   * Get latest revision information
   * @returns Latest revision info
   */
  getHead(): RevisionInfo {
    try {
      const result = this.inner.getHead()
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to get HEAD: ${error}`,
        'HEAD_FAILED'
      )
    }
  }

  /**
   * Get repository configuration
   * @returns Repository configuration
   */
  getConfig(): RepositoryConfig {
    try {
      const result = this.inner.getConfig()
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to get configuration: ${error}`,
        'CONFIG_FAILED'
      )
    }
  }

  /**
   * Check if working directory is clean
   * @returns True if working directory has no modifications
   */
  isClean(): boolean {
    try {
      return this.inner.isClean()
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to check clean status: ${error}`,
        'CLEAN_CHECK_FAILED'
      )
    }
  }

  /**
   * Reset all modifications
   * @param hard - Whether to do a hard reset
   * @returns Reset result
   */
  reset(hard: boolean = false): Record<string, any> {
    try {
      const result = this.inner.reset(hard)
      return JSON.parse(result)
    } catch (error) {
      throw new AgenticJujutsuError(
        `Failed to reset repository: ${error}`,
        'RESET_FAILED'
      )
    }
  }
}

// Export all types
export {
  Revision,
  RepositoryStatus,
  OperationOptions,
  MergeResult,
  SyncResult,
  RevisionInfo,
  RepositoryConfig,
}

// Re-export from native module for direct access if needed
export const JujutsuClient = AgenticJujutsu
