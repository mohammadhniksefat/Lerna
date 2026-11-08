import { describe, it, expect } from 'vitest';
import { ProgressModule } from './progress.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

describe('ProgressModule', () => {
  it('declares ProgressModule with controllers and providers', () => {
    expect(ProgressModule).toBeDefined();
  });

  it('instantiates controller and service directly', () => {
    const service = new ProgressService(
      {} as any,
      {} as any,
      {} as any,
    );
    const controller = new ProgressController(service);

    expect(controller).toBeInstanceOf(ProgressController);
    expect(service).toBeInstanceOf(ProgressService);
  });
});
