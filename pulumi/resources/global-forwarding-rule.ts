import { GlobalAddress, GlobalForwardingRule, TargetHttpProxy } from '@pulumi/gcp/compute'

export function CreateGlobalForwardingRule (target: TargetHttpProxy, address: GlobalAddress): GlobalForwardingRule {
  return new GlobalForwardingRule('holmok-com-load-balancer-forwarding-rule', {
    ipAddress: address.address,
    ipProtocol: 'TCP',
    loadBalancingScheme: 'EXTERNAL_MANAGED',
    name: 'holmok-com-load-balancer-forwarding-rule',
    portRange: '80',
    project: 'holmok-com',
    target: target.selfLink
  }, {
    dependsOn: [target]
  })
}
