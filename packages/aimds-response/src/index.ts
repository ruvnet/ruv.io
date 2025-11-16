// AIMDS Response - Incident Response and Policy Enforcement
// TypeScript bindings for the napi-rs module

export interface PolicyRule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
  priority: number
}

export interface Incident {
  id: string
  threat_type: string
  severity: number
  source: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface ResponseAction {
  id: string
  action_type: string
  target: string
  parameters?: Record<string, any>
  rule_id: string
  timestamp: string
}

export interface ActionResult {
  action_id: string
  status: string
  result_code: number
  message: string
  duration_ms: number
  timestamp: string
}

export interface ResponseResult {
  incident_id: string
  executed_actions: string[]
  failed_actions: string[]
  status: string
  severity_handled: number
  total_duration_ms: number
  timestamp: string
}

export interface RollbackResult {
  action_id: string
  status: string
  rollback_success: boolean
  message: string
  timestamp: string
}

export interface PolicyEvaluationResult {
  incident_id: string
  matching_rules: string[]
  recommended_actions: string[]
  total_rules_checked: number
  evaluation_time_ms: number
}

export interface EnforcementResult {
  policy_id: string
  target: string
  enforced: boolean
  status: string
  message: string
  timestamp: string
}

export interface WorkflowResult {
  workflow_id: string
  status: string
  steps: any[]
  created_at: string
}

export interface ResponseReport {
  report_id: string
  type: string
  generated_at: string
  incident_count: number
  actions_executed: number
  policies_enforced: number
  success_rate: number
  average_response_time_ms: number
}

/**
 * Native bindings from aimds_response Rust module
 */
let aimdsResponse: any

try {
  // Load the native module via platform loader
  aimdsResponse = require('../index')
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native aimds_response module not loaded. Build the project first.')
  aimdsResponse = null
}

/**
 * Create a new response engine
 * @returns Response engine instance as JSON string
 */
export function createResponseEngine(): string {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  return aimdsResponse.createResponseEngine()
}

/**
 * Register a policy rule with the engine
 * @param rule - Policy rule to register
 * @returns Registration result
 */
export function registerPolicyRule(rule: PolicyRule): Record<string, any> {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const ruleJson = JSON.stringify(rule)
  const result = aimdsResponse.registerPolicyRule(ruleJson)

  return JSON.parse(result)
}

/**
 * Evaluate policies against an incident
 * @param incident - Incident to evaluate
 * @param policies - Policies to check
 * @returns Policy evaluation result
 */
export function evaluatePolicies(
  incident: Incident,
  policies: PolicyRule[]
): PolicyEvaluationResult {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const incidentJson = JSON.stringify(incident)
  const policiesJson = JSON.stringify(policies)
  const result = aimdsResponse.evaluatePolicies(incidentJson, policiesJson)

  return JSON.parse(result)
}

/**
 * Execute response actions for an incident
 * @param incident - Incident to respond to
 * @param actions - Actions to execute
 * @returns Response execution result
 */
export function executeResponseActions(
  incident: Incident,
  actions: ResponseAction[]
): ResponseResult {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const incidentJson = JSON.stringify(incident)
  const actionsJson = JSON.stringify(actions)
  const result = aimdsResponse.executeResponseActions(incidentJson, actionsJson)

  return JSON.parse(result)
}

/**
 * Enforce policy rules
 * @param policyId - ID of policy to enforce
 * @param target - Target for enforcement
 * @param parameters - Enforcement parameters
 * @returns Enforcement result
 */
export function enforcePolicy(
  policyId: string,
  target: string,
  parameters?: Record<string, any>
): EnforcementResult {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const enforcementJson = JSON.stringify({
    policy_id: policyId,
    target,
    parameters: parameters || {},
  })
  const result = aimdsResponse.enforcePolicy(enforcementJson)

  return JSON.parse(result)
}

/**
 * Rollback a previously executed action
 * @param actionId - ID of action to rollback
 * @param context - Rollback context information
 * @returns Rollback result
 */
export function rollbackAction(
  actionId: string,
  context?: Record<string, any>
): RollbackResult {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const contextJson = JSON.stringify(context || {})
  const result = aimdsResponse.rollbackAction(actionId, contextJson)

  return JSON.parse(result)
}

/**
 * Get status of an executed action
 * @param actionId - ID of action to check
 * @returns Action status information
 */
export function getActionStatus(actionId: string): ActionResult {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const result = aimdsResponse.getActionStatus(actionId)

  return JSON.parse(result)
}

/**
 * Batch evaluate multiple incidents against policies
 * @param incidents - Array of incidents to evaluate
 * @param policies - Array of policies to check
 * @returns Batch evaluation results
 */
export function batchEvaluateIncidents(
  incidents: Incident[],
  policies: PolicyRule[]
): PolicyEvaluationResult[] {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const incidentsJson = JSON.stringify(incidents)
  const policiesJson = JSON.stringify(policies)
  const result = aimdsResponse.batchEvaluateIncidents(incidentsJson, policiesJson)

  return JSON.parse(result)
}

/**
 * Create an automatic incident response workflow
 * @param steps - Workflow steps configuration
 * @returns Created workflow result
 */
export function createWorkflow(steps: any[]): WorkflowResult {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const workflowJson = JSON.stringify({ steps })
  const result = aimdsResponse.createWorkflow(workflowJson)

  return JSON.parse(result)
}

/**
 * Generate incident response report
 * @param params - Report parameters
 * @returns Response report
 */
export function generateResponseReport(params: Record<string, any>): ResponseReport {
  if (!aimdsResponse) {
    throw new Error('Native module not available')
  }

  const reportJson = JSON.stringify(params)
  const result = aimdsResponse.generateResponseReport(reportJson)

  return JSON.parse(result)
}

/**
 * ResponseEngine class for advanced incident management
 */
export class ResponseEngine {
  private engineConfig: Record<string, any>

