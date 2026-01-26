import { Test, TestingModule } from '@nestjs/testing';
import { LumaService } from './luma.service';

describe('LumaService', () => {
  let service: LumaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LumaService],
    }).compile();

    service = module.get<LumaService>(LumaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
