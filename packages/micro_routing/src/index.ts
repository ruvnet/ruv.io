// Micro Routing - High-performance request routing for microservices
// TypeScript bindings for the napi-rs module

export interface Service {
  id: string
  host: string
  port: number
  weight?: number
  active?: boolean
}

export interface Route {
  id: string
  path: string
  pattern: string
  services: string[]
  load_balance_strategy: string
}

export interface HealthCheckResult {
  service_id: string
  healthy: boolean
  timestamp: number
  response_time: number
}

export interface RouteMatchResult {
  matched: boolean
  route_id?: string
  service?: Service
  timestamp: number
}

export interface ServiceStats {
  service_id: string
  total_requests: number
  active_connections: number
  last_health_check: number
  health_status: boolean
}

export interface RouterConfig {
  timeout?: number
  retries?: number
  healthCheckInterval?: number
}

/**
 * Native bindings from micro_routing Rust module
 */
let microRouting: any

try {
  // Try to load the native module - path adjusts based on whether we're in src or dist
  try {
    microRouting = require('../index')
  } catch (_e1) {
    // If running from dist directory
    microRouting = require('../../index')
  }
} catch (e) {
  // Fallback - module not built yet
  console.warn('Native micro_routing module not loaded. Build the project first.')
  microRouting = null
}

/**
 * Create a new Router instance
 * @returns Router instance info
 */
export function createRouter(): Record<string, any> {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const result = microRouting.createRouter()
  return JSON.parse(result)
}

/**
 * Register a new service
 * @param service - Service to register
 * @returns Registration result
 */
export function registerService(service: Service): Record<string, any> {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const serviceJson = JSON.stringify(service)
  const result = microRouting.registerService(serviceJson)

  return JSON.parse(result)
}

/**
 * Deregister a service
 * @param serviceId - Service ID to deregister
 * @returns Deregistration result
 */
export function deregisterService(serviceId: string): Record<string, any> {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const result = microRouting.deregisterService(serviceId)
  return JSON.parse(result)
}

/**
 * Add a route
 * @param route - Route to add
 * @returns Route creation result
 */
export function addRoute(route: Route): Record<string, any> {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const routeJson = JSON.stringify(route)
  const result = microRouting.addRoute(routeJson)

  return JSON.parse(result)
}

/**
 * Remove a route
 * @param routeId - Route ID to remove
 * @returns Route removal result
 */
export function removeRoute(routeId: string): Record<string, any> {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const result = microRouting.removeRoute(routeId)
  return JSON.parse(result)
}

/**
 * Match a request path to a route
 * @param path - Request path to match
 * @param routes - Array of routes to match against
 * @returns Route match result
 */
export function matchRoute(path: string, routes: Route[]): RouteMatchResult {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const routesJson = JSON.stringify(routes)
  const result = microRouting.matchRoute(path, routesJson)

  return JSON.parse(result)
}

/**
 * Select a service using round-robin load balancing
 * @param routeId - Route ID for context
 * @param services - Available services
 * @returns Selected service
 */
export function selectServiceRoundRobin(routeId: string, services: Service[]): Service {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const servicesJson = JSON.stringify(services)
  const result = microRouting.selectServiceRoundRobin(routeId, servicesJson)

  return JSON.parse(result)
}

/**
 * Select a service using least connections load balancing
 * @param services - Available services
 * @param connections - Connection count per service
 * @returns Selected service
 */
export function selectServiceLeastConnections(
  services: Service[],
  connections: Record<string, number>,
): Service {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const servicesJson = JSON.stringify(services)
  const connectionsJson = JSON.stringify(connections)
  const result = microRouting.selectServiceLeastConnections(servicesJson, connectionsJson)

  return JSON.parse(result)
}

/**
 * Select a service using weighted load balancing
 * @param services - Available services with weights
 * @returns Selected service
 */
export function selectServiceWeighted(services: Service[]): Service {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const servicesJson = JSON.stringify(services)
  const result = microRouting.selectServiceWeighted(servicesJson)

  return JSON.parse(result)
}

/**
 * Perform a health check on a service
 * @param serviceId - Service ID
 * @param host - Service host
 * @param port - Service port
 * @returns Health check result
 */
export function healthCheck(serviceId: string, host: string, port: number): HealthCheckResult {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const result = microRouting.healthCheck(serviceId, host, port)

  return JSON.parse(result)
}

/**
 * Batch health check multiple services
 * @param services - Services to check
 * @returns Array of health check results
 */
export function batchHealthCheck(services: Service[]): HealthCheckResult[] {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const servicesJson = JSON.stringify(services)
  const result = microRouting.batchHealthCheck(servicesJson)

  return JSON.parse(result)
}

/**
 * Get statistics for a service
 * @param serviceId - Service ID
 * @param stats - Current stats object
 * @returns Updated service stats
 */
export function getServiceStats(serviceId: string, stats: ServiceStats): ServiceStats {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const statsJson = JSON.stringify(stats)
  const result = microRouting.getServiceStats(serviceId, statsJson)

  return JSON.parse(result)
}

/**
 * Increment connection counter
 * @param serviceId - Service ID
 * @returns Updated connection count
 */
export function incrementConnections(serviceId: string): number {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  return microRouting.incrementConnections(serviceId)
}

/**
 * Decrement connection counter
 * @param serviceId - Service ID
 * @returns Updated connection count
 */
