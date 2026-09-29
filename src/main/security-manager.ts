import { app, BrowserWindow, Certificate, Event, WebContents } from 'electron';
import { CertificateInfo, SiteSecurityInfo, CertificateErrorDetails } from '../shared/types';

export class SecurityManager {
  private certCache: Map<string, CertificateInfo> = new Map(); // key: hostname
  private certErrors: Map<string, CertificateErrorDetails> = new Map(); // key: origin or url
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow?: BrowserWindow | null) {
    this.mainWindow = mainWindow || null;
    this.setupGlobalCertErrorListener();
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  private setupGlobalCertErrorListener() {
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      // NEVER silently bypass certificate validation errors
      event.preventDefault();
      callback(false);

      this.handleCertificateError(url, error, certificate);
    });
  }

  public attachToWebContents(wc: WebContents) {
    wc.on('certificate-error', (event, url, error, certificate, callback) => {
      // Strictly prevent insecure bypass
      event.preventDefault();
      callback(false);

      this.handleCertificateError(url, error, certificate);
    });
  }

  public attachToSession(sess: Electron.Session) {
    if (!sess) return;

    sess.setCertificateVerifyProc((request, callback) => {
      const hostname = request.hostname?.toLowerCase();
      if (hostname && request.certificate) {
        const certInfo = this.extractCertificateInfo(request.certificate);
        this.certCache.set(hostname, certInfo);
      }

      // -3 instructs Chromium to use its standard verification result
      // without arbitrarily trusting or discarding
      callback(-3);
    });
  }

  public extractCertificateInfo(cert: Certificate): CertificateInfo {
    return {
      subjectName: cert.subjectName || '',
      issuerName: cert.issuerName || '',
      validFrom: (cert.validStart || 0) * 1000,
      validTo: (cert.validExpiry || 0) * 1000,
      fingerprint: cert.fingerprint || '',
      serialNumber: cert.serialNumber || '',
    };
  }

  public handleCertificateError(url: string, error: string, cert?: Certificate): CertificateErrorDetails {
    const certInfo = cert ? this.extractCertificateInfo(cert) : undefined;
    const errorDescription = this.explainCertificateError(error);

    const details: CertificateErrorDetails = {
      url,
      error,
      errorDescription,
      certificate: certInfo,
    };

    let origin = url;
    try {
      origin = new URL(url).origin;
    } catch {}

    this.certErrors.set(origin, details);
    this.certErrors.set(url, details);

    console.warn(`[NEXUS Security] Certificate validation rejected for ${url}: ${error} (${errorDescription})`);
    return details;
  }

  public explainCertificateError(errorCode: string): string {
    switch (errorCode) {
      case 'net::ERR_CERT_AUTHORITY_INVALID':
        return 'The certificate authority that signed this certificate is untrusted, self-signed, or missing from the system trust store.';
      case 'net::ERR_CERT_COMMON_NAME_INVALID':
        return 'The host name in the certificate does not match the actual website domain you are connecting to.';
      case 'net::ERR_CERT_DATE_INVALID':
        return 'The certificate has expired or its activation date is in the future. Check your system clock.';
      case 'net::ERR_CERT_CONTAINS_ERRORS':
        return 'The server certificate contains structural errors or invalid cryptographic fields.';
      case 'net::ERR_CERT_REVOKED':
        return 'This certificate has been revoked by the issuing Certificate Authority and is no longer safe to use.';
      case 'net::ERR_CERT_WEAK_SIGNATURE_ALGORITHM':
        return 'The certificate is signed using an obsolete or insecure hashing algorithm (e.g. SHA-1 or MD5).';
      default:
        return `A security verification error occurred (${errorCode}). The connection was halted to protect your privacy and credentials.`;
    }
  }

  public getSiteSecurityInfo(urlInput: string, blockedTrackersCount: number = 0): SiteSecurityInfo {
    const trimmed = (urlInput || '').trim();
    if (!trimmed || trimmed === 'nexus://newtab' || trimmed.startsWith('nexus://')) {
      return {
        url: trimmed,
        origin: 'NEXUS Internal',
        isSecure: true,
        status: 'secure',
        blockedTrackersCount: 0,
      };
    }

    let origin = trimmed;
    let hostname = trimmed;
    try {
      const parsed = new URL(trimmed);
      origin = parsed.origin;
      hostname = parsed.hostname.toLowerCase();
    } catch {}

    // Check if there was a certificate error on this origin or URL
    const certError = this.certErrors.get(origin) || this.certErrors.get(trimmed);
    if (certError) {
      return {
        url: trimmed,
        origin,
        isSecure: false,
        status: 'warning',
        certificate: certError.certificate,
        error: `${certError.error}: ${certError.errorDescription}`,
        blockedTrackersCount,
      };
    }

    const isHttps = trimmed.startsWith('https://');
    const cachedCert = this.certCache.get(hostname);

    if (isHttps) {
      return {
        url: trimmed,
        origin,
        isSecure: true,
        status: 'secure',
        certificate: cachedCert,
        blockedTrackersCount,
      };
    } else {
      return {
        url: trimmed,
        origin,
        isSecure: false,
        status: 'insecure',
        error: 'Connection is not encrypted (plain HTTP). Sensitive data could be intercepted on public networks.',
        blockedTrackersCount,
      };
    }
  }

  public clearCertErrors() {
    this.certErrors.clear();
  }
}
