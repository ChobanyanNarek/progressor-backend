import { MemoryPointDto } from './memory-point.dto.ts';

/**
 * Response DTO for the public "get a single approved memory point" endpoint.
 *
 * Structurally identical to {@link MemoryPointDto}; it exists only so this
 * endpoint owns a dedicated response type (one DTO per endpoint slot) while
 * keeping the exact same serialized shape and Swagger schema.
 */
export class PublicMemoryPointDto extends MemoryPointDto {}
