# TrustOps marketplace position

## Category

TrustOps is positioned as a **digital-resilience operations workspace** for
Singapore SMEs and the managed service providers that support them. It combines
the operating picture normally split across observability, security monitoring,
incident management, and runbook tools. The portfolio prototype demonstrates
the workflow and architecture; it is not sold as a replacement for an
enterprise SIEM, EDR, or observability platform.

## Problem worth solving

Mid-market organisations often have monitoring data but limited specialist
coverage. Reliability alerts, identity detections, cloud findings, tickets, and
runbooks live in different systems. During an incident, engineers spend time
reconstructing business impact and deciding who is authorised to act. TrustOps
creates a shared, tenant-safe response path:

```text
SRE signal + cyber signal
  -> correlated incident and business impact
  -> evidence-linked AI-assisted hypothesis
  -> policy check and human decision
  -> controlled runbook execution
  -> recovery verification and audit evidence
```

## Buyers and users

| Buyer | Buying concern | Daily users | TrustOps outcome |
| --- | --- | --- | --- |
| Managed service provider | Serve more customers without losing tenant control | NOC engineers, SREs, service managers | One portfolio view with isolated tenant workspaces |
| Managed security provider | Join cyber evidence to operational impact | SOC analysts, incident responders | Correlated detection, asset, service, and incident context |
| SME technology leader | Improve resilience without building separate specialist teams | IT manager, infrastructure engineer | Clear priorities, approval workflow, and executive impact |
| Regulated mid-market operator | Show who decided and what changed | Risk owner, auditor, operations lead | Attributed decisions, verification, and exportable audit history |

## Initial industry packs

The platform remains horizontal while industry packs provide relevant assets,
services, risks, language, runbooks, and dashboards.

- **Logistics and supply chain:** dispatch, shipment visibility, warehouse
  scanning, depot connectivity, and customer delivery commitments.
- **Private healthcare:** booking, clinic queues, secure record exchange,
  patient-flow continuity, and stricter data-access controls.
- **Professional services:** workforce identity, document workflows, client
  portals, and confidential-data handling.
- **Future packs:** retail and e-commerce, property and facilities management,
  education providers, light manufacturing, and multi-site professional SMEs.

## Differentiation

1. **Reliability and security share one incident.** TrustOps relates SLO burn,
   deployments, identity activity, cloud posture, and business impact instead of
   presenting separate alert queues.
2. **AI output remains explainable.** Every hypothesis includes confidence,
   cited evidence, counter-evidence, limitations, and a visible simulation label.
3. **Automation is governed.** A deterministic tenant-and-role policy gate and
   an authorised human stand between a recommendation and consequential action.
4. **MSP tenancy is a first-class boundary.** The portfolio view is useful across
   customers while every detail query remains scoped to an authorised tenant.
5. **Infrastructure is reproducible.** The AWS reference is Terraform-defined,
   cost-gated, and disabled by default rather than depending on console-created
   resources.

## Route to market

- Start with Singapore MSP/MSSP design partners managing 10–100 SME customers.
- Deliver a time-boxed resilience assessment using synthetic or read-only data.
- Convert successful assessments into a managed operations workspace.
- Add industry packs through MSP partners and cloud consultancies.
- Build channels through AWS partners, cybersecurity consultancies, and SME
  digitalisation programmes after security and compliance readiness.

## Commercial model hypothesis

This is a hypothesis for customer discovery, not validated pricing.

- Platform subscription per managed organisation.
- Usage tier based on monitored services/assets and telemetry volume.
- Optional industry pack and compliance-reporting add-ons.
- Paid onboarding for integrations, runbook review, and service mapping.
- Enterprise/MSP plan for portfolio analytics, custom retention, SSO, and
  dedicated support.

The prototype deliberately avoids displaying invented revenue or market-size
claims. A real business case would validate willingness to pay, acquisition
cost, onboarding effort, gross margin, retention, and regulatory obligations
with design partners.

## Marketplace proof represented in this repository

- A multi-company portfolio view and three credible industry demonstrations.
- SRE, SOC, cyber-exposure, incident, AI-analysis, automation, analytics,
  infrastructure, and audit workspaces.
- A governed action model suitable for conversations with operational and risk
  stakeholders.
- Container, CI, security scanning, runbooks, and Terraform reference
architecture showing a path beyond a visual prototype.
