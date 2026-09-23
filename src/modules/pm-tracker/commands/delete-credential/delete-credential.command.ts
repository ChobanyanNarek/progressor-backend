export class DeleteCredentialCommand {
  constructor(
    public readonly userId: Uuid,
    public readonly connectionId: string,
  ) {}
}
