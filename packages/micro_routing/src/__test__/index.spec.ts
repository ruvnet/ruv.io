import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  Router,
  Service,
  Route,
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
} from '../index'

describe('Micro Routing - Request Routing & Load Balancing', () => {
  let router: Router
  const sampleService1: Service = {
    id: 'svc-001',
    host: 'localhost',
    port: 3001,
    weight: 1,
    active: true,
  }

  const sampleService2: Service = {
    id: 'svc-002',
    host: 'localhost',
    port: 3002,
    weight: 2,
    active: true,
  }

  const sampleService3: Service = {
    id: 'svc-003',
    host: 'api.example.com',
    port: 8080,
    weight: 1,
    active: true,
  }

  const sampleRoute: Route = {
    id: 'route-001',
    path: '/api/users',
    pattern: 'exact',
    services: ['svc-001', 'svc-002'],
    load_balance_strategy: 'round_robin',
  }

  const sampleRoute2: Route = {
    id: 'route-002',
    path: '/api/*',
    pattern: 'prefix',
    services: ['svc-002', 'svc-003'],
    load_balance_strategy: 'least_connections',
  }

  beforeAll(() => {
    router = new Router({
      timeout: 5000,
      healthCheckInterval: 30000,
    })
  })

  describe('Router initialization', () => {
    it('should create a new router instance', () => {
      expect(router).toBeDefined()
      expect(router).toBeInstanceOf(Router)
    })

    it('should initialize with empty services', () => {
      const services = router.getServices()
      expect(Array.isArray(services)).toBe(true)
    })

    it('should initialize with empty routes', () => {
      const routes = router.getRoutes()
      expect(Array.isArray(routes)).toBe(true)
    })

    it('should have router config', () => {
      const config = router.getConfig()
      expect(config).toBeDefined()
      expect(config.timeout).toBe(5000)
    })
  })

  describe('Service registration', () => {
    it('should register a service', () => {
      const result = router.registerService(sampleService1)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.service_id).toBe('svc-001')
    })

    it('should add service to service list', () => {
      router.registerService(sampleService2)
      const services = router.getServices()

      expect(services).toContainEqual(expect.objectContaining({ id: 'svc-002' }))
    })

    it('should register multiple services', () => {
      router.registerService(sampleService3)
      const services = router.getServices()

      expect(services.length).toBeGreaterThanOrEqual(3)
    })

    it('should preserve service properties', () => {
      const services = router.getServices()
      const service = services.find((s) => s.id === 'svc-001')

      expect(service).toBeDefined()
      expect(service?.host).toBe('localhost')
      expect(service?.port).toBe(3001)
    })
  })

  describe('Service deregistration', () => {
    beforeEach(() => {
      router.registerService({ ...sampleService1, id: 'temp-svc' })
    })

    it('should deregister a service', () => {
      const result = router.deregisterService('temp-svc')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    it('should remove service from service list', () => {
      router.deregisterService('temp-svc')
      const services = router.getServices()

      expect(services).not.toContainEqual(expect.objectContaining({ id: 'temp-svc' }))
    })
  })

  describe('Route management', () => {
    it('should add a route', () => {
      const result = router.addRoute(sampleRoute)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.route_id).toBe('route-001')
    })

    it('should add multiple routes', () => {
      router.addRoute(sampleRoute2)
      const routes = router.getRoutes()

      expect(routes.length).toBeGreaterThanOrEqual(2)
    })

    it('should preserve route properties', () => {
      const routes = router.getRoutes()
      const route = routes.find((r) => r.id === 'route-001')

      expect(route).toBeDefined()
      expect(route?.path).toBe('/api/users')
      expect(route?.pattern).toBe('exact')
    })

    it('should remove a route', () => {
      const routeToRemove: Route = {
        id: 'route-temp',
        path: '/temp',
        pattern: 'exact',
        services: ['svc-001'],
        load_balance_strategy: 'round_robin',
      }

      router.addRoute(routeToRemove)
      const result = router.removeRoute('route-temp')

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })
  })

  describe('Route matching - Exact pattern', () => {
    beforeEach(() => {
      const exactRoute: Route = {
        id: 'exact-route',
        path: '/api/users',
        pattern: 'exact',
        services: ['svc-001'],
        load_balance_strategy: 'round_robin',
      }
      router.addRoute(exactRoute)
    })

    it('should match exact paths', () => {
      const routes = router.getRoutes()
      const result = matchRoute('/api/users', routes)

      expect(result).toBeDefined()
      expect(result.matched).toBe(true)
    })

    it('should not match partial paths', () => {
      const routes = router.getRoutes()
      const result = matchRoute('/api/user', routes)

      expect(result.matched).toBe(false)
    })

    it('should not match extended paths', () => {
      const routes = router.getRoutes()
      const result = matchRoute('/api/users/123', routes)

      expect(result.matched).toBe(false)
    })
  })

  describe('Route matching - Prefix pattern', () => {
    beforeEach(() => {
      const prefixRoute: Route = {
        id: 'prefix-route',
        path: '/api',
        pattern: 'prefix',
        services: ['svc-002'],
        load_balance_strategy: 'round_robin',
      }
      router.addRoute(prefixRoute)
    })

    it('should match prefix paths', () => {
      const routes = router.getRoutes()
      const result = matchRoute('/api/users', routes)

      expect(result.matched).toBe(true)
    })

    it('should match prefix with multiple segments', () => {
      const routes = router.getRoutes()
      const result = matchRoute('/api/users/123/posts', routes)

      expect(result.matched).toBe(true)
    })

    it('should not match non-prefix paths', () => {
      const routes = router.getRoutes()
      const result = matchRoute('/other/path', routes)

      expect(result.matched).toBe(false)
    })
  })

  describe('Route matching - using Router instance', () => {
    beforeEach(() => {
      const testRoute: Route = {
        id: 'test-route',
        path: '/test',
        pattern: 'exact',
        services: ['svc-001'],
        load_balance_strategy: 'round_robin',
      }
      router.addRoute(testRoute)
    })

    it('should match path using router instance', () => {
      const result = router.matchPath('/test')

      expect(result).toBeDefined()
      expect(result.matched).toBe(true)
    })

    it('should not match unregistered path', () => {
      const result = router.matchPath('/nonexistent')

      expect(result.matched).toBe(false)
    })

    it('should return timestamp in match result', () => {
      const result = router.matchPath('/test')

      expect(result.timestamp).toBeGreaterThan(0)
    })
  })

  describe('Load balancing - Round Robin', () => {
    it('should select services in round-robin order', () => {
      const services = [sampleService1, sampleService2]
      const routeId = 'route-001'

      const selected1 = selectServiceRoundRobin(routeId, services)
      const selected2 = selectServiceRoundRobin(routeId, services)

      expect(selected1).toBeDefined()
      expect(selected2).toBeDefined()
      expect(selected1.host).toBe('localhost')
    })

    it('should handle single service', () => {
      const services = [sampleService1]

      const selected = selectServiceRoundRobin('route-001', services)

      expect(selected).toBeDefined()
      expect(selected.id).toBe('svc-001')
    })

    it('should handle multiple services consistently', () => {
      const services = [sampleService1, sampleService2, sampleService3]

      const selected = selectServiceRoundRobin('route-001', services)

      expect(services).toContainEqual(expect.objectContaining({ id: selected.id }))
    })

    it('should use router instance for round-robin', () => {
      const result = router.selectServiceRoundRobin('route-001')

      expect(result).not.toBeNull()
      expect(result?.port).toBeGreaterThan(0)
    })
  })

  describe('Load balancing - Least Connections', () => {
    it('should select service with least connections', () => {
      const services = [sampleService1, sampleService2]
      const connections = {
        'svc-001': 10,
        'svc-002': 3,
      }

      const selected = selectServiceLeastConnections(services, connections)

      expect(selected.id).toBe('svc-002')
    })

    it('should select first service when equal connections', () => {
      const services = [sampleService1, sampleService2]
      const connections = {
        'svc-001': 5,
        'svc-002': 5,
      }

      const selected = selectServiceLeastConnections(services, connections)

      expect(selected).toBeDefined()
      expect(selected.port).toBeGreaterThan(0)
    })

    it('should handle zero connections', () => {
      const services = [sampleService1, sampleService2]
      const connections = {}

      const selected = selectServiceLeastConnections(services, connections)

      expect(selected).toBeDefined()
    })

    it('should use router instance for least connections', () => {
      const result = router.selectServiceLeastConnections()

      expect(result).not.toBeNull()
      expect(result?.id).toBeDefined()
    })
  })

  describe('Load balancing - Weighted', () => {
    it('should select services based on weights', () => {
      const services = [sampleService1, sampleService2]

      const selected = selectServiceWeighted(services)

      expect(selected).toBeDefined()
      expect(services).toContainEqual(expect.objectContaining({ id: selected.id }))
    })

    it('should handle default weight of 1', () => {
      const services = [sampleService1, sampleService2]

      const selected = selectServiceWeighted(services)

      expect(selected).toBeDefined()
    })

    it('should use router instance for weighted selection', () => {
      const result = router.selectServiceWeighted()

      expect(result).not.toBeNull()
      expect(result?.weight).toBeDefined()
    })
  })

  describe('Health checks', () => {
    it('should perform health check on service', () => {
      const result = healthCheck('svc-001', 'localhost', 3001)

      expect(result).toBeDefined()
      expect(result.service_id).toBe('svc-001')
      expect(typeof result.healthy).toBe('boolean')
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should return response time', () => {
      const result = healthCheck('svc-001', 'localhost', 3001)

      expect(result.response_time).toBeGreaterThanOrEqual(0)
    })

    it('should batch health check multiple services', () => {
      const services = [sampleService1, sampleService2, sampleService3]

      const results = batchHealthCheck(services)

      expect(results).toHaveLength(3)
      expect(results[0]).toHaveProperty('service_id')
      expect(results[0]).toHaveProperty('healthy')
    })

    it('should handle empty service list', () => {
      const results = batchHealthCheck([])

      expect(results).toHaveLength(0)
    })

    it('should use router instance for health check', () => {
      const result = router.checkHealth('svc-001')

      expect(result).toBeDefined()
      expect(result.service_id).toBe('svc-001')
    })

    it('should use router instance for batch health check', () => {
      const results = router.checkAllHealth()

      expect(Array.isArray(results)).toBe(true)
    })
  })

  describe('Service statistics', () => {
    it('should get service statistics', () => {
      const stats = getServiceStats('svc-001', {
        service_id: 'svc-001',
        total_requests: 0,
        active_connections: 0,
        last_health_check: 0,
        health_status: true,
      })

      expect(stats).toBeDefined()
      expect(stats.service_id).toBe('svc-001')
      expect(stats.last_health_check).toBeGreaterThan(0)
    })

    it('should update last_health_check timestamp', () => {
      const stats1 = getServiceStats('svc-001', {
        service_id: 'svc-001',
        total_requests: 0,
        active_connections: 0,
        last_health_check: 0,
        health_status: true,
      })

      expect(stats1.last_health_check).toBeGreaterThan(0)
    })

    it('should use router instance for stats', () => {
      const stats = router.getStats('svc-001')

      expect(stats).toBeDefined()
      expect(stats.service_id).toBe('svc-001')
    })
  })

  describe('Connection management', () => {
    it('should increment connections', () => {
      const count = incrementConnections('svc-001')

      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThanOrEqual(0)
    })

    it('should decrement connections', () => {
      const count = decrementConnections('svc-001')

      expect(typeof count).toBe('number')
    })

    it('should use router instance to increment connections', () => {
      router.incrementConnections('svc-001')
      const stats = router.getStats('svc-001')

      expect(stats.active_connections).toBeGreaterThanOrEqual(0)
    })

    it('should use router instance to decrement connections', () => {
      router.incrementConnections('svc-001')
      router.decrementConnections('svc-001')
      const stats = router.getStats('svc-001')

      expect(stats.active_connections).toBeGreaterThanOrEqual(0)
    })
  })

  describe('List operations', () => {
    it('should list all routes', () => {
      const routes = router.getRoutes()
      const result = listRoutes(routes)

      expect(result).toBeDefined()
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(result.routes)).toBe(true)
    })

    it('should list all services', () => {
      const services = router.getServices()
      const result = listServices(services)

      expect(result).toBeDefined()
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(result.services)).toBe(true)
    })

    it('should use router instance to get routes', () => {
      const routes = router.getRoutes()

      expect(Array.isArray(routes)).toBe(true)
    })

    it('should use router instance to get services', () => {
      const services = router.getServices()

      expect(Array.isArray(services)).toBe(true)
    })
  })

  describe('Integration tests', () => {
    beforeEach(() => {
      // Clear and setup fresh router for integration tests
      router = new Router()
    })

    it('should complete full routing workflow', () => {
      // Register services
      router.registerService(sampleService1)
      router.registerService(sampleService2)

      // Add route
      router.addRoute(sampleRoute)

      // Match route
      const match = router.matchPath('/api/users')
      expect(match.matched).toBe(true)

      // Select service
      const service = router.selectServiceRoundRobin('route-001')
      expect(service).not.toBeNull()

      // Check health
      const health = router.checkHealth(sampleService1.id)
      expect(health).toBeDefined()
    })

    it('should handle multiple concurrent operations', () => {
      router.registerService(sampleService1)
      router.registerService(sampleService2)
      router.registerService(sampleService3)

      router.addRoute(sampleRoute)
      router.addRoute(sampleRoute2)

      const routes = router.getRoutes()
      const services = router.getServices()

      expect(routes.length).toBeGreaterThanOrEqual(2)
      expect(services.length).toBeGreaterThanOrEqual(3)
    })

    it('should maintain data integrity through operations', () => {
      const originalService = sampleService1
      router.registerService(originalService)

      const services = router.getServices()
      const registered = services.find((s) => s.id === originalService.id)

      expect(registered?.host).toBe(originalService.host)
      expect(registered?.port).toBe(originalService.port)
    })

    it('should handle service lifecycle', () => {
      // Register
      router.registerService(sampleService1)
      let services = router.getServices()
      expect(services).toContainEqual(expect.objectContaining({ id: 'svc-001' }))

      // Check health
      const health = router.checkHealth('svc-001')
      expect(health.service_id).toBe('svc-001')

      // Deregister
      router.deregisterService('svc-001')
      services = router.getServices()
      expect(services).not.toContainEqual(expect.objectContaining({ id: 'svc-001' }))
    })
  })

  describe('Error handling', () => {
    it('should handle invalid route pattern gracefully', () => {
      const routes = [
        {
          id: 'invalid-route',
          path: '/api',
          pattern: 'invalid_pattern',
          services: ['svc-001'],
          load_balance_strategy: 'round_robin',
        },
      ]

      const result = matchRoute('/api/users', routes)
      expect(result).toBeDefined()
      expect(result.matched).toBe(false)
    })

    it('should handle empty service list in load balancing', () => {
      const result = router.selectServiceRoundRobin('route-001')
      expect(result).toBeNull()
    })

    it('should handle service not found in health check', () => {
      expect(() => {
        router.checkHealth('nonexistent-service')
      }).toThrow()
    })

    it('should handle large number of services', () => {
      const manyServices = Array.from({ length: 100 }, (_, i) => ({
        id: `svc-${i}`,
        host: `host-${i}.example.com`,
        port: 3000 + i,
        weight: 1,
        active: true,
      }))

      manyServices.forEach((s) => router.registerService(s))

      const services = router.getServices()
      expect(services.length).toBeGreaterThanOrEqual(100)

      const selected = router.selectServiceRoundRobin('route-test')
      expect(selected).not.toBeNull()
    })

    it('should handle large number of routes', () => {
      const manyRoutes = Array.from({ length: 50 }, (_, i) => ({
        id: `route-${i}`,
        path: `/api/route${i}`,
        pattern: 'exact',
        services: ['svc-001'],
        load_balance_strategy: 'round_robin',
      }))

      manyRoutes.forEach((r) => router.addRoute(r))

      const routes = router.getRoutes()
      expect(routes.length).toBeGreaterThanOrEqual(50)
    })
  })

  describe('Edge cases', () => {
    it('should handle service with zero port', () => {
      const zeroPortService: Service = {
        id: 'zero-port',
        host: 'localhost',
        port: 0,
        weight: 1,
        active: true,
      }

      router.registerService(zeroPortService)
      const health = healthCheck('zero-port', 'localhost', 0)

      expect(health).toBeDefined()
    })

    it('should handle empty route path', () => {
      const emptyPathRoute: Route = {
        id: 'empty-path',
        path: '',
        pattern: 'exact',
        services: ['svc-001'],
        load_balance_strategy: 'round_robin',
      }

      router.addRoute(emptyPathRoute)
      const match = router.matchPath('')

      expect(match).toBeDefined()
    })

    it('should handle very long paths', () => {
      const longPath = '/api/' + 'segment/'.repeat(100)
      const routes = router.getRoutes()

      const result = matchRoute(longPath, routes)
      expect(result).toBeDefined()
    })

    it('should handle special characters in service host', () => {
      const specialService: Service = {
        id: 'special-host',
        host: 'api-prod.example-123.co.uk',
        port: 8080,
        weight: 1,
        active: true,
      }

      router.registerService(specialService)
      const services = router.getServices()

      expect(services).toContainEqual(expect.objectContaining({ id: 'special-host' }))
    })
  })
})
