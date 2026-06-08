import { Module } from '@nestjs/common';

import { MemoryPointModule } from '../memory-points/memory-point.module.ts';
import { AdminMediaController } from './admin-media.controller.ts';

@Module({
  imports: [MemoryPointModule],
  controllers: [AdminMediaController],
})
export class AdminMediaModule {}