export function decrementConnections(serviceId: string): number {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  return microRouting.decrementConnections(serviceId)
}

/**
 * List all routes
 * @param routes - Array of all routes
 * @returns List result with total count
 */
export function listRoutes(routes: Route[]): Record<string, any> {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const routesJson = JSON.stringify(routes)
  const result = microRouting.listRoutes(routesJson)

  return JSON.parse(result)
}

/**
 * List all services
 * @param services - Array of all services
 * @returns List result with total count
 */
export function listServices(services: Service[]): Record<string, any> {
  if (!microRouting) {
    throw new Error('Native module not available')
  }

  const servicesJson = JSON.stringify(services)
  const result = microRouting.listServices(servicesJson)

  return JSON.parse(result)
}

/**
 * Create a new Router instance for advanced use cases
 */
export class Router {
  private routes: Route[] = []
  private services: Service[] = []
  private config: RouterConfig
  private connectionCounts: Record<string, number> = {}
  private routerInfo: Record<string, any>

  /**
   * Create a new Router instance
   * @param config - Router configuration
   */
  constructor(config?: RouterConfig) {
    if (!microRouting) {
      throw new Error('Native module not available')
    }

    this.config = config || {}
    this.routerInfo = createRouter()
  }

  /**
   * Register a service
   * @param service - Service to register
   */
  registerService(service: Service): Record<string, any> {
    this.services.push(service)
    this.connectionCounts[service.id] = 0
    return registerService(service)
  }

  /**
   * Deregister a service
   * @param serviceId - Service ID
   */
  deregisterService(serviceId: string): Record<string, any> {
    this.services = this.services.filter((s) => s.id !== serviceId)
    delete this.connectionCounts[serviceId]
    return deregisterService(serviceId)
  }

  /**
   * Add a route
   * @param route - Route to add
   */
  addRoute(route: Route): Record<string, any> {
    this.routes.push(route)
    return addRoute(route)
  }

  /**
   * Remove a route
   * @param routeId - Route ID
   */
  removeRoute(routeId: string): Record<string, any> {
    this.routes = this.routes.filter((r) => r.id !== routeId)
    return removeRoute(routeId)
  }

  /**
   * Match a path to a route
   * @param path - Request path
   * @returns Route match result
   */
  matchPath(path: string): RouteMatchResult {
    return matchRoute(path, this.routes)
  }

  /**
   * Select service with round-robin
   * @param routeId - Route ID
   * @returns Selected service
   */
  selectServiceRoundRobin(routeId: string): Service | null {
    if (this.services.length === 0) {
      return null
    }
    return selectServiceRoundRobin(routeId, this.services)
  }

  /**
   * Select service with least connections
   * @returns Selected service
   */
  selectServiceLeastConnections(): Service | null {
    if (this.services.length === 0) {
      return null
    }
    return selectServiceLeastConnections(this.services, this.connectionCounts)
  }

  /**
   * Select service with weighted distribution
   * @returns Selected service
   */
  selectServiceWeighted(): Service | null {
    if (this.services.length === 0) {
      return null
    }
    return selectServiceWeighted(this.services)
  }

  /**
   * Check health of a service
   * @param serviceId - Service ID
   * @returns Health check result
   */
  checkHealth(serviceId: string): HealthCheckResult {
    const service = this.services.find((s) => s.id === serviceId)
    if (!service) {
      throw new Error(`Service ${serviceId} not found`)
    }
    return healthCheck(serviceId, service.host, service.port)
  }

  /**
   * Check health of all services
   * @returns Array of health check results
   */
  checkAllHealth(): HealthCheckResult[] {
    return batchHealthCheck(this.services)
  }

  /**
   * Get service statistics
   * @param serviceId - Service ID
   * @returns Service statistics
   */
  getStats(serviceId: string): ServiceStats {
    const stats: ServiceStats = {
      service_id: serviceId,
      total_requests: 0,
      active_connections: this.connectionCounts[serviceId] || 0,
      last_health_check: 0,
      health_status: true,
    }
    return getServiceStats(serviceId, stats)
  }

  /**
   * Increment connection count for service
   * @param serviceId - Service ID
   */
  incrementConnections(serviceId: string): void {
    if (!(serviceId in this.connectionCounts)) {
      this.connectionCounts[serviceId] = 0
    }
    this.connectionCounts[serviceId]++
  }

  /**
   * Decrement connection count for service
   * @param serviceId - Service ID
   */
  decrementConnections(serviceId: string): void {
    if (this.connectionCounts[serviceId] > 0) {
      this.connectionCounts[serviceId]--
    }
  }

  /**
   * Get all routes
   * @returns List of routes
   */
  getRoutes(): Route[] {
    return this.routes
  }

  /**
   * Get all services
   * @returns List of services
   */
  getServices(): Service[] {
    return this.services
  }

  /**
   * Get router configuration
   */
  getConfig(): RouterConfig {
    return this.config
  }
}

// Export all types and functions
export default {
  createRouter,
  registerService,
  deregisterService,
  addRoute,
  removeRoute,
  matchRoute,
  selectServiceRoundRobin,
  selectServiceLeastConnections,
  selectServiceWeighted,
  healthCheck,
  batchHealthCheck,
  getServiceStats,
  incrementConnections,
  decrementConnections,
  listRoutes,
  listServices,
  Router,
}
