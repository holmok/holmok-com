import { Bucket } from '@pulumi/gcp/storage'

export function CreateBucket (name: string): Bucket {
  return new Bucket(`${name}-bucket`, {
    name: name,
    location: 'US',
    forceDestroy: true,
    uniformBucketLevelAccess: true,
    cors: [{
      maxAgeSeconds: 3600,
      methods: ['GET', 'HEAD'],
      origins: ['www.holmok.com', 'holmok.com', 'static.holmok.com']
    }],
    website: {
      mainPageSuffix: 'index-static.html',
      notFoundPage: '404-static.html'
    }
  })
}
