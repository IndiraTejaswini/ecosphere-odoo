import 'dotenv/config';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import connectDB from './db';

import {
  Department,
  Category,
  EmissionFactor,
  EnvironmentalGoal,
  ESGPolicy,
  Badge,
  Reward,
  ProductESGProfile,
} from './models/MasterData';
import fs from 'fs';
import path from 'path';
import Employee from './models/Employee';
import CarbonTransaction from './models/CarbonTransaction';
import { CSRActivity, EmployeeParticipation } from './models/CSR';
import { Challenge, ChallengeParticipation } from './models/Challenge';
import { Audit, ComplianceIssue, PolicyAcknowledgement } from './models/Governance';
import DepartmentScore from './models/DepartmentScore';
import Settings, { SETTINGS_SINGLETON_ID } from './models/Settings';
import DiversityMetric from './models/Diversity';
import { TrainingProgram, TrainingCompletion } from './models/Training';
import { computeDepartmentScores } from './utils/esgScoring';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@ecosphere.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'User@123';

// Gap Fix: seed data previously referenced '/uploads/seed-demo-proof.jpg' as
// a "fake proof" for demo purposes, but never actually wrote that file to
// disk - clicking "View proof" on any seeded row would 404. This writes a
// real, tiny placeholder image so those links genuinely resolve.
const SEED_PROOF_FILENAME = 'seed-demo-proof.jpg';
const SEED_PROOF_PATH = `/uploads/${SEED_PROOF_FILENAME}`;

function ensureSeedProofFileExists() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, SEED_PROOF_FILENAME);
  if (fs.existsSync(filePath)) return;

  // Smallest possible valid JPEG (1x1 grey pixel), base64-encoded, so
  // "View proof" opens a real (if tiny) image instead of a broken link.
  const tinyJpegBase64 =
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';
  fs.writeFileSync(filePath, Buffer.from(tinyJpegBase64, 'base64'));
}

async function clearDatabase() {
  console.log('🧹 Clearing existing collections...');
  await Promise.all([
    Department.deleteMany({}),
    Category.deleteMany({}),
    EmissionFactor.deleteMany({}),
    ProductESGProfile.deleteMany({}),
    EnvironmentalGoal.deleteMany({}),
    ESGPolicy.deleteMany({}),
    Badge.deleteMany({}),
    Reward.deleteMany({}),
    Employee.deleteMany({}),
    CarbonTransaction.deleteMany({}),
    CSRActivity.deleteMany({}),
    EmployeeParticipation.deleteMany({}),
    Challenge.deleteMany({}),
    ChallengeParticipation.deleteMany({}),
    Audit.deleteMany({}),
    ComplianceIssue.deleteMany({}),
    DepartmentScore.deleteMany({}),
    Settings.deleteMany({}),
    PolicyAcknowledgement.deleteMany({}),
    DiversityMetric.deleteMany({}),
    TrainingProgram.deleteMany({}),
    TrainingCompletion.deleteMany({}),
  ]);
}

