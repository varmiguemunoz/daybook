import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function env(name: string): string | undefined {
  return process.env[name];
}

export function r2Configured(): boolean {
  return Boolean(env('R2_ACCOUNT_ID') && env('R2_ACCESS_KEY_ID') && env('R2_SECRET_ACCESS_KEY') && env('R2_BUCKET'));
}

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  const accountId = env('R2_ACCOUNT_ID') as string;
  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env('R2_ACCESS_KEY_ID') as string,
      secretAccessKey: env('R2_SECRET_ACCESS_KEY') as string,
    },
  });
  return client;
}

export function bucketName(): string {
  return env('R2_BUCKET') as string;
}

export async function presignPut(key: string, contentType: string, expiresSeconds = 900): Promise<string> {
  const command = new PutObjectCommand({ Bucket: bucketName(), Key: key, ContentType: contentType });
  return getSignedUrl(getClient(), command, { expiresIn: expiresSeconds });
}

export async function presignGet(key: string, expiresSeconds = 900): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucketName(), Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: expiresSeconds });
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key }));
}

export async function headObject(key: string): Promise<{ size: number; contentType: string } | null> {
  try {
    const response = await getClient().send(new HeadObjectCommand({ Bucket: bucketName(), Key: key }));
    return { size: response.ContentLength ?? 0, contentType: response.ContentType ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}
