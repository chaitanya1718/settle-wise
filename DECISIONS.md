#Decision 1: PostgreSQL + Prisma

Options Considered

*MongoDB + Mongoose
*PostgreSQL + Prisma

Decision
PostgreSQL + Prisma
Reason:
The assignment requires relational data:

*Users
*Groups
*Membership timelines
*Expenses
*Participants
*Settlements

These relationships are naturally represented in a relational database.
Prisma additionally provides schema validation and strong query abstractions.

#Decision 2: Preserve Membership History
Options Considered
1.Delete memberships when users leave.
2.Preserve memberships using joinedAt and leftAt.

Decision
Preserve history.
Reason:
Expense attribution depends on who was a member at a particular point in time.

Historical membership data is required for anomaly detection and auditability.

#Decision 3: Soft Validation During Import
Options Considered
1.Reject entire CSV.
2.Import everything.
3.Record anomalies and review manually.

Decision
Manual review workflow.

Reason:
The assignment specifically highlights messy real-world data.
Allowing users to inspect anomalies before import improves transparency and prevents accidental data corruption.

#Decision 4: Greedy Debt Simplification
Options Considered

1.Direct pairwise balances.
2.Greedy settlement optimization.

Decision
Greedy settlement optimization.

Reason:
Produces fewer transfers and creates a clearer "who owes whom" summary.

This directly addresses Aisha's primary requirement.


#Decision 5: Import Approval Workflow
Options Considered
1.Auto-fix anomalies.
2.Manual review.

Decision
Manual review.

Reason:
The assignment emphasizes traceability.
Approvals and rejections provide an audit trail and satisfy Meera's requirement for review before modification.

#Decision 6: Equal Split First

Options Considered
*Implement all split types immediately.
*Fully implement EQUAL split and scaffold others.

Decision
Prioritize EQUAL split.

Reason:
The majority of sample data used equal splits.
This allowed deeper validation, testing, and anomaly handling within the project deadline.
