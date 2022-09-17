import { URLMap, TargetHttpProxy } from '@pulumi/gcp/compute'

export function CreateTargetHttpProxy (urlMap: URLMap): TargetHttpProxy {
  return new TargetHttpProxy('holmok-com-load-balancer-target-proxy', {
    name: 'holmok-com-load-balancer-target-proxy',
    project: 'holmok-com',
    urlMap: urlMap.selfLink
  }, { dependsOn: [urlMap] })
}
