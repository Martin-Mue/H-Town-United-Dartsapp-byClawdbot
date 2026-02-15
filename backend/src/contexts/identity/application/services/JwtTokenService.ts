import jwt from '@fastify/jwt';

/** Provides JWT generation and verification operations for authenticated sessions. */
export class JwtTokenService {
  constructor(private readonly secret: string) {}

  /** Signs an access token for authenticated user identity. */
  public signAccessToken(subjectUserId: string): string {
    const signer = jwt({ secret: this.secret });
    return signer.sign({ sub: subjectUserId, scope: 'platform:user' }, { expiresIn: '12h' });
  }
}
