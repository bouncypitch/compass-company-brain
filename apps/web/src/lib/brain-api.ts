import type {
  AcceptRecommendationResult,
  BrainPerson,
  CompassResult,
  RadarResult,
  TimeMachineResult,
} from '@app-starter/shared';
import { apiClient } from './api-client';

const base = (organizationId: string): string => `/api/organizations/${organizationId}/brain`;

export class BrainApi {
  getRadar(organizationId: string): Promise<RadarResult | null> {
    return apiClient.get<RadarResult | null>(`${base(organizationId)}/radar`);
  }

  runRadar(organizationId: string): Promise<RadarResult> {
    return apiClient.post<RadarResult>(`${base(organizationId)}/radar/run`, {});
  }

  timeMachine(organizationId: string): Promise<TimeMachineResult> {
    return apiClient.post<TimeMachineResult>(`${base(organizationId)}/radar/time-machine`, {});
  }

  accept(organizationId: string, gapId: string): Promise<AcceptRecommendationResult> {
    return apiClient.post<AcceptRecommendationResult>(
      `${base(organizationId)}/recommendations/${encodeURIComponent(gapId)}/accept`,
      {},
    );
  }

  priorityStatus(organizationId: string, priorityId: string): Promise<{ id: string; status: string }> {
    return apiClient.get(`${base(organizationId)}/priorities/${encodeURIComponent(priorityId)}/status`);
  }

  people(organizationId: string): Promise<BrainPerson[]> {
    return apiClient.get<BrainPerson[]>(`${base(organizationId)}/people`);
  }

  compass(organizationId: string, employeeId: string, refresh = false): Promise<CompassResult> {
    return apiClient.post<CompassResult>(
      `${base(organizationId)}/compass/${encodeURIComponent(employeeId)}${refresh ? '?refresh=true' : ''}`,
      {},
    );
  }
}

export const brainApi = new BrainApi();
