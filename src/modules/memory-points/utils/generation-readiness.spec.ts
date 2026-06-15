import { describe, expect, it } from '@jest/globals';

import { collectMissingGenerationFields } from './generation-readiness.ts';

describe('collectMissingGenerationFields', () => {
  const complete = {
    sourcePhotoUrl: 'photo.jpg',
    sourceAudioUrl: 'audio.mp3',
    title: 'A title',
    description: 'A description',
  };

  it('returns an empty array when every field is present', () => {
    expect(collectMissingGenerationFields(complete)).toEqual([]);
  });

  it('lists every missing field in a stable order', () => {
    expect(
      collectMissingGenerationFields({
        sourcePhotoUrl: null,
        sourceAudioUrl: null,
        title: null,
        description: null,
      }),
    ).toEqual(['sourcePhotoUrl', 'sourceAudioUrl', 'title', 'description']);
  });

  it.each([['sourcePhotoUrl'], ['sourceAudioUrl'], ['title'], ['description']])(
    'flags a single missing %s',
    (field) => {
      expect(
        collectMissingGenerationFields({ ...complete, [field]: null }),
      ).toEqual([field]);
    },
  );

  it('treats empty strings as missing', () => {
    expect(collectMissingGenerationFields({ ...complete, title: '' })).toEqual([
      'title',
    ]);
  });
});
