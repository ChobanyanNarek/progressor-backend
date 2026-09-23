export class SaveCredentialCommand {
  constructor(
    public readonly userId: Uuid,
    public readonly connectionId: string,
    public readonly provider: string,
    public readonly secret: string,
  ) {}
}
