import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const FREE_LOCATIONS = [
  { code: 'US', country: 'United States', region: 'North America' },
  { code: 'CA', country: 'Canada', region: 'North America' },
  { code: 'GB', country: 'United Kingdom', region: 'Europe' },
  { code: 'HK', country: 'Hong Kong', region: 'Asia Pacific' },
  { code: 'FR', country: 'France', region: 'Europe' },
  { code: 'DE', country: 'Germany', region: 'Europe' },
  { code: 'NL', country: 'Netherlands', region: 'Europe' },
  { code: 'CH', country: 'Switzerland', region: 'Europe' },
  { code: 'NO', country: 'Norway', region: 'Europe' },
  { code: 'RO', country: 'Romania', region: 'Europe' },
];

export interface VpnStatus {
  available: boolean;
  connected: boolean;
  loggedIn: boolean;
  location?: string;
  message?: string;
}

export class VpnManager {
  public getFreeLocations() {
    return FREE_LOCATIONS;
  }

  private executableCandidates(): Array<{ command: string; prefix: string[] }> {
    if (process.platform === 'darwin') {
      return [
        { command: '/Applications/Windscribe.app/Contents/MacOS/windscribe-cli', prefix: [] },
        { command: 'windscribe-cli', prefix: [] },
      ];
    }
    if (process.platform === 'win32') {
      return [
        { command: 'C:\\Program Files\\Windscribe\\windscribe-cli.exe', prefix: [] },
        { command: 'windscribe-cli.exe', prefix: [] },
      ];
    }
    return [
      { command: 'windscribe-cli', prefix: [] },
      { command: 'windscribe', prefix: [] },
    ];
  }

  private async run(args: string[]): Promise<string> {
    let lastError: unknown;
    for (const candidate of this.executableCandidates()) {
      try {
        const result = await execFileAsync(candidate.command, [...candidate.prefix, ...args], {
          timeout: 30_000,
          maxBuffer: 1024 * 1024,
          windowsHide: true,
        });
        return `${result.stdout || ''}\n${result.stderr || ''}`.trim();
      } catch (error: any) {
        lastError = error;
        if (error?.code !== 'ENOENT') {
          const detail = `${error?.stdout || ''}\n${error?.stderr || ''}`.trim();
          throw new Error(detail || error?.message || 'Windscribe command failed.');
        }
      }
    }
    throw new Error('Windscribe is not installed. Install the official app and sign in to a free account to connect.');
  }

  public async getStatus(): Promise<VpnStatus> {
    try {
      const output = await this.run(['status']);
      const connection = output.match(/Connect state:\s*(Connected|Disconnected)(?::\s*(.+))?/i);
      const loggedIn = /Login state:\s*Logged in/i.test(output);
      return {
        available: true,
        connected: connection?.[1]?.toLowerCase() === 'connected',
        loggedIn,
        location: connection?.[2]?.trim(),
        message: !loggedIn ? 'Sign in to Windscribe to connect.' : undefined,
      };
    } catch (error: any) {
      const message = error?.message || 'Could not read Windscribe status.';
      return {
        available: !message.includes('not installed'),
        connected: false,
        loggedIn: false,
        message,
      };
    }
  }

  public async connect(countryCode: string): Promise<VpnStatus> {
    const location = FREE_LOCATIONS.find((item) => item.code === countryCode);
    if (!location) throw new Error('Choose a supported free VPN country.');
    await this.run(['connect', '-n', location.code]);
    return this.getStatus();
  }

  public async disconnect(): Promise<VpnStatus> {
    await this.run(['disconnect', '-n']);
    return this.getStatus();
  }
}
