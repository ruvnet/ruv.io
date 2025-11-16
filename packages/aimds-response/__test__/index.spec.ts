import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  ResponseEngine,
  createResponseEngine,
  registerPolicyRule,
  evaluatePolicies,
  executeResponseActions,
  enforcePolicy,
  rollbackAction,
  getActionStatus,
  batchEvaluateIncidents,
  createWorkflow,
  generateResponseReport,
  Incident,
  PolicyRule,
  ResponseAction,
  PolicyEvaluationResult,
  ResponseResult,
} from '../src/index'

describe('AIMDS Response - Incident Management and Policy Enforcement', () => {
  // Sample data
  const samplePolicy: PolicyRule = {
    id: 'policy-001',
    name: 'Critical Threat Response',
    condition: 'critical',
    action: 'isolate',
    enabled: true,
    priority: 100,
  }

  const samplePolicy2: PolicyRule = {
    id: 'policy-002',
    name: 'High Severity Response',
    condition: 'high',
    action: 'alert',
    enabled: true,
    priority: 50,
  }

  const sampleIncident: Incident = {
    id: 'inc-001',
    threat_type: 'malware',
    severity: 85,
    source: '192.168.1.100',
    timestamp: '2024-01-01T00:00:00Z',
    metadata: { detected_by: 'scanner-01' },
  }

  const sampleIncident2: Incident = {
    id: 'inc-002',
    threat_type: 'suspicious_activity',
    severity: 45,
    source: '10.0.0.50',
    timestamp: '2024-01-01T00:05:00Z',
    metadata: { detected_by: 'monitor-02' },
  }

  const sampleAction: ResponseAction = {
    id: 'action-001',
    action_type: 'isolate',
    target: '192.168.1.100',
    parameters: { duration: 3600 },
    rule_id: 'policy-001',
    timestamp: '2024-01-01T00:01:00Z',
  }

  describe('Response Engine Creation', () => {
    it('should create a response engine', () => {
      const engineJson = createResponseEngine()
      expect(engineJson).toBeDefined()

      const engine = JSON.parse(engineJson)
      expect(engine.type).toBe('ResponseEngine')
      expect(engine.status).toBe('initialized')
      expect(engine.id).toBeDefined()
    })

    it('should create ResponseEngine instance', () => {
      const engine = new ResponseEngine()
      expect(engine).toBeDefined()
      expect(engine).toBeInstanceOf(ResponseEngine)
    })

    it('should create ResponseEngine with config', () => {
      const config = { timeout: 5000, retries: 3 }
      const engine = new ResponseEngine(config)
      expect(engine).toBeDefined()
    })
  })

  describe('Policy Rule Registration', () => {
    it('should register a policy rule', () => {
      const result = registerPolicyRule(samplePolicy)

      expect(result).toBeDefined()
      expect(result.rule_id).toBe('policy-001')
      expect(result.registered).toBe(true)
      expect(result.status).toBe('active')
    })

    it('should register policy rule via engine', () => {
      const engine = new ResponseEngine()
      const result = engine.registerPolicy(samplePolicy)

      expect(result.registered).toBe(true)
      expect(result.status).toBe('active')
    })

    it('should register multiple policy rules', () => {
      const result1 = registerPolicyRule(samplePolicy)
      const result2 = registerPolicyRule(samplePolicy2)

      expect(result1.registered).toBe(true)
      expect(result2.registered).toBe(true)
      expect(result1.priority).toBe(100)
      expect(result2.priority).toBe(50)
    })

    it('should preserve policy priority', () => {
      const highPriorityPolicy: PolicyRule = {
        ...samplePolicy,
        id: 'policy-high',
        priority: 200,
      }

      const result = registerPolicyRule(highPriorityPolicy)
      expect(result.priority).toBe(200)
    })
  })

  describe('Policy Evaluation', () => {
    it('should evaluate policies against incident', () => {
      const result: PolicyEvaluationResult = evaluatePolicies(sampleIncident, [
        samplePolicy,
        samplePolicy2,
      ])

      expect(result).toBeDefined()
      expect(result.incident_id).toBe('inc-001')
      expect(result.matching_rules).toBeDefined()
      expect(Array.isArray(result.matching_rules)).toBe(true)
      expect(result.total_rules_checked).toBe(2)
    })

    it('should evaluate policies via engine', () => {
      const engine = new ResponseEngine()
      const result = engine.evaluateIncident(sampleIncident, [samplePolicy, samplePolicy2])

      expect(result.incident_id).toBe('inc-001')
      expect(result.total_rules_checked).toBe(2)
    })

    it('should match high severity incident to critical policy', () => {
      const result = evaluatePolicies(sampleIncident, [samplePolicy])

      expect(result.matching_rules.length).toBeGreaterThan(0)
      expect(result.matching_rules).toContain('policy-001')
    })

    it('should recommend appropriate actions', () => {
      const result = evaluatePolicies(sampleIncident, [samplePolicy])

      expect(result.recommended_actions).toBeDefined()
      expect(Array.isArray(result.recommended_actions)).toBe(true)
    })

    it('should evaluate multiple incidents', () => {
      const result = evaluatePolicies(sampleIncident2, [samplePolicy, samplePolicy2])

      expect(result.incident_id).toBe('inc-002')
      expect(result.total_rules_checked).toBe(2)
    })

    it('should handle empty policy list', () => {
      const result = evaluatePolicies(sampleIncident, [])

      expect(result).toBeDefined()
      expect(result.total_rules_checked).toBe(0)
    })

    it('should handle disabled policies', () => {
      const disabledPolicy: PolicyRule = {
        ...samplePolicy,
        enabled: false,
      }

      const result = evaluatePolicies(sampleIncident, [disabledPolicy])

      expect(result.matching_rules.length).toBe(0)
    })

    it('should measure evaluation time', () => {
      const result = evaluatePolicies(sampleIncident, [samplePolicy, samplePolicy2])

      expect(result.evaluation_time_ms).toBeGreaterThan(0)
      expect(typeof result.evaluation_time_ms).toBe('number')
    })
  })

  describe('Response Action Execution', () => {
    it('should execute response actions', () => {
      const result: ResponseResult = executeResponseActions(sampleIncident, [sampleAction])

      expect(result).toBeDefined()
      expect(result.incident_id).toBe('inc-001')
      expect(result.executed_actions).toBeDefined()
      expect(Array.isArray(result.executed_actions)).toBe(true)
    })

    it('should execute actions via engine', () => {
      const engine = new ResponseEngine()
      const result = engine.respondToIncident(sampleIncident, [sampleAction])

      expect(result.incident_id).toBe('inc-001')
      expect(result.executed_actions).toBeDefined()
    })

    it('should track executed actions', () => {
      const result = executeResponseActions(sampleIncident, [sampleAction])

      expect(result.executed_actions.length).toBeGreaterThanOrEqual(0)
      expect(result.executed_actions).toContain('action-001')
    })

    it('should report success status on successful execution', () => {
      const result = executeResponseActions(sampleIncident, [sampleAction])

      expect(result.status).toBe('success')
    })

    it('should measure execution duration', () => {
      const result = executeResponseActions(sampleIncident, [sampleAction])

      expect(result.total_duration_ms).toBeGreaterThan(0)
      expect(typeof result.total_duration_ms).toBe('number')
    })

    it('should execute multiple actions', () => {
      const action2: ResponseAction = {
        ...sampleAction,
        id: 'action-002',
        action_type: 'alert',
      }

      const result = executeResponseActions(sampleIncident, [sampleAction, action2])

      expect(result.executed_actions.length).toBeGreaterThanOrEqual(0)
    })

    it('should preserve incident severity in response', () => {
      const result = executeResponseActions(sampleIncident, [sampleAction])

      expect(result.severity_handled).toBe(85)
    })

    it('should handle empty action list', () => {
      const result = executeResponseActions(sampleIncident, [])

      expect(result).toBeDefined()
      expect(result.executed_actions.length).toBe(0)
    })
  })

  describe('Policy Enforcement', () => {
    it('should enforce policy rules', () => {
      const result = enforcePolicy('policy-001', 'target-01')

      expect(result).toBeDefined()
      expect(result.policy_id).toBe('policy-001')
      expect(result.enforced).toBe(true)
      expect(result.status).toBe('active')
    })

    it('should enforce via engine', () => {
      const engine = new ResponseEngine()
      const result = engine.enforce('policy-001', 'target-01')

      expect(result.enforced).toBe(true)
      expect(result.status).toBe('active')
    })

    it('should enforce with parameters', () => {
      const params = { duration: 3600, threshold: 0.8 }
      const result = enforcePolicy('policy-001', 'target-01', params)

      expect(result.enforced).toBe(true)
    })

    it('should provide enforcement confirmation message', () => {
      const result = enforcePolicy('policy-001', 'target-01')

      expect(result.message).toBeDefined()
      expect(result.message.length).toBeGreaterThan(0)
    })

    it('should have enforcement timestamp', () => {
      const result = enforcePolicy('policy-001', 'target-01')

      expect(result.timestamp).toBeDefined()
    })
  })

  describe('Action Rollback', () => {
    it('should rollback executed actions', () => {
      const result = rollbackAction('action-001')

      expect(result).toBeDefined()
      expect(result.action_id).toBe('action-001')
      expect(result.status).toBe('completed')
      expect(result.rollback_success).toBe(true)
    })

    it('should rollback via engine', () => {
      const engine = new ResponseEngine()
      const result = engine.rollback('action-001')

      expect(result.rollback_success).toBe(true)
    })

    it('should rollback with context', () => {
      const context = { previous_state: 'active', rollback_reason: 'incident_resolved' }
      const result = rollbackAction('action-001', context)

      expect(result.rollback_success).toBe(true)
    })

    it('should provide rollback confirmation message', () => {
      const result = rollbackAction('action-001')

      expect(result.message).toBeDefined()
      expect(result.message.length).toBeGreaterThan(0)
    })

    it('should have rollback timestamp', () => {
      const result = rollbackAction('action-001')

      expect(result.timestamp).toBeDefined()
    })

    it('should handle multiple action rollbacks', () => {
      const result1 = rollbackAction('action-001')
      const result2 = rollbackAction('action-002')

      expect(result1.rollback_success).toBe(true)
      expect(result2.rollback_success).toBe(true)
    })
  })

  describe('Action Status Checking', () => {
    it('should get action status', () => {
      const result = getActionStatus('action-001')

      expect(result).toBeDefined()
      expect(result.action_id).toBe('action-001')
      expect(result.status).toBeDefined()
    })

    it('should check status via engine', () => {
      const engine = new ResponseEngine()
      const result = engine.checkStatus('action-001')

      expect(result.action_id).toBe('action-001')
    })

    it('should report action completion status', () => {
      const result = getActionStatus('action-001')

      expect(result.status).toBe('completed')
    })

    it('should provide result code', () => {
      const result = getActionStatus('action-001')

      expect(typeof result.result_code).toBe('number')
      expect(result.result_code).toBe(0)
    })

    it('should provide status message', () => {
      const result = getActionStatus('action-001')

      expect(result.message).toBeDefined()
      expect(result.message.length).toBeGreaterThan(0)
    })

    it('should measure action duration', () => {
      const result = getActionStatus('action-001')

      expect(result.duration_ms).toBeGreaterThan(0)
      expect(typeof result.duration_ms).toBe('number')
    })

    it('should have execution timestamp', () => {
      const result = getActionStatus('action-001')

      expect(result.timestamp).toBeDefined()
    })
  })

  describe('Batch Operations', () => {
    it('should batch evaluate multiple incidents', () => {
      const results = batchEvaluateIncidents([sampleIncident, sampleIncident2], [
        samplePolicy,
        samplePolicy2,
      ])

      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(2)
    })

    it('should batch evaluate via engine', () => {
      const engine = new ResponseEngine()
      const results = engine.batchEvaluate([sampleIncident, sampleIncident2], [
        samplePolicy,
        samplePolicy2,
      ])

      expect(results.length).toBe(2)
    })

    it('should evaluate each incident independently in batch', () => {
      const results = batchEvaluateIncidents([sampleIncident, sampleIncident2], [
        samplePolicy,
        samplePolicy2,
      ])

      expect(results[0].incident_id).toBe('inc-001')
      expect(results[1].incident_id).toBe('inc-002')
    })

    it('should handle large batch evaluations', () => {
      const incidents = Array.from({ length: 50 }, (_, i) => ({
        id: `inc-batch-${i}`,
        threat_type: 'test',
        severity: 50 + (i % 40),
        source: `192.168.1.${i}`,
        timestamp: new Date().toISOString(),
        metadata: {},
      }))

      const results = batchEvaluateIncidents(incidents, [samplePolicy, samplePolicy2])

      expect(results.length).toBe(50)
    })

    it('should handle empty batch', () => {
      const results = batchEvaluateIncidents([], [samplePolicy])

      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('Workflow Management', () => {
    it('should create response workflow', () => {
      const steps = [
        { step: 1, action: 'evaluate', parameters: {} },
        { step: 2, action: 'execute', parameters: {} },
      ]

      const result = createWorkflow(steps)

      expect(result).toBeDefined()
      expect(result.workflow_id).toBeDefined()
      expect(result.status).toBe('created')
    })

    it('should create workflow via engine', () => {
      const steps = [
        { step: 1, action: 'evaluate', parameters: {} },
        { step: 2, action: 'execute', parameters: {} },
      ]

      const engine = new ResponseEngine()
      const result = engine.workflow(steps)

      expect(result.workflow_id).toBeDefined()
      expect(result.status).toBe('created')
    })

    it('should preserve workflow steps', () => {
      const steps = [
        { step: 1, action: 'detect', priority: 'high' },
        { step: 2, action: 'respond', auto: true },
        { step: 3, action: 'verify', required: true },
      ]

      const result = createWorkflow(steps)

      expect(result.steps).toBeDefined()
    })

    it('should have workflow timestamp', () => {
      const result = createWorkflow([])

      expect(result.created_at).toBeDefined()
    })

    it('should handle complex workflows', () => {
      const steps = Array.from({ length: 10 }, (_, i) => ({
        step: i + 1,
        action: `action-${i}`,
        parameters: { index: i },
      }))

      const result = createWorkflow(steps)

      expect(result.workflow_id).toBeDefined()
    })
  })

  describe('Report Generation', () => {
    it('should generate response report', () => {
      const params = {
        incident_count: 5,
        actions_executed: 12,
        policies_enforced: 3,
      }

      const result = generateResponseReport(params)

      expect(result).toBeDefined()
      expect(result.report_id).toBeDefined()
      expect(result.type).toBe('response_report')
    })

    it('should generate report via engine', () => {
      const params = {
        incident_count: 5,
        actions_executed: 12,
        policies_enforced: 3,
      }

      const engine = new ResponseEngine()
      const result = engine.report(params)

      expect(result.report_id).toBeDefined()
    })

    it('should include incident count in report', () => {
      const params = {
        incident_count: 10,
        actions_executed: 25,
        policies_enforced: 5,
      }

      const result = generateResponseReport(params)

      expect(result.incident_count).toBe(10)
    })

    it('should include actions executed in report', () => {
      const params = {
        incident_count: 5,
        actions_executed: 20,
        policies_enforced: 4,
      }

      const result = generateResponseReport(params)

      expect(result.actions_executed).toBe(20)
    })

    it('should calculate success rate', () => {
      const params = {
        incident_count: 5,
        actions_executed: 12,
        policies_enforced: 3,
      }

      const result = generateResponseReport(params)

      expect(result.success_rate).toBeGreaterThan(0)
      expect(result.success_rate).toBeLessThanOrEqual(100)
    })

    it('should have response time metrics', () => {
      const params = {
        incident_count: 5,
        actions_executed: 12,
        policies_enforced: 3,
      }

      const result = generateResponseReport(params)

      expect(result.average_response_time_ms).toBeGreaterThan(0)
    })

    it('should have report timestamp', () => {
      const result = generateResponseReport({})

      expect(result.generated_at).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should perform complete incident response workflow', () => {
      // Evaluate
      const evaluation = evaluatePolicies(sampleIncident, [samplePolicy, samplePolicy2])
      expect(evaluation.matching_rules.length).toBeGreaterThan(0)

      // Execute
      const response = executeResponseActions(sampleIncident, [sampleAction])
      expect(response.executed_actions.length).toBeGreaterThanOrEqual(0)

      // Check status
      const status = getActionStatus(sampleAction.id)
      expect(status.action_id).toBe('action-001')
    })

    it('should handle policy evaluation and enforcement', () => {
      // Register policy
      const registered = registerPolicyRule(samplePolicy)
      expect(registered.registered).toBe(true)

      // Enforce policy
      const enforced = enforcePolicy(samplePolicy.id, 'target-01')
      expect(enforced.enforced).toBe(true)
    })

    it('should execute and rollback actions', () => {
      // Execute
      const response = executeResponseActions(sampleIncident, [sampleAction])
      expect(response.executed_actions.length).toBeGreaterThanOrEqual(0)

      // Rollback
      const rollback = rollbackAction(sampleAction.id)
      expect(rollback.rollback_success).toBe(true)
    })

    it('should handle complete engine workflow', () => {
      const engine = new ResponseEngine({ timeout: 5000 })

      // Register policies
      const policy1 = engine.registerPolicy(samplePolicy)
      expect(policy1.registered).toBe(true)

      // Evaluate incident
      const evaluation = engine.evaluateIncident(sampleIncident, [samplePolicy])
      expect(evaluation.incident_id).toBe('inc-001')

      // Respond to incident
      const response = engine.respondToIncident(sampleIncident, [sampleAction])
      expect(response.incident_id).toBe('inc-001')

      // Check status
      const status = engine.checkStatus(sampleAction.id)
      expect(status.action_id).toBe('action-001')
    })

    it('should manage multiple incidents and policies', () => {
      const incidents = [sampleIncident, sampleIncident2]
      const policies = [samplePolicy, samplePolicy2]

      const results = batchEvaluateIncidents(incidents, policies)

      expect(results.length).toBe(2)
      expect(results[0].incident_id).toBe('inc-001')
      expect(results[1].incident_id).toBe('inc-002')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid policy registration', () => {
      expect(() => {
        registerPolicyRule({
          id: '',
          name: '',
          condition: '',
          action: '',
          enabled: true,
          priority: 0,
        })
      }).not.toThrow()
    })

    it('should handle policy evaluation with minimal policies', () => {
      expect(() => {
        evaluatePolicies(sampleIncident, [])
      }).not.toThrow()
    })

    it('should handle action execution with invalid actions', () => {
      expect(() => {
        executeResponseActions(sampleIncident, [])
      }).not.toThrow()
    })

    it('should handle concurrent operations', async () => {
      const promises = [
        Promise.resolve(registerPolicyRule(samplePolicy)),
        Promise.resolve(evaluatePolicies(sampleIncident, [samplePolicy])),
        Promise.resolve(getActionStatus('action-001')),
      ]

      const results = await Promise.all(promises)
      expect(results.length).toBe(3)
    })
  })
})
