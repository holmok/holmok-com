import { Account } from '@pulumi/gcp/serviceaccount'
import { Bucket, BucketIAMMember } from '@pulumi/gcp/storage'

export function AddBucketAccess (name: string, bucket: Bucket, sa: Account, role: string): BucketIAMMember {
  return new BucketIAMMember(`${name}-bucket-access`, {
    bucket: bucket.name,
    member: sa.email,
    role
  })
}

export function CreateBucket (name: string): { bucket: Bucket, member: BucketIAMMember } {
  const bucket = new Bucket(`${name}-bucket`, {
    name: name,
    location: 'US-CENTRAL1',
    publicAccessPrevention: 'inherited',
    uniformBucketLevelAccess: true,
    cors: [{
      maxAgeSeconds: 3600,
      methods: ['GET', 'HEAD'],
      origins: ['https://www.holmok.com', 'https://holmok.com', 'https://static.holmok.com']
    }],
    website: {
      mainPageSuffix: 'index-static.html',
      notFoundPage: '404-static.html'
    }
  })

  const member = new BucketIAMMember(`${name}-bucket-all-users`, {
    bucket: bucket.name,
    role: 'roles/storage.objectViewer',
    member: 'allUsers'
  })

  return { bucket, member }
}
