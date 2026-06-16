import { describe, expect, it } from '@jest/globals';

import { collectMissingGenerationFields } from './generation-readiness.ts';

describe('collectMissingGenerationFields', () => {
  const complete = {
    sourcePhotoUrl: 'photo.jpg',
    sourceAudioUrl: 'audio.mp3',
    title: 'A title',
    description: 'A description',
  };

  it('returns an empty array when title, photo and a script are present', () => {
    expect(collectMissingGenerationFields(complete)).toEqual([]);
  });

  it('is ready with a description but no audio (D-ID TTS)', () => {
    expect(
      collectMissingGenerationFields({ ...complete, sourceAudioUrl: null }),
    ).toEqual([]);
  });

  it('is ready with audio but no description', () => {
    expect(
      collectMissingGenerationFields({ ...complete, description: null }),
    ).toEqual([]);
  });

  it('flags descriptionOrAudio when neither script source exists', () => {
    expect(
      collectMissingGenerationFields({
        ...complete,
        description: null,
        sourceAudioUrl: null,
      }),
    ).toEqual(['descriptionOrAudio']);
  });

  it('lists every missing requirement in a stable order', () => {
    expect(
      collectMissingGenerationFields({
        sourcePhotoUrl: null,
        sourceAudioUrl: null,
        title: null,
        description: null,
      }),
    ).toEqual(['title', 'sourcePhotoUrl', 'descriptionOrAudio']);
  });

  it.each([['title'], ['sourcePhotoUrl']])(
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
