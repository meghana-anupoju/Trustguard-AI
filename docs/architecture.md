# Trustguard AI — Architecture and Demo Flow

## Architecture

```mermaid
flowchart LR
  Analyst[Brand analyst] --> UI[React + TypeScript dashboard]
  UI -->|Brand profile GET / PUT| API[Express API]
  UI -->|Run scan POST| API
  UI -->|Import JSON candidates| API
  API -->   DB[(Managed PostgreSQL hosted / SQLite local)]
  DB --> Profile[Saved brand profile]
  DB --> History[Scan history]
  DB --> Imports[Imported candidate records]
  DB --> Cases[Investigation decisions and audit history]
  API --> Profile
  API --> Imports
  API --> Sources[Sample candidate dataset]
  API --> Bluesky[Bluesky public actor search API]
  API --> Apple[Apple App Store Search API]
  Sources --> Social[Social profile candidates]
  Sources --> Apps[Mobile app candidates]
  Bluesky --> Social
  Apple --> Apps
  Profile --> Exclusion[Official asset matching]
  Social --> Exclusion
  Apps --> Exclusion
  Exclusion --> Detection[Similarity, keyword, publisher and package checks]
  Detection --> Risk[Risk score and reasons]
  Risk --> API
  API --> Cases
  API --> UI
```

## Data sources and limitations

- Social results come from the **Bluesky public actor search API**; app results come from the **Apple App Store Search API**. These are best-effort public search sources, not comprehensive monitoring, and availability/rate limits are shown in the UI. Provider searches run only when the analyst explicitly starts a scan.
- The checked-in social-profile and app-store candidates are **synthetic demo records** and remain in scans as labeled examples.
- Instagram, Facebook, LinkedIn, X, TikTok, Telegram, Google Play, and Amazon are not connected. Broad monitoring on those services requires additional authorized provider APIs or customer-supplied exports.
- The backend persists brand profiles, imported candidates, scan history, and investigation decisions/history in PostgreSQL when `DATABASE_URL` is configured; local development defaults to SQLite at `data/brandshield.sqlite`. Render's service filesystem is ephemeral, so hosted deployments need managed PostgreSQL. `DATABASE_SSL=true` enables TLS when required by the provider.
- Investigation updates are exposed through `GET /api/investigations` and `PUT /api/investigations/:id`. The current demo attributes audit events to the generic `Analyst` role; it does not provide authenticated multi-user identity or tenant isolation.
- High-risk alerts are generated once per detection and dismissed alert IDs are retained in browser storage. They are in-app alerts, not external email, SMS, or push notifications.
- Live monitoring requires authorized provider APIs or customer-supplied exports/connectors. Provider credentials and access approval are not included in this repository.
- The diagram distinguishes API integration points from sources that are currently implemented, so it must not be presented as a live ingestion pipeline.

## Detection and official-asset exclusion

1. Analysts define official names, domains, social accounts, apps, package IDs, publishers, and optional logo in Brand Profile.
2. The profile is saved through the API to PostgreSQL in hosting or SQLite locally, and used for subsequent scans.
3. Analysts can import exported candidates as JSON; `POST /api/candidates` validates and stores up to 500 candidate records per request. `GET /api/candidates` returns saved imports so the frontend can restore them after a reload.
4. Candidate profiles/apps are checked against official social usernames/URLs and app package IDs/store URLs/name-publisher pairs.
5. Exact registered assets are marked official, receive risk score zero, and are excluded from threat alerts.
6. Remaining candidates are compared with the closest registered official asset using edit distance with adjacent transpositions, name containment, suspicious impersonation terms, scam phrases, verification state, supplied logo-similarity scores, description overlap, app publisher, and package ID.
7. Analyst-configured name and risk thresholds are applied to each scan.
8. Only candidates with brand-related signals and supporting risk indicators are returned as possible threats. Scores are triage signals, not proof of malicious intent.
9. Each scan reports provider availability and record counts and is saved to SQLite; a failed live provider does not silently masquerade as a live result.
10. Analysts review the default high-risk queue, confirm or dismiss cases, add notes, and view timestamped status/note history. Confirmed cases can produce a cautious text report draft based on the stored evidence.

## Short judging demo (about 2 minutes)

1. Open Brand Profile and show the official account, app, package ID, domains, and publisher.
2. Run a scan and call out that the source is the sample dataset, not live platform monitoring.
3. Show that registered official social/app assets are excluded and counted separately.
4. Open Social Monitoring and explain the look-alike/transposition and scam-language indicators.
5. Open App Monitoring and show how similar names plus an unknown publisher/package ID increase risk.
6. Review a high-risk record's closest official asset and triggered evidence; dismiss one as a false positive and confirm another.
7. Show the investigation timeline and generate the report draft for the confirmed case.
8. Show an unrelated legitimate profile/app remaining unflagged in the detector tests.
9. Close with the production path: authorized social/store API connectors, authenticated analyst identity, tenant isolation, and external operational alerting.
