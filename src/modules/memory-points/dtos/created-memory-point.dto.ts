import { MemoryPointDto } from './memory-point.dto.ts';

/**
 * Response DTO for the creator "create a new memory point" endpoint.
 *
 * Structurally identical to {@link MemoryPointDto}; it exists only so this
 * endpoint owns a dedicated response type (one DTO per endpoint slot) while
 * keeping the exact same serialized shape and Swagger schema.
 */
export class CreatedMemoryPointDto extends MemoryPointDto {}
