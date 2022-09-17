import { Service } from '@pulumi/gcp/cloudrun'
import { RegionNetworkEndpointGroup } from '@pulumi/gcp/compute'

export function CreateNetworkEndpointGroup (service: Service): RegionNetworkEndpointGroup {
  return new RegionNetworkEndpointGroup('holmok-com-app-network-endpoint', {
    cloudRun: {
      service: service.name
    },
    project: 'holmok-com',
    name: 'holmok-com-app-network-endpoint',
    region: 'https://www.googleapis.com/compute/v1/projects/holmok-com/regions/us-central1'
  }, {
    dependsOn: [service]
  })
}
