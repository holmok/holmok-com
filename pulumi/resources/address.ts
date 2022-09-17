import { GlobalAddress } from '@pulumi/gcp/compute'

export function CreateStaticAddress (): GlobalAddress {
  return new GlobalAddress('holmok-com-loadbalancer-ip', {
    name: 'holmok-com-loadbalancer-ip',
    addressType: 'EXTERNAL',
    ipVersion: 'IPV4'
  })
}
