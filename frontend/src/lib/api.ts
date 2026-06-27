export interface Account {
  id: string;
  name: string;
  arr: number;
  health_score: number;
  tenure_months: number;
}

export interface ChunkResult {
  text: string;
  source: string;
  section: string;
  score: number;
}

export interface SearchResponse {
  chunks: ChunkResult[];
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function getAccounts(): Promise<Account[]> {
  const response = await fetch(`${API_BASE_URL}/accounts`);
  if (!response.ok) {
    throw new Error(`Failed to fetch accounts: ${response.statusText}`);
  }
  return response.json();
}

export async function searchKB(query: string, limit = 5): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, k: limit.toString() });
  const response = await fetch(`${API_BASE_URL}/kb/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to query knowledge base: ${response.statusText}`);
  }
  return response.json();
}

export async function getHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export interface PipelineRunResponse {
  session_id: string;
  status: string;
}

export interface PlannerDecision {
  interaction_type: string;
  agents: string[];
  rationale: string;
  detected_entities?: string[];
}

export interface Recommendation {
  id?: string;
  action_title: string;
  action_type: 'RETENTION' | 'EXPANSION' | 'ESCALATION' | 'ENABLEMENT';
  confidence: number;
  priority: number;
  business_impact: string;
  evidence?: {
    source: string;
    section: string;
    quoted_text: string;
    supported: boolean;
  } | null;
  evaluation_status?: string;
  evaluation_passed?: boolean;
  evaluation_reasons?: string[];
}

export interface AnalysisOutput {
  risks: { description: string; severity: string }[];
  opportunities: string[];
  missing_info: string[];
}

export interface PipelineStatusResponse {
  status: string;
  planner_decision: PlannerDecision | null;
  analysis: AnalysisOutput | null;
  recommendations: Recommendation[];
  retrieved_chunks: ChunkResult[];
  errors: string[];
}

export async function runPipeline(accountId: string, rawText: string): Promise<PipelineRunResponse> {
  const response = await fetch(`${API_BASE_URL}/pipeline/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account_id: accountId, raw_text: rawText }),
  });
  if (!response.ok) {
    throw new Error(`Failed to start pipeline: ${response.statusText}`);
  }
  return response.json();
}

export async function getPipelineStatus(sessionId: string): Promise<PipelineStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/pipeline/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch pipeline status: ${response.statusText}`);
  }
  return response.json();
}

export async function getRecommendations(sessionId: string): Promise<Recommendation[]> {
  const response = await fetch(`${API_BASE_URL}/pipeline/${sessionId}/recommendations`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
  }
  return response.json();
}

export interface AuditLogEntry {
  id: string;
  session_id: string;
  account_id: string;
  recommendation_id: string;
  decision: 'approved' | 'rejected' | 'modified';
  note?: string;
  decided_by?: string;
  timestamp: string;
}

export async function postRecommendationDecision(
  recommendationId: string, 
  decision: 'approved' | 'rejected' | 'modified', 
  note?: string
): Promise<{ audit_log_id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/recommendations/${recommendationId}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ decision, note }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit decision: ${response.statusText}`);
  }
  return response.json();
}

export async function getAccountAuditLog(accountId: string): Promise<AuditLogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/audit-log`);
  if (!response.ok) {
    throw new Error(`Failed to fetch audit log: ${response.statusText}`);
  }
  return response.json();
}

export interface PlatformStats {
  total_runs: number;
  avg_confidence: number;
  approval_rate: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const response = await fetch(`${API_BASE_URL}/platform/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch platform stats: ${response.statusText}`);
  }
  return response.json();
}
