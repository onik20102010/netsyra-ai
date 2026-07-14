export type MemoryType =
  | "working"
  | "short-term"
  | "long-term"
  | "episodic"
  | "semantic"
  | "procedural"
  | "user"
  | "project"
  | "vector"
  | "graph"
  | "semantic-concept"
  | "semantic-relation"
  | "skill"
  | "procedure"
  | "workflow"
  | "user-preferences"
  | "user-profile"
  | "user-habit"
  | "user-permissions"
  | "project-context"
  | "project-index"
  | "vector-embedding"
  | "graph-entity"
  | "graph-edge";

export interface BaseMemoryItem {
  id: string;
  userId: string;
  type: MemoryType;
  createdAt: Date;
  updatedAt: Date;
  importance?: number; // 0-1
  tags?: string[];
  content?: string;
}

// ============ Working Memory ============
export interface WorkingMemoryItem extends BaseMemoryItem {
  type: "working";
  key: string;
  value: any;
  expiresAt?: Date;
}

// ============ Short-Term Memory ============
export interface ShortTermMemoryItem extends BaseMemoryItem {
  type: "short-term";
  conversationId: string;
  messageId?: string;
  summary?: string;
}

// ============ Long-Term Memory ============
export interface LongTermMemoryItem extends BaseMemoryItem {
  type: "long-term";
  category: string;
  source?: string;
  lastAccessed?: Date;
}

// ============ Episodic Memory ============
export interface Episode extends BaseMemoryItem {
  type: "episodic";
  goal?: string;
  actions: string[];
  result: string;
  success: boolean;
  mistakes?: string[];
  lessons?: string[];
  metadata?: Record<string, any>;
}

// ============ Semantic Memory ============
export interface SemanticConcept extends BaseMemoryItem {
  type: "semantic-concept";
  name: string;
  description: string;
  attributes: Record<string, any>;
}

export interface SemanticRelation extends BaseMemoryItem {
  type: "semantic-relation";
  sourceId: string;
  targetId: string;
  relation: string;
  confidence: number;
}

// ============ Procedural Memory ============
export interface Skill extends BaseMemoryItem {
  type: "skill";
  name: string;
  description: string;
  steps?: string[];
  codeTemplate?: string;
  examples?: string[];
}

export interface Procedure extends BaseMemoryItem {
  type: "procedure";
  name: string;
  description: string;
  steps: string[];
  prerequisites?: string[];
  successCriteria?: string;
}

export interface Workflow extends BaseMemoryItem {
  type: "workflow";
  name: string;
  description: string;
  stages: string[];
  triggers?: string[];
}

// ============ User Memory ============
export interface UserPreferences extends BaseMemoryItem {
  type: "user-preferences";
  preferences: Record<string, any>;
}

export interface UserProfile extends BaseMemoryItem {
  type: "user-profile";
  name?: string;
  email?: string;
  role?: string;
  skills?: string[];
}

export interface UserHabit extends BaseMemoryItem {
  type: "user-habit";
  habit: string;
  frequency: string;
  lastObserved?: Date;
}

export interface UserPermissions extends BaseMemoryItem {
  type: "user-permissions";
  permissions: string[];
}

// ============ Project Memory ============
export interface ProjectMemoryItem extends BaseMemoryItem {
  type: "project";
  projectId: string;
  key: string;
  value: any;
}

export interface ProjectContext extends BaseMemoryItem {
  type: "project-context";
  projectId: string;
  architecture?: string;
  folderStructure?: string[];
  databaseSchema?: Record<string, any>;
  routes?: string[];
  models?: string[];
  tools?: string[];
  designDecisions?: Record<string, string>;
  codingStyle?: string;
}

export interface ProjectIndex extends BaseMemoryItem {
  type: "project-index";
  projectId: string;
  files?: string[];
  recentChanges?: string[];
  todoList?: string[];
}

// ============ Vector Memory ============
export interface VectorEmbedding extends BaseMemoryItem {
  type: "vector-embedding";
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

// ============ Graph Memory ============
export interface GraphEntity extends BaseMemoryItem {
  type: "graph-entity";
  name: string;
  entityType: string;
  properties: Record<string, any>;
}

export interface GraphEdge extends BaseMemoryItem {
  type: "graph-edge";
  fromId: string;
  toId: string;
  relationType: string;
  properties?: Record<string, any>;
}

// ============ Memory Manager Interfaces ============
export interface MemoryQuery {
  userId: string;
  query?: string;
  types?: MemoryType[];
  tags?: string[];
  limit?: number;
  projectId?: string;
  conversationId?: string;
  minImportance?: number;
}

export interface MemoryResult {
  items: BaseMemoryItem[];
  score?: number;
}

export interface MemoryStore {
  save(item: BaseMemoryItem): Promise<void>;
  get(id: string): Promise<BaseMemoryItem | null>;
  update(id: string, data: Partial<BaseMemoryItem>): Promise<void>;
  delete(id: string): Promise<void>;
  query(query: MemoryQuery): Promise<MemoryResult>;
}
