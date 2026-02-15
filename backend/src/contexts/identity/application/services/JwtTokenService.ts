import jwt from 'jsonwebtoken';

/** Provides JWT generation and verification operations for authenticated sessions. */
export class JwtTokenService {
  constructor(private readonly secret: string) {}

  /** Signs an access token for authenticated user identity. */
  public signAccessToken(subjectUserId: string): string {
    return jwt.sign({ scope: 'platform:user' }, this.secret, {
      subject: subjectUserId,
      expiresIn: '12h',
      issuer: 'htown-united-platform',
      audience: 'htown-united-mobile',
    });
  }
}