async function seed() {
  await connectDB();
  await clearDatabase();

  console.log('🖼️  Writing seed proof placeholder file...');
  ensureSeedProofFileExists();

  /* ------------------------------- Settings ------------------------------- */
  console.log('⚙️  Creating default Settings...');
  await Settings.create({ _id: SETTINGS_SINGLETON_ID });

  /* ---------------------------- Departments ---------------------------- */
  console.log('🏢 Creating departments...');
  const departmentDefs = [
    { name: 'Manufacturing', code: 'MFG', head: 'S. Nair' },
    { name: 'Logistics', code: 'LOG', head: 'R. Iyer' },
    { name: 'Corporate', code: 'CORP', head: 'A. Mehta' },
    { name: 'Procurement', code: 'PROC', head: 'V. Shah' },
    { name: 'IT & Facilities', code: 'ITF', head: 'K. Rao' },
  ];
  const departments = await Promise.all(
    departmentDefs.map((d) => Department.create({ ...d, employeeCount: 0 }))
  );

  /* ----------------------------- Categories ----------------------------- */
  console.log('🏷️  Creating categories...');
  const csrCategoryDefs = ['Tree Plantation', 'Beach Cleanup', 'Blood Donation'];
  const challengeCategoryDefs = ['Energy Saving', 'Waste Reduction', 'Commute'];
  const csrCategories = await Promise.all(
    csrCategoryDefs.map((name) => Category.create({ name, type: 'CSR Activity' }))
  );
  const challengeCategories = await Promise.all(
    challengeCategoryDefs.map((name) => Category.create({ name, type: 'Challenge' }))
  );

  /* -------------------------- Emission Factors --------------------------- */
  console.log('🌫️  Creating emission factors...');
  const emissionFactors = await Promise.all([
    EmissionFactor.create({ name: 'Grid Electricity', activityType: 'Electricity', unit: 'kWh', factorValue: 0.71 }),
    EmissionFactor.create({ name: 'Diesel Fuel', activityType: 'Fleet', unit: 'litre', factorValue: 2.68 }),
    EmissionFactor.create({ name: 'Domestic Air Travel', activityType: 'Travel', unit: 'km', factorValue: 0.15 }),
    EmissionFactor.create({ name: 'Natural Gas', activityType: 'Manufacturing', unit: 'm3', factorValue: 1.9 }),
    EmissionFactor.create({ name: 'Packaging Waste', activityType: 'Expense', unit: 'kg', factorValue: 0.5 }),
  ]);

  /* ---------------------------- Product ESG Profiles ------------------------- */
  // Gap Fix: this model had ZERO seed data before - the "Product ESG Profiles"
  // tab was always empty regardless of frontend wiring.
  console.log('📦 Creating product ESG profiles...');
  await Promise.all([
    ProductESGProfile.create({ productName: 'Recycled Kraft Packaging', sku: 'ECO-BOX-01', carbonFootprint: 0.24, esgScore: 92, notes: 'Corrugated cardboard, FSC certified' }),
    ProductESGProfile.create({ productName: 'Polyethylene Stretch Wrap', sku: 'SLM-PLAS-44', carbonFootprint: 1.85, esgScore: 38, notes: 'Virgin LDPE - high footprint, flagged for redesign' }),
    ProductESGProfile.create({ productName: 'Water-Activated Paper Tape', sku: 'BIO-TAPE-09', carbonFootprint: 0.12, esgScore: 88, notes: 'Kraft paper / starch adhesive' }),
    ProductESGProfile.create({ productName: 'Standard Shipping Pallet', sku: 'PAL-STD-12', carbonFootprint: 4.6, esgScore: 61, notes: 'Reclaimed hardwood, reused up to 10 cycles' }),
  ]);

  /* --------------------------------- Badges ------------------------------ */
  console.log('🎖️  Creating badges...');
  await Promise.all([
    Badge.create({ name: 'Green Beginner', description: 'Earned your first 50 XP', icon: '🌱', unlockType: 'xp', unlockValue: 50 }),
    Badge.create({ name: 'Carbon Saver', description: 'Earned 200 XP', icon: '♻️', unlockType: 'xp', unlockValue: 200 }),
    Badge.create({ name: 'Sustainability Champion', description: 'Earned 500 XP', icon: '🏆', unlockType: 'xp', unlockValue: 500 }),
    Badge.create({ name: 'Team Player', description: 'Completed 3 challenges', icon: '🤝', unlockType: 'challenges', unlockValue: 3 }),
  ]);

  /* -------------------------------- Rewards ------------------------------- */
  console.log('🎁 Creating rewards...');
  await Promise.all([
    Reward.create({ name: 'Eco Water Bottle', description: 'Reusable steel bottle', pointsRequired: 50, stockCount: 40 }),
    Reward.create({ name: 'Extra Day Off', description: 'One additional paid leave day', pointsRequired: 300, stockCount: 15 }),
    Reward.create({ name: '₹500 Gift Voucher', description: 'Redeemable at partner stores', pointsRequired: 150, stockCount: 25 }),
    Reward.create({ name: 'Company Swag Kit', description: 'T-shirt + tote bag', pointsRequired: 80, stockCount: 30 }),
  ]);

  // NOTE: Environmental Goals are created further down, AFTER carbon
  // transactions - see that section for why.

  /* ------------------------------- ESG Policies ---------------------------- */
  console.log('📜 Creating ESG policies...');
  const esgPolicies = await Promise.all([
    ESGPolicy.create({ title: 'Anti-Bribery & Corruption Policy', description: 'Governance policy on ethical conduct', category: 'Governance', version: '1.0' }),
    ESGPolicy.create({ title: 'Waste & Recycling Guidelines', description: 'Environmental policy for site-level waste handling', category: 'Environmental', version: '1.0' }),
    ESGPolicy.create({ title: 'Diversity & Inclusion Charter', description: 'Social policy on workplace inclusion', category: 'Social', version: '1.0' }),
  ]);

  /* -------------------------------- Employees ------------------------------ */
  console.log('👥 Creating employees (this hashes passwords one-by-one, please wait)...');
  const admin = await Employee.create({
    name: 'EcoSphere Admin',
    email: ADMIN_EMAIL,
    passwordHash: ADMIN_PASSWORD,
    role: 'admin',
    department: departments[2]._id, // Corporate
  });

  const employees = [admin];
  for (let i = 0; i < 20; i++) {
    const dept = faker.helpers.arrayElement(departments);
    const emp = await Employee.create({
      name: faker.person.fullName(),
      email: `emp${i + 1}@ecosphere.com`,
      passwordHash: USER_PASSWORD,
      role: 'user',
      department: dept._id,
      xp: 0,
      points: 0,
    });
    employees.push(emp);
  }
  const standardUsers = employees.slice(1);
  // NOTE: Department.employeeCount is no longer set manually here - the
  // Employee model's post-save hook (models/Employee.ts) already kept it
  // accurate automatically as each employee above was created.

  /* --------------------------- Policy Acknowledgements ---------------------------- */
  // Gap Fix: previously PolicyAcknowledgement was never actually seeded at
  // all, despite being a core Governance transactional model. Each employee
  // acknowledges each policy with ~70% probability, giving the Governance
  // score's policy-acknowledgement component (and the daily reminder cron,
  // which nudges whoever's left) real, mixed data to demo.
  console.log('✅ Seeding policy acknowledgements...');
  for (const emp of standardUsers) {
    for (const policy of esgPolicies) {
      if (faker.datatype.boolean({ probability: 0.7 })) {
        await PolicyAcknowledgement.create({
          employee: emp._id,
          department: emp.department,
          policy: policy._id,
          version: policy.version,
        });
      }
    }
  }

  /* ------------------------------ CSR Activities --------------------------- */
  console.log('🤝 Creating CSR activities + participation...');
  const csrActivities = await Promise.all(
    ['Tree Plantation Drive', 'Coastal Beach Cleanup', 'Community Blood Donation Camp'].map((title, idx) =>
      CSRActivity.create({
        title,
        category: csrCategories[idx]._id,
        description: faker.lorem.sentence(),
        date: faker.date.recent({ days: 30 }),
        location: faker.location.city(),
        expectedParticipants: 20,
        status: 'Active',
      })
    )
  );

  for (const activity of csrActivities) {
    const participants = faker.helpers.arrayElements(standardUsers, { min: 4, max: 8 });
    for (const emp of participants) {
      const approvalStatus = faker.helpers.arrayElement(['Approved', 'Approved', 'Pending', 'Rejected'] as const);
      const points = approvalStatus === 'Approved' ? faker.number.int({ min: 10, max: 40 }) : 0;

      // Gap Fix: previously ONLY non-Pending rows got a proofUrl, meaning
      // every Pending row was permanently unapprovable whenever Evidence
      // Requirement is enabled (the default) - there was no way to demo a
      // successful approval without first disabling that setting. Now ~60%
      // of Pending rows also get proof attached, giving a realistic mix:
      // some approvable immediately, some correctly blocked until evidence
      // is provided - which is itself a good feature to demo, not a bug.
      const hasProof = approvalStatus !== 'Pending' || faker.datatype.boolean({ probability: 0.6 });

      await EmployeeParticipation.create({
        employee: emp._id,
        department: emp.department,
        activity: activity._id,
        proofUrl: hasProof ? SEED_PROOF_PATH : undefined,
        approvalStatus,
        pointsEarned: points,
        completionDate: approvalStatus !== 'Pending' ? faker.date.recent({ days: 20 }) : undefined,
      });

      if (points > 0) {
        emp.points += points;
        emp.xp += points;
        await emp.save(); // triggers Auto-Award Badge Engine
      }
    }
  }

  /* -------------------------------- Challenges ------------------------------ */
  console.log('🏅 Creating challenges + participation...');
  const challengeDefs = [
    { title: 'Sustainability Sprint', difficulty: 'Hard' as const, xp: 200, status: 'Active' as const },
    { title: 'Recycle Challenge', difficulty: 'Easy' as const, xp: 80, status: 'Active' as const },
    { title: 'Commute Green Week', difficulty: 'Medium' as const, xp: 120, status: 'Draft' as const },
  ];
  const challenges = await Promise.all(
    challengeDefs.map((c, idx) =>
      Challenge.create({
        title: c.title,
        category: challengeCategories[idx % challengeCategories.length]._id,
        description: faker.lorem.sentence(),
        xp: c.xp,
        difficulty: c.difficulty,
        evidenceRequired: true,
        deadline: faker.date.future({ years: 0.2 }),
        status: c.status,
      })
    )
  );

  for (const challenge of challenges.filter((c) => c.status === 'Active')) {
    const participants = faker.helpers.arrayElements(standardUsers, { min: 3, max: 7 });
    for (const emp of participants) {
      const approvalStatus = faker.helpers.arrayElement(['Approved', 'Pending'] as const);
      const xpAwarded = approvalStatus === 'Approved' ? challenge.xp : 0;

      await ChallengeParticipation.create({
        challenge: challenge._id,
        employee: emp._id,
        department: emp.department,
        progress: approvalStatus === 'Approved' ? 100 : faker.number.int({ min: 10, max: 90 }),
        proofUrl: approvalStatus === 'Approved' ? SEED_PROOF_PATH : undefined,
        approvalStatus,
        xpAwarded,
      });

      if (xpAwarded > 0) {
        emp.xp += xpAwarded;
        emp.completedChallenges += 1;
        await emp.save(); // triggers Auto-Award Badge Engine
      }
    }
  }

  /* --------------------------- Audits & Compliance --------------------------- */
  console.log('🕵️  Creating audits + compliance issues...');
  const audits = await Promise.all(
    departments.slice(0, 3).map((dept) =>
      Audit.create({
        title: `Q2 ${dept.name} Audit`,
        department: dept._id,
        auditor: faker.person.fullName(),
        date: faker.date.recent({ days: 45 }),
        findings: `${faker.number.int({ min: 0, max: 3 })} minor issues found`,
        status: faker.helpers.arrayElement(['Completed', 'Under Review']),
      })
    )
  );

  for (const audit of audits) {
    // 2 issues per audit for a livelier demo (6 total across 3 audits)
    for (let j = 0; j < 2; j++) {
      const owner = faker.helpers.arrayElement(standardUsers);
      await ComplianceIssue.create({
        audit: audit._id,
        department: audit.department,
        severity: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
        description: faker.helpers.arrayElement([
          'Missing MSDS sheets for hazardous materials',
          'Late vendor disclosure submission',
          'Incomplete safety training records',
          'Unresolved water discharge permit renewal',
        ]),
        owner: owner._id,
        // Deliberately in the past for ~half of these, so the hourly cron job
        // has real overdue issues to escalate during your demo.
        dueDate: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : faker.date.future({ years: 0.1 }),
        status: 'Open',
      });
    }
  }

  /* ------------------------------ Diversity Metrics --------------------------- */
  console.log('📊 Creating diversity metrics...');
  const currentPeriod = new Date().toISOString().slice(0, 7);
  for (const dept of departments) {
    const total = faker.number.int({ min: 8, max: 25 });
    const female = faker.number.int({ min: 2, max: total - 2 });
    const other = faker.number.int({ min: 0, max: 1 });
    const male = Math.max(0, total - female - other);
    await DiversityMetric.create({
      department: dept._id,
      period: currentPeriod,
      headcountTotal: total,
      headcountFemale: female,
      headcountMale: male,
      headcountOther: other,
    });
  }

  /* ------------------------------ Training Programs --------------------------- */
  console.log('🎓 Creating training programs + completions...');
  const trainingDefs = [
    { title: 'Workplace Safety Fundamentals', mandatory: true },
    { title: 'Anti-Harassment & Code of Conduct', mandatory: true },
    { title: 'Sustainability 101', mandatory: false },
  ];
  for (const t of trainingDefs) {
    const program = await TrainingProgram.create({
      title: t.title,
      description: faker.lorem.sentence(),
      mandatory: t.mandatory,
      dueDate: faker.date.future({ years: 0.2 }),
    });

    for (const emp of standardUsers) {
      const status = faker.helpers.arrayElement(['Assigned', 'Assigned', 'Completed'] as const);
      await TrainingCompletion.create({
        employee: emp._id,
        department: emp.department,
        trainingProgram: program._id,
        status,
        completedAt: status === 'Completed' ? faker.date.recent({ days: 15 }) : undefined,
      });
    }
  }

  /* ----------------------------- Carbon Transactions -------------------------- */
  console.log('🌍 Creating 130 carbon transactions sequentially (preserves hash-chain order)...');
  const sources = ['Purchase', 'Manufacturing', 'Expense', 'Fleet'] as const;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  for (let i = 0; i < 130; i++) {
    const dept = departments[i % departments.length];
    const factor = faker.helpers.arrayElement(emissionFactors);
    const quantity = faker.number.int({ min: 10, max: 500 });
    const timestamp = new Date(startDate.getTime() + i * 16 * 60 * 60 * 1000); // spread ~16h apart

    const tx = new CarbonTransaction({
      department: dept._id,
      emissionFactor: factor._id,
      source: faker.helpers.arrayElement(sources),
      quantity,
      calculatedCO2e: quantity * factor.factorValue,
      timestamp,
      createdBy: admin._id,
    });
    await tx.save(); // sequential .save() -> anomaly detection + hash chain run correctly in order
  }

  // A handful of deliberate anomalies (>=10x a department's average) so the
  // Anomaly Detection feature has something real to flag for your demo.
  console.log('🚨 Injecting 3 deliberate anomalies for demo purposes...');
  for (let i = 0; i < 3; i++) {
    const dept = departments[i];
    const factor = emissionFactors[0];
    const hugeQuantity = 8000; // far beyond normal 10-500 range above
    const tx = new CarbonTransaction({
      department: dept._id,
      emissionFactor: factor._id,
      source: 'Manufacturing',
      quantity: hugeQuantity,
      calculatedCO2e: hugeQuantity * factor.factorValue,
      timestamp: new Date(),
      createdBy: admin._id,
    });
    await tx.save();
  }

  /* --------------------------- Environmental Goals ------------------------- */
  // Created HERE (after transactions, not before) and seeded with each
  // department's REAL accumulated confirmed CO2e as the starting currentCO2 -
  // deliberately NOT relying on the CarbonTransaction post-save hook to
  // backfill this retroactively, since that hook only affects transactions
  // saved AFTER a matching goal already exists. Every goal created after this
  // point (including these) will continue to accumulate live via that hook
  // as new transactions come in.
  console.log('🎯 Creating environmental goals from real accumulated emissions...');
  const departmentTotals = await CarbonTransaction.aggregate([
    { $match: { status: 'Confirmed' } },
    { $group: { _id: '$department', total: { $sum: '$calculatedCO2e' } } },
  ]);
  const totalsByDept = new Map<string, number>(departmentTotals.map((d: any) => [String(d._id), Number(d.total)]));

  for (const [idx, dept] of departments.entries()) {
    const currentCO2 = Math.round(totalsByDept.get(String(dept._id)) || 0);
    // Mix of "on track" (plenty of headroom left -> healthy score) and
    // "at risk" (already near/over budget -> low score) for demo variety.
    // Multiplier ranges are tuned against the scoring formula above
    // (100 * (1 - current/target)), which is intentionally steep near the
    // target boundary - a department "on track" needs real headroom (2-3.5x
    // current usage) to actually show a healthy score, not just any target
    // nominally larger than current.
    const onTrack = idx % 2 === 0;
    const targetCO2 = Math.max(
      500,
      Math.round(currentCO2 * (onTrack ? faker.number.float({ min: 2.0, max: 3.5 }) : faker.number.float({ min: 0.9, max: 1.1 })))
    );

    await EnvironmentalGoal.create({
      title: `Reduce ${dept.name} Emissions`,
      description: `Cut ${dept.name.toLowerCase()} carbon output through efficiency initiatives`,
      department: dept._id,
      targetCO2,
      currentCO2,
      deadline: faker.date.future({ years: 0.5 }),
      status: 'Active',
    });
  }

  /* ------------------------- Historical Score Snapshots ------------------------ */
  // Powers the dashboard's "Emission Trend (12 mo)" style chart, which needs
  // real history to plot - not just the one live snapshot. We compute the
  // CURRENT live score once, then backfill 11 prior months with plausible
  // jitter trending toward it, so day-one of your demo already has a chart.
  console.log('📈 Backfilling 12 months of ESG score history for trend charts...');
  const { departments: liveScores, weighting } = await computeDepartmentScores();

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    const period = d.toISOString().slice(0, 7);

    for (const dept of liveScores) {
      let environmentalScore: number;
      let socialScore: number;
      let governanceScore: number;
      let totalScore: number;

      const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n * 10) / 10));

      if (monthsAgo === 0) {
        // Current month = exactly the live computed score, no jitter.
        environmentalScore = dept.environmentalScore;
        socialScore = dept.socialScore;
        governanceScore = dept.governanceScore;
        totalScore = dept.totalScore;
      } else {
        // Older months trend slightly worse than "now", with random jitter -
        // simulates gradual improvement over the year rather than a flat line.
        const improvementFactor = monthsAgo * faker.number.float({ min: 0.5, max: 1.5 });
        const jitter = () => faker.number.float({ min: -4, max: 4 });

        environmentalScore = clamp(dept.environmentalScore - improvementFactor + jitter());
        socialScore = clamp(dept.socialScore - improvementFactor + jitter());
        governanceScore = clamp(dept.governanceScore - improvementFactor + jitter());
        totalScore = clamp(
          environmentalScore * weighting.environmental + socialScore * weighting.social + governanceScore * weighting.governance
        );
      }

      await DepartmentScore.findOneAndUpdate(
        { department: dept._id, period },
        {
          department: dept._id,
          period,
          environmentalScore,
          socialScore,
          governanceScore,
          totalScore,
          computedAt: new Date(),
        },
        { upsert: true }
      );
    }
  }

  console.log('\n✅ Seed complete!\n');
  console.log('──────────────────────────────────────────────');
  console.log(' Login credentials:');
  console.log(`   Admin -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Users -> emp1@ecosphere.com ... emp20@ecosphere.com / ${USER_PASSWORD}`);
  console.log('──────────────────────────────────────────────\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed script failed:', err);
  process.exit(1);
});
