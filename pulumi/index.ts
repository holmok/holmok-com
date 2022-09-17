import { CreateService } from './resources/service'
import { CreateBackendService } from './resources/backend-service'
import { CreateNetworkEndpointGroup } from './resources/network-endpoint-group'
import { CreateGlobalForwardingRule } from './resources/global-forwarding-rule'
import { CreateTargetHttpProxy } from './resources/http-target-proxy'
import { CreateURLMap } from './resources/url-map'
import { CreateStaticAddress } from './resources/address'
import { CreateNewARecord, CreateNewCNAMERecord, CreateNewDNSZone } from './resources/dns-record'

const service = CreateService()
const neg = CreateNetworkEndpointGroup(service)
const backendService = CreateBackendService(neg)
const urlMap = CreateURLMap(backendService)
const targetHttpProxy = CreateTargetHttpProxy(urlMap)
const address = CreateStaticAddress()
const forwardingRule = CreateGlobalForwardingRule(targetHttpProxy, address)
const zone = CreateNewDNSZone()
const aRecord = CreateNewARecord(address, zone, 'holmok.com')
const cname = CreateNewCNAMERecord('holmok.com', zone, 'www')

export const output = {
  zone: { id: zone.id, name: zone.zone },
  aRecord: { id: aRecord.id, name: aRecord.name },
  cname: { id: cname.id, name: cname.name },
  urlMap: { urn: urlMap.urn },
  targetHttpProxy: { urn: targetHttpProxy.urn },
  networkEndpointGroup: { urn: neg.urn },
  service: { urn: service.urn },
  backendService: { urn: backendService.urn },
  forwardingRule: { urn: forwardingRule.urn }
}
