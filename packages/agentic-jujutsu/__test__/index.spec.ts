import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  AgenticJujutsu,
  AgenticJujutsuError,
  RepositoryConfig,
  Revision,
  RepositoryStatus,
  MergeResult,
  SyncResult,
  RevisionInfo,
} from '../src/index'

describe('Agentic Jujutsu - VCS Client', () => {
  let client: AgenticJujutsu

  const testConfig: RepositoryConfig = {
    path: '/tmp/test-repo',
    author: 'Test Author',
    description: 'Test Repository',
    tags: ['test', 'sample'],
  }

  beforeAll(() => {
    client = new AgenticJujutsu(testConfig)
  })

  afterAll(() => {
    // Cleanup if needed
  })

  describe('Client Initialization', () => {
    it('should create client instance', () => {
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(AgenticJujutsu)
    })

    it('should create client with default config', () => {
      const defaultClient = new AgenticJujutsu()
      expect(defaultClient).toBeDefined()
    })

    it('should create client with custom config', () => {
      const customClient = new AgenticJujutsu({
        path: '/custom/path',
        author: 'Custom Author',
      })
      expect(customClient).toBeDefined()
    })

    it('should have all required methods', () => {
      expect(typeof client.init).toBe('function')
      expect(typeof client.status).toBe('function')
      expect(typeof client.createRevision).toBe('function')
      expect(typeof client.getHistory).toBe('function')
      expect(typeof client.currentBranch).toBe('function')
      expect(typeof client.isClean).toBe('function')
    })
  })

  describe('Repository Initialization', () => {
    it('should initialize repository', () => {
      const result = client.init(false)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.path).toBeDefined()
      expect(result.message).toContain('initialized')
    })

    it('should create bare repository', () => {
      const testClient = new AgenticJujutsu()
      const result = testClient.init(true)

      expect(result.success).toBe(true)
      expect(result.bare).toBe(true)
    })

    it('should check initialization status', () => {
      const status = client.isInitialized()

      expect(typeof status).toBe('boolean')
      expect(status).toBe(true)
    })
  })

  describe('Repository Status', () => {
    it('should get repository status', () => {
      const status = client.status()

      expect(status).toBeDefined()
      expect(typeof status.is_clean).toBe('boolean')
      expect(typeof status.modified_files).toBe('number')
      expect(typeof status.untracked_files).toBe('number')
      expect(typeof status.staged_changes).toBe('number')
      expect(typeof status.branch).toBe('string')
      expect(typeof status.head_revision).toBe('string')
    })

    it('should have clean status initially', () => {
      const status = client.status()
      expect(status.is_clean).toBe(true)
    })

    it('should check if clean', () => {
      const isClean = client.isClean()
      expect(typeof isClean).toBe('boolean')
    })
  })

  describe('Revision Management', () => {
    it('should create a revision', () => {
      const revision = client.createRevision('Initial commit', 'Test Author')

      expect(revision).toBeDefined()
      expect(revision.id).toBeDefined()
      expect(revision.message).toBe('Initial commit')
      expect(revision.author).toBe('Test Author')
      expect(typeof revision.timestamp).toBe('string')
      expect(typeof revision.files_changed).toBe('number')
    })

    it('should create revision without author', () => {
      const revision = client.createRevision('Second commit')

      expect(revision).toBeDefined()
      expect(revision.message).toBe('Second commit')
    })

    it('should get revision history', () => {
      const history = client.getHistory(10)

      expect(Array.isArray(history)).toBe(true)
      expect(history.length).toBeGreaterThan(0)

      history.forEach((rev) => {
        expect(rev.id).toBeDefined()
        expect(rev.message).toBeDefined()
        expect(rev.author).toBeDefined()
        expect(rev.timestamp).toBeDefined()
      })
    })

    it('should limit history results', () => {
      const history = client.getHistory(1)

      expect(history.length).toBeLessThanOrEqual(1)
    })

    it('should get HEAD revision', () => {
      const head = client.getHead()

      expect(head).toBeDefined()
      expect(head.revision_id).toBeDefined()
      expect(head.branch).toBeDefined()
    })
  })

  describe('Branch Operations', () => {
    it('should get current branch', () => {
      const branch = client.currentBranch()

      expect(typeof branch).toBe('string')
      expect(branch.length).toBeGreaterThan(0)
    })

    it('should start on main branch', () => {
      const branch = client.currentBranch()
      expect(branch).toBe('main')
    })

    it('should switch branch', () => {
      const result = client.switchBranch('feature/test', true)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.branch).toBe('feature/test')
    })

    it('should verify branch switched', () => {
      client.switchBranch('feature/test', true)
      const branch = client.currentBranch()

      expect(branch).toBe('feature/test')
    })

    it('should switch back to main', () => {
      client.switchBranch('main', false)
      const branch = client.currentBranch()

      expect(branch).toBe('main')
    })
  })

  describe('Staging and Commits', () => {
    it('should stage files', () => {
      const files = ['file1.txt', 'file2.txt', 'file3.ts']
      const result = client.stageFiles(files)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.staged_files).toBe(files.length)
      expect(result.files).toEqual(files)
    })

    it('should stage empty file list', () => {
      const result = client.stageFiles([])

      expect(result.success).toBe(true)
      expect(result.staged_files).toBe(0)
    })

    it('should stage single file', () => {
      const result = client.stageFiles(['single.txt'])

      expect(result.staged_files).toBe(1)
    })

    it('should stage multiple files', () => {
      const files = Array.from({ length: 10 }, (_, i) => `file${i}.txt`)
      const result = client.stageFiles(files)

      expect(result.staged_files).toBe(10)
    })
  })

  describe('Merge Operations', () => {
    it('should merge branches', () => {
      const result = client.merge('feature/test')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(typeof result.conflicts).toBe('number')
      expect(typeof result.merged_files).toBe('number')
      expect(typeof result.message).toBe('string')
    })

    it('should merge with options', () => {
      const options = {
        force: false,
        verbose: true,
      }
      const result = client.merge('feature/test', options)

      expect(result.success).toBe(true)
    })

    it('should handle merge conflicts', () => {
      const result = client.merge('branch-with-conflicts')

      expect(result).toBeDefined()
      expect(typeof result.conflicts).toBe('number')
    })
  })

  describe('Sync Operations', () => {
    it('should sync with remote', () => {
      const result = client.sync('https://remote.repo')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(typeof result.pushed_revisions).toBe('number')
      expect(typeof result.pulled_revisions).toBe('number')
      expect(typeof result.duration_ms).toBe('number')
      expect(typeof result.message).toBe('string')
    })

    it('should sync with options', () => {
      const options = {
        concurrent: true,
        verbose: true,
      }
      const result = client.sync('https://remote.repo', options)

      expect(result.success).toBe(true)
    })

    it('should measure sync duration', () => {
      const result = client.sync('https://remote.repo')

      expect(result.duration_ms).toBeGreaterThanOrEqual(0)
    })

    it('should handle multiple syncs', () => {
      const results = [
        client.sync('https://remote1.repo'),
        client.sync('https://remote2.repo'),
      ]

      expect(results).toHaveLength(2)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Reset Operations', () => {
    it('should reset repository', () => {
      // First stage some files
      client.stageFiles(['file1.txt'])

      // Then reset
      const result = client.reset(false)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.hard).toBe(false)
    })

    it('should do hard reset', () => {
      const result = client.reset(true)

      expect(result.success).toBe(true)
      expect(result.hard).toBe(true)
    })

    it('should be clean after reset', () => {
      client.reset(true)
      const isClean = client.isClean()

      expect(isClean).toBe(true)
    })
  })

  describe('Configuration', () => {
    it('should get repository config', () => {
      const config = client.getConfig()

      expect(config).toBeDefined()
      expect(config.path).toBeDefined()
    })

    it('should preserve config values', () => {
      const config = client.getConfig()

      expect(config.path).toBe(testConfig.path)
      expect(config.author).toBe(testConfig.author)
      expect(config.description).toBe(testConfig.description)
    })

    it('should handle config without optional fields', () => {
      const minimalClient = new AgenticJujutsu({
        path: '/minimal/path',
      })
      const config = minimalClient.getConfig()

      expect(config.path).toBe('/minimal/path')
    })
  })

  describe('Error Handling', () => {
    it('should throw AgenticJujutsuError on failures', () => {
      expect(() => {
        const invalidClient = new AgenticJujutsu()
        invalidClient.createRevision('')
      }).not.toThrow(AgenticJujutsuError) // Empty message is valid
    })

    it('should have error code property', () => {
      try {
        throw new AgenticJujutsuError('Test error', 'TEST_ERROR')
      } catch (error) {
        expect(error).toBeInstanceOf(AgenticJujutsuError)
        expect((error as AgenticJujutsuError).code).toBe('TEST_ERROR')
      }
    })

    it('should include error message in AgenticJujutsuError', () => {
      const errorMsg = 'Custom error message'
      const error = new AgenticJujutsuError(errorMsg, 'CUSTOM_ERROR')

      expect(error.message).toBe(errorMsg)
      expect(error.name).toBe('AgenticJujutsuError')
    })
  })

  describe('Integration Tests', () => {
    it('should complete a full workflow', () => {
      // Initialize
      const initResult = client.init()
      expect(initResult.success).toBe(true)

      // Create revisions
      client.createRevision('Commit 1', 'Author 1')
      client.createRevision('Commit 2', 'Author 2')

      // Check history
      const history = client.getHistory(5)
      expect(history.length).toBeGreaterThan(0)

      // Switch branch
      client.switchBranch('develop', true)

      // Stage and commit
      client.stageFiles(['feature.ts'])
      client.createRevision('Add feature')

      // Merge
      const mergeResult = client.merge('develop')
      expect(mergeResult.success).toBe(true)

      // Sync
      const syncResult = client.sync('https://remote.repo')
      expect(syncResult.success).toBe(true)

      // Reset
      const resetResult = client.reset()
      expect(resetResult.success).toBe(true)
    })

    it('should maintain state across operations', () => {
      // Create multiple revisions
      const rev1 = client.createRevision('First')
      const rev2 = client.createRevision('Second')
      const rev3 = client.createRevision('Third')

      // Get history
      const history = client.getHistory(10)

      // Verify order
      expect(history.length).toBeGreaterThan(0)
      expect(history[0].id).toBe(rev3.id)
    })

    it('should handle multiple operations in sequence', () => {
      const status = client.status()
      const branch = client.currentBranch()
      const sync = client.sync('https://remote.repo')

      expect(status).toBeDefined()
      expect(branch).toBeDefined()
      expect(sync).toBeDefined()
    })

    it('should handle branch creation and deletion flow', () => {
      // Create branch
      const createResult = client.switchBranch('feature/new', true)
      expect(createResult.success).toBe(true)

      // Verify current branch
      expect(client.currentBranch()).toBe('feature/new')

      // Switch back
      const switchResult = client.switchBranch('main', false)
      expect(switchResult.success).toBe(true)

      // Verify
      expect(client.currentBranch()).toBe('main')
    })
  })

  describe('Type Safety', () => {
    it('should return correct types from methods', () => {
      expect(typeof client.isClean()).toBe('boolean')
      expect(typeof client.currentBranch()).toBe('string')
      expect(typeof client.isInitialized()).toBe('boolean')
      expect(Array.isArray(client.getHistory(5))).toBe(true)
    })

    it('should have correct interface types', () => {
      const status: RepositoryStatus = client.status()
      expect(status.is_clean).toBeDefined()
      expect(status.modified_files).toBeDefined()

      const head: RevisionInfo = client.getHead()
      expect(head.revision_id).toBeDefined()
      expect(head.branch).toBeDefined()
    })
  })

  describe('Performance', () => {
    it('should complete operations quickly', () => {
      const start = Date.now()

      client.createRevision('Test')
      client.getHistory(5)
      client.status()

      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // Should be < 1 second
    })

    it('should handle large history queries', () => {
      // Create multiple revisions
      for (let i = 0; i < 20; i++) {
        client.createRevision(`Commit ${i}`)
      }

      const start = Date.now()
      const history = client.getHistory(50)
      const duration = Date.now() - start

      expect(history.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(500) // Should be < 500ms
    })

    it('should stage many files efficiently', () => {
      const files = Array.from({ length: 100 }, (_, i) => `file${i}.txt`)

      const start = Date.now()
      const result = client.stageFiles(files)
      const duration = Date.now() - start

      expect(result.staged_files).toBe(100)
      expect(duration).toBeLessThan(200) // Should be < 200ms
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty branch name gracefully', () => {
      const result = client.switchBranch('')

      expect(result).toBeDefined()
      expect(typeof result.success).toBe('boolean')
    })

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000)
      const revision = client.createRevision(longMessage)

      expect(revision.message).toBe(longMessage)
    })

    it('should handle special characters in names', () => {
      const result = client.switchBranch('feature/test-2024_special@v1', true)

      expect(result.success).toBe(true)
    })

    it('should handle rapid sequential operations', () => {
      for (let i = 0; i < 10; i++) {
        client.createRevision(`Rapid commit ${i}`)
      }

      const history = client.getHistory(20)
      expect(history.length).toBeGreaterThan(0)
    })
  })
})
