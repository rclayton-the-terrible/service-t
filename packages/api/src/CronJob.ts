export interface CronJob {
  name: string,
  cronTime: string,
  timeZone: string,
  onTick: () => void,
}