  /**
   * Create a new ResponseEngine instance
   * @param config - Engine configuration
   */
  constructor(config?: Record<string, any>) {
    if (!aimdsResponse) {
      throw new Error('Native module not available')
    }
    this.engineConfig = config || {}
  }

  /**
   * Register a policy rule
   */
  registerPolicy(rule: PolicyRule): Record<string, any> {
    return registerPolicyRule(rule)
  }

  /**
   * Evaluate policies for an incident
   */
  evaluateIncident(incident: Incident, policies: PolicyRule[]): PolicyEvaluationResult {
    return evaluatePolicies(incident, policies)
  }

  /**
   * Execute response actions
   */
  respondToIncident(incident: Incident, actions: ResponseAction[]): ResponseResult {
    return executeResponseActions(incident, actions)
  }

  /**
   * Enforce a policy
   */
  enforce(policyId: string, target: string, parameters?: Record<string, any>): EnforcementResult {
    return enforcePolicy(policyId, target, parameters)
  }

  /**
   * Rollback an action
   */
  rollback(actionId: string, context?: Record<string, any>): RollbackResult {
    return rollbackAction(actionId, context)
  }

  /**
   * Get action status
   */
  checkStatus(actionId: string): ActionResult {
    return getActionStatus(actionId)
  }

  /**
   * Batch evaluate incidents
   */
  batchEvaluate(incidents: Incident[], policies: PolicyRule[]): PolicyEvaluationResult[] {
    return batchEvaluateIncidents(incidents, policies)
  }

  /**
   * Create workflow
   */
  workflow(steps: any[]): WorkflowResult {
    return createWorkflow(steps)
  }

  /**
   * Generate report
   */
  report(params: Record<string, any>): ResponseReport {
    return generateResponseReport(params)
  }
}

// Export all types and functions
export default {
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
  ResponseEngine,
}
