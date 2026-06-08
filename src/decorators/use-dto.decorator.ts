import type { Constructor } from '../types.ts';

export function UseDto(dtoClass: Constructor): ClassDecorator {
  return (ctor) => {
    if (!(dtoClass as unknown)) {
      throw new Error('UseDto decorator requires dtoClass');
    }

    (ctor.prototype as { dtoClass?: Constructor }).dtoClass = dtoClass;
  };
}
