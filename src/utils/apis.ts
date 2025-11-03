const API_BASE_URL = import.meta.env.PROD ? '/api' : 'https://mindstack-api.onrender.com/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Token helpers
  setToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    localStorage.removeItem('authToken');
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // Start with base headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };
    // Inject Authorization if not explicitly provided
    const token = this.getToken();
    if (!headers['Authorization'] && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Optional: handle token refresh or auto logout
      // this.clearToken();
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const res = await this.request<{ token?: string;[k: string]: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }
    );
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async register(firstName: string, lastName: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password })
    });
  }

  async verifyToken(token: string) {
    // Explicit token override
    return this.request('/auth/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async verifyOAuthToken(token: string, provider: string) {
    return this.request('/auth/verify-oauth', {
      method: 'POST',
      body: JSON.stringify({ token, provider })
    });
  }

  // Problems methods
  async getProblems(id: string) {
    return this.request(`/problems/users/${id}/problems`);
  }

  async createProblem(problemData: any, user: { id: string | undefined }) {
    return this.request(`/problems/users/${user.id}/problems`, {
      method: 'POST',
      body: JSON.stringify(problemData)
    });
  }

  // Learning Items methods
  async getLearningItems(id: string) {
    return this.request(`/learning/users/${id}/learning-items`);
  }

  async createLearningItem(learningData: any, user: { id: string | undefined }) {
    return this.request(`/learning/users/${user.id}/learning-items`, {
      method: 'POST',
      body: JSON.stringify(learningData)
    });
  }

  async updateLearningItem(id: string, learningData: any) {
    return this.request(`/learning/learning-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(learningData)
    });
  }

  async deleteLearningItem(id: string) {
    return this.request(`/learning/learning-items/${id}`, {
      method: 'DELETE'
    });
  }

  // Revision Items methods
  async getRevisionItems(id: string) {
    // Default: show upcoming revisions (next 90 days)
    return this.request(`/revision/users/${id}/revision-items?horizon=90`);
  }

  async createRevisionItem(revisionData: any, user: { id: string | undefined }) {
    return this.request(`/revision/users/${user.id}/revision-items`, {
      method: 'POST',
      body: JSON.stringify(revisionData)
    });
  }

  async completeRevisionItem(id: string, data: { rating: number }) {
    return this.request(`/revision/revision-items/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async bulkCompleteRevisionItems(userId: string, data: { completions: Array<{ revisionItemId: string, performanceRating: number }> }) {
    return this.request(`/revision/users/${userId}/revision-items/bulk-complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Analytics methods
  async getAnalytics(userId: string, dateParams?: any) {
    let url = `/analytics?userId=${userId}`;
    if (dateParams) {
      if (dateParams.timeframe) url += `&timeframe=${dateParams.timeframe}`;
      if (dateParams.startDate) url += `&startDate=${dateParams.startDate}`;
      if (dateParams.endDate) url += `&endDate=${dateParams.endDate}`;
    }
    return this.request(url);
  }

  // Roadmap methods
  async getRoadmaps(id: string) {
    return this.request(`/roadmap/users/${id}/roadmaps`);
  }

  async createRoadmap(roadmapData: any, user: { id: string | undefined }) {
    return this.request(`/roadmap/users/${user.id}/roadmaps`, {
      method: 'POST',
      body: JSON.stringify(roadmapData)
    });
  }

  async getRoadmap(roadmapId: string) {
    return this.request(`/roadmap/roadmaps/${roadmapId}`);
  }

  async createTopic(topicData: any, roadmapId: string) {
    return this.request(`/roadmap/roadmaps/${roadmapId}/topics`, {
      method: 'POST',
      body: JSON.stringify(topicData)
    });
  }

  async createSubtopic(subtopicData: any, topicId: string) {
    return this.request(`/roadmap/topics/${topicId}/subtopics`, {
      method: 'POST',
      body: JSON.stringify(subtopicData)
    });
  }

  async completeTopic(topicId: string) {
    return this.request(`/roadmap/topics/${topicId}/complete`, {
      method: 'PUT'
    });
  }

  async uncompleteTopic(topicId: string) {
    return this.request(`/roadmap/topics/${topicId}/uncomplete`, {
      method: 'PUT'
    });
  }

  async completeSubtopic(subtopicId: string) {
    return this.request(`/roadmap/subtopics/${subtopicId}/complete`, {
      method: 'PUT'
    });
  }

  async uncompleteSubtopic(subtopicId: string) {
    return this.request(`/roadmap/subtopics/${subtopicId}/uncomplete`, {
      method: 'PUT'
    });
  }

  // Graph management methods
  async getGraphs() {
    return this.request('/graphs', {
      method: 'GET'
    });
  }

  async getGraph(graphId: number) {
    return this.request(`/graphs/${graphId}`, {
      method: 'GET'
    });
  }

  async createGraph(graphData: any) {
    return this.request('/graphs', {
      method: 'POST',
      body: JSON.stringify(graphData)
    });
  }

  async updateGraph(graphId: number, graphData: any) {
    return this.request(`/graphs/${graphId}`, {
      method: 'PUT',
      body: JSON.stringify(graphData)
    });
  }

  async deleteGraph(graphId: number) {
    return this.request(`/graphs/${graphId}`, {
      method: 'DELETE'
    });
  }

  async getDefaultGraph() {
    return this.request('/graphs/default', {
      method: 'GET'
    });
  }

  // Graph methods (legacy - for backward compatibility)
  async getLegacyGraph() {
    return this.request('/graph');
  }


  async getNodes(options?: { search?: string; type?: string; limit?: number; offset?: number; graphId?: number }) {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.type) params.append('type', options.type);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.graphId) params.append('graphId', options.graphId.toString());

    const queryString = params.toString();
    return this.request(`/graph/nodes${queryString ? `?${queryString}` : ''}`);
  }

  async createNode(nodeData: any) {
    return this.request('/graph/nodes', {
      method: 'POST',
      body: JSON.stringify(nodeData)
    });
  }


  async updateNode(nodeId: number, nodeData: any) {
    return this.request(`/graph/nodes/${nodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(nodeData)
    });
  }

  async deleteNode(nodeId: number) {
    return this.request(`/graph/nodes/${nodeId}`, {
      method: 'DELETE'
    });
  }

  async recalculateNodeStrength(nodeId: number) {
    return this.request(`/graph/nodes/${nodeId}/recalculate-strength`, {
      method: 'POST'
    });
  }

  async createEdge(edgeData: any) {
    return this.request('/graph/edges', {
      method: 'POST',
      body: JSON.stringify(edgeData)
    });
  }

  async deleteEdge(edgeId: number) {
    return this.request(`/graph/edges/${edgeId}`, {
      method: 'DELETE'
    });
  }

  async postReview(reviewData: any) {
    return this.request('/graph/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  async getRevisionQueue(userId: string, options?: { horizonDays?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.horizonDays) params.append('horizon', options.horizonDays.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString();
    // Use the working revision items endpoint instead of the empty graph queue  
    return this.request(`/revision/users/${userId}/revision-items${queryString ? `?${queryString}` : ''}`);
  }

  async getNodesWithWeakArtifacts() {
    return this.request('/graph/nodes/weak-artifacts');
  }

  // Learning handshake methods
  async createLearningItemFromNode(nodeId: number, user: { id: string | undefined }) {
    return this.request(`/learning/users/${user.id}/learning-items`, {
      method: 'POST',
      body: JSON.stringify({
        title: `Learn: ${nodeId}`, // This will be updated by the backend
        type: 'other',
        category: 'MindGraph',
        nodeId: nodeId,
        status: 'in-progress',
        progress: 0
      })
    });
  }

  async seedGraphData() {
    return this.request('/graph/seed', {
      method: 'POST'
    });
  }

  // Settings methods
  async getGraphSettings() {
    return this.request('/graph/settings');
  }

  async updateGraphSettings(patch: {
    preset?: 'gentle' | 'balanced' | 'intensive';
    sMax?: number;
    gFactor?: number;
    propagationDepth?: number;
    horizonDays?: number;
    weakThreshold?: number;
    jitterEnabled?: boolean;
  }) {
    return this.request('/graph/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  }

  // Item Link methods
  async createItemLinks(itemId: number, itemType: 'problem' | 'learning', nodeIds: number[]) {
    return this.request('/item-links', {
      method: 'POST',
      body: JSON.stringify({ itemId, itemType, nodeIds })
    });
  }

  async getItemLinks(itemType: 'problem' | 'learning', itemId: number) {
    return this.request(`/item-links/${itemType}/${itemId}`);
  }

  async deleteItemLink(itemType: 'problem' | 'learning', itemId: number, nodeId: number) {
    return this.request(`/item-links/${itemType}/${itemId}/${nodeId}`, {
      method: 'DELETE'
    });
  }

  async getUnlinkedItems(itemType?: 'problem' | 'learning') {
    const params = new URLSearchParams();
    if (itemType) params.append('itemType', itemType);
    const queryString = params.toString();
    return this.request(`/item-links/unlinked-items${queryString ? `?${queryString}` : ''}`);
  }

  async getNodeItems(nodeId: number) {
    return this.request(`/item-links/node/${nodeId}`);
  }

  // ========== SYSTEM ENDPOINTS ==========

  /**
   * Get metrics job status
   */
  async getMetricsJobStatus() {
    return this.request<{
      success: boolean;
      data: {
        key: string;
        lastRun: string | null;
        durationMs: number | null;
        ok: boolean;
        note: string | null;
      };
    }>('/system/metrics-job/status');
  }

  /**
   * Run metrics job manually
   */
  async runMetricsJob() {
    return this.request<{
      success: boolean;
      data: {
        ok: boolean;
        durationMs?: number;
        totalNodesProcessed?: number;
        errors?: number;
        error?: string;
      };
    }>('/system/metrics-job/run', {
      method: 'POST'
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);