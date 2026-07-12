import { Schema, model, Document, Types } from 'mongoose';

/* ============================================================================
 * PolicyAcknowledgement - employee policy acceptance
 * ============================================================================
 * `department` is denormalized from the acknowledging employee at write time
 * (same read-speed pattern used throughout - see CSR.ts/Challenge.ts) so the
 * Governance score aggregation (utils/esgScoring.ts) can $lookup straight
 * from Department without an extra hop through Employee.
 * ==========================================================================*/
export interface IPolicyAcknowledgement extends Document {
  employee: Types.ObjectId;
  department: Types.ObjectId;
  policy: Types.ObjectId;
  version: string;
  acknowledgedAt: Date;
}

const PolicyAcknowledgementSchema = new Schema<IPolicyAcknowledgement>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
  policy: { type: Schema.Types.ObjectId, ref: 'ESGPolicy', required: true, index: true },
  version: { type: String, required: true },
  acknowledgedAt: { type: Date, default: Date.now },
});
// One acknowledgement per employee+policy version
PolicyAcknowledgementSchema.index({ employee: 1, policy: 1, version: 1 }, { unique: true });

export const PolicyAcknowledgement = model<IPolicyAcknowledgement>(
  'PolicyAcknowledgement',
  PolicyAcknowledgementSchema
);

/* ============================================================================
 * Audit - governance audits
 * ==========================================================================*/
export interface IAudit extends Document {
  title: string;
  department: Types.ObjectId;
  auditor: string;
  date: Date;
  findings?: string;
  status: 'Under Review' | 'Completed';
}

const AuditSchema = new Schema<IAudit>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    auditor: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    findings: { type: String, trim: true },
    status: { type: String, enum: ['Under Review', 'Completed'], default: 'Under Review', index: true },
  },
  { timestamps: true }
);

export const Audit = model<IAudit>('Audit', AuditSchema);

/* ============================================================================
 * ComplianceIssue - governance violations
 * ============================================================================
 * `department` is denormalized here (copied from the linked Audit at creation
 * time) purely so the ESG aggregation pipeline in routes/reports.routes.ts
 * can $lookup straight from Department without an extra hop through Audit.
 * Same denormalize-for-read-speed pattern used on the participation models.
 * ==========================================================================*/
export interface IComplianceIssue extends Document {
  audit?: Types.ObjectId;
  department: Types.ObjectId;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  owner: Types.ObjectId;
  dueDate: Date;
  status: 'Open' | 'Resolved';
}

const ComplianceIssueSchema = new Schema<IComplianceIssue>(
  {
    audit: { type: Schema.Types.ObjectId, ref: 'Audit' },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium', index: true },
    description: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['Open', 'Resolved'], default: 'Open', index: true },
  },
  { timestamps: true }
);

export const ComplianceIssue = model<IComplianceIssue>('ComplianceIssue', ComplianceIssueSchema);
