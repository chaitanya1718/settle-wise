The following anomalies were identified and handled during CSV ingestion.

| Anomaly              | Severity | Handling Strategy           |
| -------------------- | -------- | --------------------------- |
| AMBIGUOUS_ROW        | HIGH     | Skip row and record anomaly |
| NEGATIVE_AMOUNT      | HIGH     | Skip row and record anomaly |
| ZERO_AMOUNT          | HIGH     | Skip row and record anomaly |
| INVALID_DATE         | HIGH     | Skip row and record anomaly |
| MISSING_PAYER        | HIGH     | Skip row and record anomaly |
| MISSING_PARTICIPANT  | HIGH     | Skip row and record anomaly |
| SELF_SETTLEMENT      | HIGH     | Skip row and record anomaly |
| UNKNOWN_SPLIT_TYPE   | HIGH     | Skip row and record anomaly |
| INVALID_MEMBER       | HIGH     | Skip row and record anomaly |
| MEMBERSHIP_VIOLATION | HIGH     | Skip row and record anomaly |
| MIXED_CURRENCY       | MEDIUM   | Flag for review             |
| DUPLICATE_EXPENSE    | LOW      | Flag for review             |

Import Policy

High severity anomalies:
*Block import
*Require explicit review

Medium severity anomalies:
*Flagged for manual approval

Low severity anomalies:
*May be approved or rejected during review workflow


Database Schema

#Core Entities

#User

Stores system users.

#Group

Represents a shared expense group.

#GroupMembership

Tracks group participation using:

*joinedAt
*leftAt

#Expense

Stores expense transactions.

#ExpenseParticipant

Stores participant-level expense shares.

#Settlement

Stores debt settlement transactions.

#ImportJob

Tracks CSV import operations.

#ImportAnomaly

Tracks anomalies detected during CSV analysis.


#Assignment Requirement Mapping

#Aisha

Implemented through:

*Balance engine
*Debt simplification
*Settlement recommendations

#Rohan

Implemented through:

*Expense breakdown endpoints
*Traceable participant shares

#Priya & Sam

Implemented through:

*Currency validation
*Membership timeline validation

#Meera
Implemented through:

*Import review workflow
*Approval / rejection process
