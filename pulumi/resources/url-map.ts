import { BackendService, URLMap } from '@pulumi/gcp/compute'

export function CreateURLMap (service: BackendService): URLMap {
  return new URLMap('holmok-com-load-balancer',
    {
      defaultService: service.selfLink,
      hostRules: [{
        hosts: ['holmok.io'],
        pathMatcher: 'path-matcher-1'
      }],
      name: 'holmok-com-load-balancer',
      pathMatchers: [{
        defaultService: service.selfLink,
        name: 'path-matcher-1'
      }],
      project: 'holmok-com'
    },
    { dependsOn: [service] }
  )
}
