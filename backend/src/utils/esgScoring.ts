import mongoose from 'mongoose';
import { getSettings } from './settingsCache';

/**
 * ============================================================================
 * Shared ESG Scoring Logic
 * ============================================================================
 * Extracted out of routes/reports.routes.ts so both the live
 * GET /api/reports/esg-score endpoint AND the monthly snapshot cron job
 * (see cron/complianceCron.ts) share exactly one aggregation implementation -
 * no risk of the two drifting out of sync.
 *
 * Weighting is now read from Settings (Gap Fix: the original build hardcoded
 * 0.4/0.3/0.3 directly in the pipeline; the business workflow doc explicitly
 * says weighting is "configurable per organization").
 * ==========================================================================*/
export interface IDepartmentScoreResult {
  _id: string;
  name: string;
  code: string;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  totalScore: number;
  rank: number;
}

export async function computeDepartmentScores(): Promise<{
  departments: IDepartmentScoreResult[];
  organizationOverallScore: number;
  weighting: { environmental: number; social: number; governance: number };
}> {
  const Department = mongoose.model('Department');
  const ESGPolicy = mongoose.model('ESGPolicy');
  const settings = await getSettings();
  const { environmental: wE, social: wS, governance: wG } = settings.esgWeighting;

  // Computed once here (not per-department) and injected as a literal into
  // the pipeline below - see the governance score section.
  const mandatoryPolicyCount = await ESGPolicy.countDocuments({
    mandatoryAcknowledgement: true,
    isActive: { $ne: false },
  });

  // NOTE: aggregate() does NOT go through the softDeletePlugin's pre-find
  // middleware (that only patches `find`-style queries) - hence the explicit
  // isActive match as the very first stage.
  const pipeline: any[] = [
    { $match: { isActive: { $ne: false } } },

    // --- Environmental: remaining "carbon budget" headroom against each goal ---
    // targetCO2 is treated as a ceiling/budget: score = 100 * (1 - current/target),
    // clamped to [0, 100]. 0 emissions -> 100. At-target -> 0. Over-target -> clamps at 0.
    { $lookup: { from: 'environmentalgoals', localField: '_id', foreignField: 'department', as: 'goals' } },
    {
      $addFields: {
        environmentalScore: {
          $cond: [
            { $eq: [{ $size: '$goals' }, 0] },
            100,
            {
              $avg: {
                $map: {
                  input: '$goals',
                  as: 'g',
                  in: {
                    $max: [
                      0,
                      {
                        $min: [
                          100,
                          {
                            $multiply: [
                              { $subtract: [1, { $divide: ['$$g.currentCO2', { $max: ['$$g.targetCO2', 1] }] }] },
                              100,
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    },

    // --- Social: blend of CSR approval rate + Challenge approval rate + training completion rate ---
    // (Business Workflow diagram lists "Employee Participation (CSR)" and
    // "Challenge Participation" as separate inputs feeding the scores - both
    // are now represented here, not just CSR alone.)
    {
      $lookup: {
        from: 'employeeparticipations',
        localField: '_id',
        foreignField: 'department',
        as: 'csrParticipation',
      },
    },
    {
      $addFields: {
        csrApprovalRate: {
          $cond: [
            { $eq: [{ $size: '$csrParticipation' }, 0] },
            null,
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$csrParticipation',
                          as: 'p',
                          cond: { $eq: ['$$p.approvalStatus', 'Approved'] },
                        },
                      },
                    },
                    { $size: '$csrParticipation' },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'challengeparticipations',
        localField: '_id',
        foreignField: 'department',
        as: 'challengeParticipation',
      },
    },
    {
      $addFields: {
        challengeApprovalRate: {
          $cond: [
            { $eq: [{ $size: '$challengeParticipation' }, 0] },
            null,
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$challengeParticipation',
                          as: 'c',
                          cond: { $eq: ['$$c.approvalStatus', 'Approved'] },
                        },
                      },
                    },
                    { $size: '$challengeParticipation' },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'trainingcompletions',
        localField: '_id',
        foreignField: 'department',
        as: 'trainings',
      },
    },
    {
      $addFields: {
        trainingCompletionRate: {
          $cond: [
            { $eq: [{ $size: '$trainings' }, 0] },
            null,
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: { input: '$trainings', as: 't', cond: { $eq: ['$$t.status', 'Completed'] } },
                      },
                    },
                    { $size: '$trainings' },
                  ],
                },
                100,
              ],
            },
          ],
        },
      },
    },
    {
      // $avg on an array ignores non-numeric (null) entries, so this cleanly
      // averages whichever of the three rates actually have data, without a
      // combinatorial $switch over every possible null combination.
      $addFields: {
        socialScore: {
          $let: {
            vars: {
              availableRates: {
                $filter: {
                  input: ['$csrApprovalRate', '$challengeApprovalRate', '$trainingCompletionRate'],
                  as: 'r',
                  cond: { $ne: ['$$r', null] },
                },
              },
            },
            in: { $cond: [{ $eq: [{ $size: '$$availableRates' }, 0] }, 50, { $avg: '$$availableRates' }] },
          },
        },
      },
    },

    // --- Governance: blend of (100 - weighted open-issue penalty) + policy acknowledgement rate ---
    // (Section 6 groups "Policy Acknowledgements" under Governance features,
    // and the Business Workflow diagram lists it as a scoring input alongside
    // Audits - previously only compliance issues were reflected here.)
    { $lookup: { from: 'complianceissues', localField: '_id', foreignField: 'department', as: 'issues' } },
    {
      $addFields: {
        openIssuesPenalty: {
          $sum: {
            $map: {
              input: { $filter: { input: '$issues', as: 'i', cond: { $eq: ['$$i.status', 'Open'] } } },
              as: 'oi',
              in: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$$oi.severity', 'High'] }, then: 20 },
                    { case: { $eq: ['$$oi.severity', 'Medium'] }, then: 10 },
                  ],
                  default: 5,
                },
              },
            },
          },
        },
      },
    },
    { $addFields: { complianceHealthScore: { $max: [0, { $subtract: [100, '$openIssuesPenalty'] }] } } },

    { $lookup: { from: 'policyacknowledgements', localField: '_id', foreignField: 'department', as: 'policyAcks' } },
    // Live headcount via $lookup rather than trusting the stored
    // Department.employeeCount field for this calculation - see the sync
    // hook in models/Employee.ts, which keeps that stored field accurate for
    // display purposes, but a live count here is self-correcting regardless.
    {
      $lookup: {
        from: 'employees',
        let: { deptId: '$_id' },
        pipeline: [{ $match: { $expr: { $eq: ['$department', '$$deptId'] }, isActive: { $ne: false } } }],
        as: 'activeEmployees',
      },
    },
    {
      $addFields: {
        liveEmployeeCount: { $size: '$activeEmployees' },
        policyAcknowledgementRate: {
          $cond: [
            { $or: [{ $eq: [{ $size: '$activeEmployees' }, 0] }, { $eq: [mandatoryPolicyCount, 0] }] },
            null, // nothing mandatory to acknowledge, or no employees -> don't penalize
            {
              $min: [
                100,
                {
                  $multiply: [
                    {
                      $divide: [
                        { $size: '$policyAcks' },
                        { $multiply: [{ $size: '$activeEmployees' }, mandatoryPolicyCount] },
                      ],
                    },
                    100,
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        governanceScore: {
          $let: {
            vars: {
              availableRates: {
                $filter: {
                  input: ['$complianceHealthScore', '$policyAcknowledgementRate'],
                  as: 'r',
                  cond: { $ne: ['$$r', null] },
                },
              },
            },
            in: { $avg: '$$availableRates' }, // complianceHealthScore is never null, so this always has >=1 element
          },
        },
      },
    },

    // --- Weighted overall score (weighting pulled from Settings, not hardcoded) ---
    {
      $addFields: {
        totalScore: {
          $round: [
            {
              $add: [
                { $multiply: ['$environmentalScore', wE] },
                { $multiply: ['$socialScore', wS] },
                { $multiply: ['$governanceScore', wG] },
              ],
            },
            1,
          ],
        },
      },
    },

    {
      $project: {
        name: 1,
        code: 1,
        environmentalScore: { $round: ['$environmentalScore', 1] },
        socialScore: { $round: ['$socialScore', 1] },
        governanceScore: { $round: ['$governanceScore', 1] },
        totalScore: 1,
      },
    },

    // Department ESG Ranking (Gap Fix - Section 9 Bonus Idea + Screenshot 1's
    // "Department ESG Ranking" chart): sort best-to-worst right in the pipeline.
    { $sort: { totalScore: -1 } },
  ];

  const raw = await Department.aggregate(pipeline);
  const departments: IDepartmentScoreResult[] = raw.map((d: any, idx: number) => ({ ...d, rank: idx + 1 }));

  const organizationOverallScore =
    departments.length === 0
      ? 0
      : Math.round((departments.reduce((sum, d) => sum + d.totalScore, 0) / departments.length) * 10) / 10;

  return {
    departments,
    organizationOverallScore,
    weighting: { environmental: wE, social: wS, governance: wG },
  };
}

/**
 * Persists the current live scores into DepartmentScore, one upserted
 * document per department for the CURRENT period (e.g. "2026-07"). Called
 * monthly by cron (see cron/complianceCron.ts) so the "Emission Trend (12 mo)"
 * style dashboard chart has real historical points to plot, not just one.
 */
export async function snapshotDepartmentScores(periodOverride?: string): Promise<number> {
  const DepartmentScore = mongoose.model('DepartmentScore');
  const { departments } = await computeDepartmentScores();

  const period = periodOverride || new Date().toISOString().slice(0, 7); // "YYYY-MM"

  await Promise.all(
    departments.map((d) =>
      DepartmentScore.findOneAndUpdate(
        { department: d._id, period },
        {
          department: d._id,
          period,
          environmentalScore: d.environmentalScore,
          socialScore: d.socialScore,
          governanceScore: d.governanceScore,
          totalScore: d.totalScore,
          computedAt: new Date(),
        },
        { upsert: true, new: true }
      )
    )
  );

  return departments.length;
}
