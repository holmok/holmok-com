import { GlobalAddress } from '@pulumi/gcp/compute'
import { Record, Zone } from '@pulumi/cloudflare'

export function CreateNewARecord (address: GlobalAddress, zone: Zone, name:string): Record {
  return new Record(`${name}-a-record`, {
    name,
    proxied: true,
    ttl: 1,
    type: 'A',
    value: address.address,
    zoneId: zone.id
  }, { dependsOn: [address, zone] })
}


export function CreateNewCNAMERecord (value:string, zone: Zone, name:string): Record {
  return new Record(`${name}-cname-record`, {
    name,
    proxied: true,
    ttl: 1,
    type: 'CNAME',
    value,
    zoneId: zone.id
  }, { dependsOn: [zone] })
}

export function CreateNewDNSZone (): Zone {
  return new Zone('holmok.com-zone', {
    accountId: '02c6a1da49c751ba9b9338b552ea61d3',
    plan: 'free',
    zone: 'holmok.com'
  })
}
