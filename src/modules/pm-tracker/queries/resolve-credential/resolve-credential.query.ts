export class ResolveCredentialQuery {
  constructor(
    public readonly userId: Uuid,
    public readonly connectionId: string,
  ) {}
}
