import type { AbstractEntity } from '../../../common/abstract.entity.ts';
import { AbstractDto } from '../../../common/dto/abstract.dto.ts';
import { StringField } from '../../../decorators/field.decorators.ts';

interface ICredentialShape {
  connectionId: string;
  provider: string;
}

/** A stored credential as the client sees it: which connection it's for, never the secret. */
export class PmTrackerCredentialDto extends AbstractDto {
  @StringField()
  connectionId!: string;

  @StringField()
  provider!: string;

  constructor(entity: AbstractEntity & ICredentialShape) {
    super(entity);
    this.connectionId = entity.connectionId;
    this.provider = entity.provider;
  }
}
