import { Test, TestingModule } from '@nestjs/testing';
import { LumaController } from './luma.controller';

describe('LumaController', () => {
  let controller: LumaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LumaController],
    }).compile();

    controller = module.get<LumaController>(LumaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
