export class BleManager {
  startDeviceScan = jest.fn();
  stopDeviceScan = jest.fn();
  onStateChange = jest.fn(() => ({ remove: jest.fn() }));
  destroy = jest.fn();
}

export type Device = any;

export enum State {
  PoweredOn = "PoweredOn",
  PoweredOff = "PoweredOff",
  Unknown = "Unknown",
}
