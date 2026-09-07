import { Test, TestingModule } from '@nestjs/testing';
import { GraphGateway } from './graph.gateway.js';
import { GraphHandlerService } from './graph-handler.service.js';
import { GraphService } from '../graph/graph.service.js';

describe('GraphGateway', () => {
  let gateway: GraphGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphGateway,
        {
          provide: GraphHandlerService,
          useValue: {
            handleRunGraph: jest.fn(),
            handleSaveGraph: jest.fn(),
            handleLoadGraph: jest.fn(),
          },
        },
        {
          provide: GraphService,
          useValue: {
            runLgraph: jest.fn(),
            saveGraph: jest.fn(),
            getGraph: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<GraphGateway>(GraphGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
