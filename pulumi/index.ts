import { CreateService } from './resources/service'
import { CreateBackendService } from './resources/backend-service'
import { CreateNetworkEndpointGroup } from './resources/network-endpoint-group'
import { CreateGlobalForwardingRule } from './resources/global-forwarding-rule'
import { CreateTargetHttpProxy } from './resources/http-target-proxy'
import { CreateURLMap } from './resources/url-map'
import { CreateStaticAddress } from './resources/address'
import { CreateServiceAccount } from './resources/service-account'
import { CreateNewARecord, CreateNewCNAMERecord, CreateNewDNSZone } from './resources/dns-record'
import { AddBucketAccess, CreateBucket } from './resources/buckets'
import { CreatePostgresInstance, CreatePostgresUser } from './resources/postgres'
import { Config } from '@pulumi/pulumi'

const config = new Config()

const pgInstance = CreatePostgresInstance()
const pgUser = CreatePostgresUser(pgInstance)

const { sa, access } = CreateServiceAccount('holmok-com-cloudrun')
const service = CreateService(config, sa)
const neg = CreateNetworkEndpointGroup(service)
const backendService = CreateBackendService(neg)
const urlMap = CreateURLMap(backendService)
const targetHttpProxy = CreateTargetHttpProxy(urlMap)
const address = CreateStaticAddress()
const forwardingRule = CreateGlobalForwardingRule(targetHttpProxy, address)
const zone = CreateNewDNSZone()
const aRecord = CreateNewARecord(address, zone, 'holmok.com')
const siteCname = CreateNewCNAMERecord('holmok.com', zone, 'www')

const staticCname = CreateNewCNAMERecord('c.storage.googleapis.com', zone, 'static')
const { bucket, member } = CreateBucket('static.holmok.com')
const accessAdmin = AddBucketAccess('cloud-run-access-admin', bucket, sa, 'roles/storage.objectAdmin')
const accessLegacy = AddBucketAccess('cloud-run-access-legacy', bucket, sa, 'roles/storage.legacyBucketOwner')

export const output = {
  pgInstance: { urn: pgInstance.urn },
  pgUser: { urn: pgUser.urn },
  zone: { id: zone.id, name: zone.zone },
  aRecord: { id: aRecord.id, name: aRecord.name },
  siteCname: { id: siteCname.id, name: siteCname.name },
  urlMap: { urn: urlMap.urn },
  targetHttpProxy: { urn: targetHttpProxy.urn },
  networkEndpointGroup: { urn: neg.urn },
  service: { urn: service.urn },
  backendService: { urn: backendService.urn },
  forwardingRule: { urn: forwardingRule.urn },
  bucket: { urn: bucket.urn, name: bucket.name },
  member: { urn: member.urn },
  staticCname: { id: staticCname.id, name: staticCname.name },
  sa: { urn: sa.urn, email: sa.email },
  accessLegacy: { urn: accessLegacy.urn },
  accessAdmin: { urn: accessAdmin.urn },
  saAccess: { urn: access.urn }
}
