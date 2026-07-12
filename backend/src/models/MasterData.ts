import { Schema, model, Document, Types } from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin';

/* ============================================================================
 * Department
 * ==========================================================================*/
export interface IDepartment extends Document {
  name: string;
  code: string;
  head?: string;
  parentDepartment?: Types.ObjectId;
  employeeCount: number;
  isActive: boolean;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    head: { type: String, trim: true },
    parentDepartment: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    employeeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
DepartmentSchema.plugin(softDeletePlugin);
export const Department = model<IDepartment>('Department', DepartmentSchema);

/* ============================================================================
 * Category  (shared across CSR Activities & Challenges)
 * ==========================================================================*/
export interface ICategory extends Document {
  name: string;
  type: 'CSR Activity' | 'Challenge';
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['CSR Activity', 'Challenge'], required: true, index: true },
  },
  { timestamps: true }
);
CategorySchema.plugin(softDeletePlugin);
export const Category = model<ICategory>('Category', CategorySchema);

/* ============================================================================
 * Emission Factor
 * ==========================================================================*/
export interface IEmissionFactor extends Document {
  name: string;
  activityType: string; // e.g. "Electricity", "Diesel", "Air Travel"
  unit: string; // e.g. "kWh", "litre", "km"
  factorValue: number; // kg CO2e per unit
  source?: string;
  effectiveDate: Date;
  isActive: boolean;
}

const EmissionFactorSchema = new Schema<IEmissionFactor>(
  {
    name: { type: String, required: true, trim: true },
    activityType: { type: String, required: true, index: true },
    unit: { type: String, required: true },
    factorValue: { type: Number, required: true },
    source: { type: String, trim: true },
    effectiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
EmissionFactorSchema.plugin(softDeletePlugin);
export const EmissionFactor = model<IEmissionFactor>('EmissionFactor', EmissionFactorSchema);

/* ============================================================================
 * Product ESG Profile
 * ==========================================================================*/
export interface IProductESGProfile extends Document {
  productName: string;
  sku: string;
  carbonFootprint: number;
  esgScore: number;
  notes?: string;
  isActive: boolean;
}

const ProductESGProfileSchema = new Schema<IProductESGProfile>(
  {
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    carbonFootprint: { type: Number, default: 0 },
    esgScore: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);
ProductESGProfileSchema.plugin(softDeletePlugin);
export const ProductESGProfile = model<IProductESGProfile>('ProductESGProfile', ProductESGProfileSchema);

/* ============================================================================
 * Environmental Goal
 * ==========================================================================*/
export interface IEnvironmentalGoal extends Document {
  title: string;
  description?: string;
  department: Types.ObjectId;
  targetCO2: number;
  currentCO2: number;
  deadline: Date;
  status: 'Active' | 'On Track' | 'At Risk' | 'Completed';
  createdAt: Date;
  isActive: boolean;
}

const EnvironmentalGoalSchema = new Schema<IEnvironmentalGoal>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    targetCO2: { type: Number, required: true },
    currentCO2: { type: Number, default: 0 },
    deadline: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Active', 'On Track', 'At Risk', 'Completed'],
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);
EnvironmentalGoalSchema.plugin(softDeletePlugin);
export const EnvironmentalGoal = model<IEnvironmentalGoal>('EnvironmentalGoal', EnvironmentalGoalSchema);

/* ============================================================================
 * ESG Policy
 * ==========================================================================*/
export interface IESGPolicy extends Document {
  title: string;
  description: string;
  category: 'Environmental' | 'Social' | 'Governance';
  version: string;
  mandatoryAcknowledgement: boolean;
  fileUrl?: string;
  isActive: boolean;
}

const ESGPolicySchema = new Schema<IESGPolicy>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['Environmental', 'Social', 'Governance'], required: true },
    version: { type: String, default: '1.0' },
    mandatoryAcknowledgement: { type: Boolean, default: true },
    fileUrl: { type: String },
  },
  { timestamps: true }
);
ESGPolicySchema.plugin(softDeletePlugin);
export const ESGPolicy = model<IESGPolicy>('ESGPolicy', ESGPolicySchema);

/* ============================================================================
 * Badge  (gamification)
 * ==========================================================================*/
export interface IBadge extends Document {
  name: string;
  description?: string;
  icon?: string;
  unlockType: 'xp' | 'challenges';
  unlockValue: number;
  isActive: boolean;
}

const BadgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, default: '🏅' },
    unlockType: { type: String, enum: ['xp', 'challenges'], required: true },
    unlockValue: { type: Number, required: true },
  },
  { timestamps: true }
);
BadgeSchema.plugin(softDeletePlugin);
export const Badge = model<IBadge>('Badge', BadgeSchema);

/* ============================================================================
 * Reward  (redeemable via points)
 * ==========================================================================*/
export interface IReward extends Document {
  name: string;
  description?: string;
  pointsRequired: number;
  stockCount: number;
  status: 'Active' | 'Inactive';
  isActive: boolean;
}

const RewardSchema = new Schema<IReward>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    pointsRequired: { type: Number, required: true },
    stockCount: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);
RewardSchema.plugin(softDeletePlugin);
export const Reward = model<IReward>('Reward', RewardSchema);
