import { Test, TestingModule } from '@nestjs/testing';
import { GraphHandlerService } from './graph-handler.service.js';
import { GraphService } from '../graph/graph.service.js';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LGraph, AnswerInputNode, SerializedGraph } from '@haski/ta-lib';
import { emitEvent } from '../../utils/socket-emitter.js';
import * as GraphCore from '../core/Graph.js';
import { XapiService } from '../xapi.service.js';

jest.mock('../../utils/socket-emitter.js', () => ({
  emitEvent: jest.fn(),
}));

jest.mock('../core/Graph.js', () => ({
  executeLgraph: jest.fn(),
}));

describe('GraphHandlerService', () => {
  let service: GraphHandlerService;
  let graphService: GraphService;
  let mockSocket: Socket;

  // Create a valid SerializedGraph mock object to use in tests
  const mockSerializedGraph: SerializedGraph = {
    last_node_id: 0,
    last_link_id: 0,
    nodes: [],
    links: [],
    groups: [],
    config: {},
    version: 1.0,
  };

  const stringifiedMockGraph: string = JSON.stringify(mockSerializedGraph);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphHandlerService,
        {
          provide: GraphService,
          useValue: {
            saveGraph: jest.fn(),
            getGraph: jest.fn(),
          },
        },
        {
          provide: XapiService,
          useValue: {
            getXapi: () => ({
              sendStatement: jest.fn().mockResolvedValue(undefined),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GraphHandlerService>(GraphHandlerService);
    graphService = module.get<GraphService>(GraphService);
    mockSocket = {
      id: 'mockSocketId',
      emit: jest.fn(),
    } as unknown as Socket;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleRunGraph', () => {
    it('should configure and execute the graph, emitting progress and completion events', async () => {
      const mockPayload = {
        graph: stringifiedMockGraph,
        answer: 'testAnswer',
      };
      const mockLGraph = {
        configure: jest.fn(),
        findNodesByClass: jest.fn().mockReturnValue([]),
        serialize: jest.fn().mockReturnValue(mockSerializedGraph),
      };
      jest.spyOn(service as any, 'addOnNodeAdded').mockImplementation();
      jest
        .spyOn(LGraph.prototype, 'configure')
        .mockImplementation(mockLGraph.configure);
      jest
        .spyOn(LGraph.prototype, 'findNodesByClass')
        .mockImplementation(mockLGraph.findNodesByClass);
      jest
        .spyOn(LGraph.prototype, 'serialize')
        .mockImplementation(mockLGraph.serialize);

      await service.handleRunGraph(mockSocket, mockPayload);

      expect(mockLGraph.configure).toHaveBeenCalledWith(
        JSON.parse(mockPayload.graph),
      );
      expect(mockLGraph.findNodesByClass).toHaveBeenCalledWith(AnswerInputNode);
      expect(GraphCore.executeLgraph).toHaveBeenCalled();
      expect(emitEvent).toHaveBeenCalledWith(
        mockSocket,
        'graphFinished',
        JSON.stringify(mockSerializedGraph),
      );
    });

    it('should emit a typed failure if graph execution fails', async () => {
      const mockPayload = {
        graph: stringifiedMockGraph,
        answer: 'testAnswer',
      };
      jest
        .spyOn(GraphCore, 'executeLgraph')
        .mockRejectedValue(new Error('Execution error'));
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await service.handleRunGraph(mockSocket, mockPayload);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error running graph: ',
        expect.any(Error),
      );
      expect(emitEvent).toHaveBeenCalledWith(
        mockSocket,
        'graphOperationFailed',
        {
          operation: 'run',
          code: 'run-failed',
          message: 'The answer could not be evaluated. Please try again.',
          retryable: true,
        },
      );
    });

    it('should emit a typed failure if graph configuration fails', async () => {
      jest.mocked(GraphCore.executeLgraph).mockClear();
      const mockPayload = {
        graph: 'invalid json',
        answer: 'testAnswer',
      };

      await service.handleRunGraph(mockSocket, mockPayload);

      expect(GraphCore.executeLgraph).not.toHaveBeenCalled();
      expect(emitEvent).toHaveBeenCalledWith(
        mockSocket,
        'graphOperationFailed',
        {
          operation: 'run',
          code: 'run-failed',
          message: 'The answer could not be evaluated. Please try again.',
          retryable: true,
        },
      );
    });
  });

  describe('handleSaveGraph', () => {
    it('should save the graph and emit a "graphSaved" event', async () => {
      const mockPayload = {
        graph: stringifiedMockGraph,
        name: 'testGraph',
      };
      const mockLGraph = {
        configure: jest.fn(),
        serialize: jest.fn().mockReturnValue(mockSerializedGraph),
      };
      jest
        .spyOn(LGraph.prototype, 'configure')
        .mockImplementation(mockLGraph.configure);
      jest
        .spyOn(LGraph.prototype, 'serialize')
        .mockImplementation(mockLGraph.serialize);

      await service.handleSaveGraph(mockSocket, mockPayload);

      expect(mockLGraph.configure).toHaveBeenCalledWith(
        JSON.parse(mockPayload.graph),
      );
      expect(graphService.saveGraph).toHaveBeenCalledWith(
        'testGraph',
        expect.any(LGraph),
      );
      expect(emitEvent).toHaveBeenCalledWith(
        mockSocket,
        'graphSaved',
        JSON.stringify(mockSerializedGraph),
      );
    });

    it('should log an error if saving the graph fails', async () => {
      const mockPayload = {
        graph: stringifiedMockGraph,
        name: 'testGraph',
      };
      jest
        .spyOn(graphService, 'saveGraph')
        .mockRejectedValue(new Error('Save error'));
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await service.handleSaveGraph(mockSocket, mockPayload);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error saving graph: ',
        expect.any(Error),
      );
    });
  });

  describe('handleLoadGraph', () => {
    it('should load the graph and emit a "graphLoaded" event', async () => {
      const mockPayload = 'testGraph';
      const mockGraphData = {
        graph: stringifiedMockGraph,
        id: 1,
        path: 'testGraph',
      };
      const mockLGraph = {
        configure: jest.fn(),
        serialize: jest.fn().mockReturnValue(mockSerializedGraph),
      };
      jest.spyOn(graphService, 'getGraph').mockResolvedValue(mockGraphData);
      jest
        .spyOn(LGraph.prototype, 'configure')
        .mockImplementation(mockLGraph.configure);
      jest
        .spyOn(LGraph.prototype, 'serialize')
        .mockImplementation(mockLGraph.serialize);
      jest.spyOn(service as any, 'addOnNodeAdded').mockImplementation();

      await service.handleLoadGraph(mockSocket, mockPayload);

      expect(graphService.getGraph).toHaveBeenCalledWith('testGraph');
      expect(mockLGraph.configure).toHaveBeenCalledWith(
        JSON.parse(mockGraphData.graph),
      );
      expect(emitEvent).toHaveBeenCalledWith(
        mockSocket,
        'graphLoaded',
        JSON.stringify(mockSerializedGraph),
      );
    });

    it('should emit a typed failure if the graph does not exist', async () => {
      const mockPayload = 'nonExistentGraph';
      jest.spyOn(graphService, 'getGraph').mockResolvedValue(null);

      await service.handleLoadGraph(mockSocket, mockPayload);

      expect(emitEvent).toHaveBeenCalledWith(
        mockSocket,
        'graphOperationFailed',
        {
          operation: 'load',
          code: 'not-found',
          message: `Graph with pathname "nonExistentGraph" not found.`,
          retryable: true,
        },
      );
    });

    it('should emit a typed failure if loading the graph fails', async () => {
      const mockPayload = 'testGraph';
      jest
        .spyOn(graphService, 'getGraph')
        .mockRejectedValue(new Error('Load error'));
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      await service.handleLoadGraph(mockSocket, mockPayload);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error loading graph: ',
        expect.any(Error),
      );
      expect(emitEvent).toHaveBeenCalledWith(
        mockSocket,
        'graphOperationFailed',
        {
          operation: 'load',
          code: 'load-failed',
          message: 'The task could not be loaded. Please try again.',
          retryable: true,
        },
      );
    });
  });
});
