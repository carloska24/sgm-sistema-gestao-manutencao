// Tipos de Equipamentos
export interface Equipment {
  id: number;
  name: string;
  code: string;
  description?: string;
  model?: string;
  manufacturer?: string;
  serial_number?: string;
  acquisition_date?: string;
  acquisition_cost?: number;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'deactivated';
  criticality: 'low' | 'medium' | 'high';
  power?: string;
  capacity?: string;
  voltage?: string;
  fuel_type?: string;
  dimensions?: string;
  last_preventive_date?: string;
  last_corrective_date?: string;
  next_preventive_date?: string;
  mtbf?: number;
  mttr?: number;
  created_at: string;
  updated_at: string;
  maintenanceHistory?: MaintenanceOrder[];
  documents?: EquipmentDocument[];
}

export interface EquipmentDocument {
  id: number;
  equipment_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type?: string;
  uploaded_by?: number;
  uploaded_by_name?: string;
  created_at: string;
}

// Tipos de Chamados de Manutenção Corretiva
export type CallStatus = 'open' | 'analysis' | 'assigned' | 'execution' | 'paused' | 'waiting_parts' | 'completed' | 'cancelled';
export type CallPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceCall {
  id: number;
  equipment_id: number;
  type: 'preventive' | 'corrective' | 'predictive' | 'emergency';
  priority: CallPriority;
  problem_type?: string;
  description: string;
  occurrence_date?: string;
  status: CallStatus;
  assigned_to?: number;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  execution_time?: number;
  pause_reason?: string;
  paused_at?: string;
  resume_count?: number;
  total_paused_time?: number;
  execution_notes?: string;
  parts_used?: string;
  safety_procedures?: string;
  cancel_reason?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  equipment_name?: string;
  equipment_code?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  created_by_full_name?: string;
  activities?: CallActivity[];
  history?: CallHistory[];
  documents?: CallDocument[];
  has_checklist?: boolean; // Indica se há checklist associado
}

export interface CallActivity {
  id: number;
  call_id: number;
  activity: string;
  performed_by?: number;
  performed_by_name?: string;
  created_at: string;
}

export interface CallHistory {
  id: number;
  call_id: number;
  action: string;
  old_value?: string;
  new_value?: string;
  performed_by?: number;
  performed_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface CallDocument {
  id: number;
  call_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type?: string;
  phase: 'during' | 'after';
  uploaded_by?: number;
  uploaded_by_name?: string;
  created_at: string;
}

// Tipos de Planos Preventivos
export type FrequencyType = 'days' | 'weeks' | 'months' | 'hours' | 'cycles';

export interface PreventivePlan {
  id: number;
  name: string;
  equipment_id: number;
  frequency_type: FrequencyType;
  frequency_value: number;
  start_date: string;
  end_date?: string;
  instructions?: string;
  estimated_duration?: number;
  tools_required?: string;
  materials_required?: string;
  safety_procedures?: string;
  manual_reference?: string;
  assigned_to?: number;
  is_active: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  equipment_name?: string;
  equipment_code?: string;
  assigned_to_name?: string;
  created_by_name?: string;
  total_orders?: number;
  completed_orders?: number;
  pending_orders?: number;
  in_progress_orders?: number;
  overdue_orders?: number;
  avg_execution_time?: number | null;
  last_completed_date?: string | null;
  next_scheduled_date?: string | null;
  compliance_rate?: number | null;
  orders?: MaintenanceOrder[];
}

// Tipos de Ordens de Manutenção Preventiva
export type MaintenanceType = 'preventive' | 'corrective' | 'predictive' | 'emergency';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export interface MaintenanceOrder {
  id: number;
  plan_id?: number;
  equipment_id: number;
  type: MaintenanceType;
  priority?: MaintenancePriority;
  description?: string;
  instructions?: string;
  status: MaintenanceStatus;
  assigned_to?: number;
  scheduled_date?: string;
  started_at?: string;
  completed_date?: string;
  execution_time?: number;
  estimated_duration?: number;
  observations?: string;
  parts_used?: string;
  pause_reason?: string;
  paused_at?: string;
  resume_count?: number;
  total_paused_time?: number;
  cancel_reason?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  equipment_name?: string;
  equipment_code?: string;
  equipment_manual?: string;
  assigned_to_name?: string;
  plan_name?: string;
  tools_required?: string;
  materials_required?: string;
  safety_procedures?: string;
  manual_reference?: string;
}

// Checklists
export type ChecklistEntityType = 'preventive_plan' | 'maintenance_order' | 'maintenance_call' | 'equipment';
export type ChecklistInputType = 'boolean' | 'number' | 'text' | 'multi';
export type ChecklistReferenceType = 'maintenance_order' | 'maintenance_call';
export type ChecklistResponseStatus = 'pending' | 'completed' | 'skipped' | 'failed';

export interface ChecklistTemplateItem {
  id?: number;
  template_id?: number;
  order_index?: number;
  title: string;
  instructions?: string | null;
  input_type?: ChecklistInputType;
  required?: boolean;
  requires_photo?: boolean;
  requires_signature?: boolean;
}

export interface ChecklistTemplate {
  id?: number;
  name: string;
  description?: string | null;
  entity_type: ChecklistEntityType;
  entity_id?: number | null;
  is_active?: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  items: ChecklistTemplateItem[];
}

export interface ChecklistResponseItem {
  id?: number;
  template_id: number;
  item_id: number;
  title?: string;
  instructions?: string;
  input_type?: ChecklistInputType;
  reference_type: ChecklistReferenceType;
  reference_id: number;
  status?: ChecklistResponseStatus;
  value?: string | null;
  notes?: string | null;
  photo_path?: string | null;
  responded_by?: number;
  responded_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChecklistResponsePayload {
  template_id: number;
  reference_type: ChecklistReferenceType;
  reference_id: number;
  items: Array<{
    item_id: number;
    status?: ChecklistResponseStatus;
    value?: string | null;
    notes?: string | null;
    photo_path?: string | null;
  }>;
}

// Tipos de Usuário
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'technician';
  created_at: string;
  updated_at: string;
}

