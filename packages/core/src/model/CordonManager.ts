export interface CordonManager {
  isCordoned(): boolean,
  cordon(): void,
  uncordon(): void,
}
