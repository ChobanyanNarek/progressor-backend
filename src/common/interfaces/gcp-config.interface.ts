export interface IGcpConfig {
  projectId: string;
  bucket: string;
  location: string;
  queue: string;
  targetUrl: string;
  invokerServiceAccount: string;
}
