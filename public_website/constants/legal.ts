import { LegalDocument } from '../types';

export const LEGAL_DOCS: Record<string, LegalDocument> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'This Privacy Policy describes how Craviti Technologies Private Limited ("Craviti", "we", "us", or "our") collects, uses, shares, and protects the personal information of restaurant merchants, operating staff, and dining patrons who interact with our contactless ordering platform.',
    sections: [
      {
        id: 'information-we-collect',
        title: '1. Information We Collect',
        content: `
We collect information directly from you when you register a restaurant account, visit our public website, or scan a table QR code to place a dining order.

**A. Merchant Information:**
- Business Details: Restaurant trade name, registered corporate name, GSTIN, FSSAI license number, registered business address, and operational phone numbers.
- Banking & Payout Data: Bank account number, IFSC code, branch address, canceled cheque copy, passbook image, and PAN card for payout verification and settlement compliance.
- Account Credentials: Authorized email addresses, encrypted passwords, and RBAC staff credentials.

**B. Dining Patron (Customer) Information:**
- Order Details: Selected menu items, table number identifier, dietary modifications, order timestamps, and invoice amounts.
- Contact Details: Optional customer name, phone number, and email address provided for receipt delivery and loyalty points.
- Payment Information: Transaction references, payment method (UPI, Card, NetBanking, Cash), and gateway authorization tokens. We do not store raw credit card numbers or banking PINs.
        `,
      },
      {
        id: 'how-we-use-information',
        title: '2. How We Use Your Information',
        content: `
Craviti uses collected data to execute and optimize our core restaurant operating services:
- Transmitting guest orders instantaneously to kitchen stations and billing counters via real-time WebSockets.
- Processing payment authorizations and automated T+1 merchant bank settlements through certified gateways.
- Generating deterministic digital tax invoices and PDF receipts for customers.
- Providing operational analytics, revenue summaries, and peak hour heatmaps for restaurant owners.
- Preventing fraud, duplicate payment claims, and unauthorized chargebacks.
- Complying with statutory requirements under the Information Technology Act, 2000 and GST regulations.
        `,
      },
      {
        id: 'data-sharing-and-disclosure',
        title: '3. Data Sharing & Third-Party Processors',
        content: `
We never sell, rent, or monetize your personal or dining data to third-party advertisers. We disclose data solely to trusted infrastructure partners bound by strict confidentiality:
- **Payment Gateway:** Razorpay Software Private Limited for payment tokenization and banking settlement execution.
- **Cloud Infrastructure:** MongoDB Atlas and AWS Data Centers located within Indian jurisdiction for database persistence.
- **Communication Infrastructure:** Twilio / Gupshup for SMS/WhatsApp digital receipt delivery and acoustic notification routing.
- **Legal & Regulatory Authorities:** When mandatory by law, court order, or governmental tax audit.
        `,
      },
      {
        id: 'data-security-retention',
        title: '4. Data Security & Retention',
        content: `
All data in transit is encrypted using TLS 1.3 with SHA-256 HMAC authentication. Data at rest is encrypted using AES-256 standard. We retain merchant operational data for the duration of the active subscription plus 7 years to fulfill statutory taxation record obligations. Customer guest data is retained for 36 months before automated anonymization.
        `,
      },
      {
        id: 'your-privacy-rights',
        title: '5. Your Privacy Rights',
        content: `
Under applicable data protection frameworks, including the Digital Personal Data Protection Act (DPDPA), you have the right to inspect, correct, export, or request deletion of your personal records. To exercise any privacy right, contact our Data Protection Officer at privacy@craviti.com.
        `,
      },
    ],
  },
  'terms-and-conditions': {
    title: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'These Terms and Conditions constitute a legally binding agreement between you and Craviti Technologies Private Limited governing your use of the Craviti software platform, digital menus, and associated services.',
    sections: [
      {
        id: 'acceptance-of-terms',
        title: '1. Acceptance of Terms',
        content: `
By creating an account, accessing our administrative portal, or deploying Craviti QR codes within your establishment, you agree to be bound by these Terms. If you are entering into this agreement on behalf of a restaurant company, you warrant that you have full legal authority to bind that entity.
        `,
      },
      {
        id: 'platform-license-scope',
        title: '2. Platform License & Permitted Use',
        content: `
Craviti grants you a non-exclusive, non-transferable, revocable license to access our cloud-based restaurant operating platform solely for managing table ordering, kitchen operations, billing, and analytics in accordance with your chosen subscription tier. You may not reverse engineer, decompile, scrape, or resell the platform software.
        `,
      },
      {
        id: 'merchant-obligations',
        title: '3. Merchant Responsibilities',
        content: `
Merchants agree to:
- Maintain accurate, current menu item prices, allergen warnings, and availability statuses.
- Fulfill orders placed by patrons in a sanitary, timely manner compliant with all applicable FSSAI standards.
- Safeguard administrative and staff login credentials to prevent unauthorized account access.
- Ensure that bank details submitted for payout verification represent an active, legally compliant commercial account.
        `,
      },
      {
        id: 'subscription-fees-billing',
        title: '4. Subscriptions & Billing',
        content: `
Platform access fees are billed in advance on a recurring monthly or annual basis. Fees are non-refundable except as explicitly provided in our Refund Policy. Craviti reserves the right to suspend or restrict access to restaurants with accounts overdue beyond 14 business days.
        `,
      },
      {
        id: 'limitation-of-liability',
        title: '5. Limitation of Liability',
        content: `
In no event shall Craviti, its directors, employees, or partners be liable for indirect, punitive, or consequential damages, including loss of restaurant profits, inventory spoilage, or business interruption, exceeding the total platform subscription fees paid by you in the 3 months preceding the claim.
        `,
      },
    ],
  },
  'refund-policy': {
    title: 'Refund Policy',
    slug: 'refund-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'This Refund Policy outlines the conditions under which Craviti issues refunds for software subscriptions, hardware placards, and diner billing disputes.',
    sections: [
      {
        id: 'subscription-refunds',
        title: '1. Software Subscription Refunds',
        content: `
- **14-Day Free Trial:** No charges are incurred during the 14-day trial period.
- **Annual Subscriptions:** If you cancel an annual plan within 30 days of initial purchase, you are eligible for a full refund minus a 10% administrative provisioning charge. Cancellations after 30 days are credited pro-rata for unused full calendar months.
- **Monthly Subscriptions:** Monthly recurring fees are non-refundable for the active billing cycle once paid, but cancel future recurring renewals immediately.
        `,
      },
      {
        id: 'hardware-placards',
        title: '2. Physical QR Stands & Placards',
        content: `
Custom engraved or printed QR table stands damaged in transit are replaced completely free of charge upon photographic proof provided within 48 hours of courier delivery. Due to custom branding and table serialization, physical placards are non-returnable once printed without defect.
        `,
      },
      {
        id: 'diner-disputes',
        title: '3. Diner Payment & Food Disputes',
        content: `
Disputes concerning food quality, order fulfillment, dish preparation delays, or incorrect items served are the sole responsibility of the respective restaurant establishment. Craviti provides technical tools for restaurant managers to issue direct gateway refunds to diners through the Admin & Restaurant portals.
        `,
      },
      {
        id: 'refund-processing-timeline',
        title: '4. Refund Processing Timeline',
        content: `
Approved software subscription refunds and diner gateway refunds are processed through the original payment method within 5 to 7 business days, depending on the issuing bank or card network.
        `,
      },
    ],
  },
  'cancellation-policy': {
    title: 'Cancellation Policy',
    slug: 'cancellation-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Details on how to cancel your Craviti restaurant subscription, export your historical records, and deactivate your account cleanly without hidden penalties.',
    sections: [
      {
        id: 'how-to-cancel',
        title: '1. How to Cancel Your Subscription',
        content: `
You can cancel your subscription at any time directly through the Restaurant Settings portal under the "Subscriptions & Billing" tab, or by emailing billing@craviti.com with your restaurant identifier. No phone calls or retention interrogation required.
        `,
      },
      {
        id: 'access-upon-cancellation',
        title: '2. Access Following Cancellation',
        content: `
Upon initiating cancellation, your restaurant remains fully operational until the end of your current paid billing period. Diners can continue to scan QR codes and place orders until that cycle concludes.
        `,
      },
      {
        id: 'data-export-retention',
        title: '3. Data Export & Account Retention',
        content: `
We provide a 30-day grace period following subscription expiration during which you can download complete historical sales reports, menu catalogs, and tax receipts via our Export Center. After 90 days of inactivity, account data is scheduled for secure purging.
        `,
      },
    ],
  },
  'cookie-policy': {
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Explanation of how Craviti uses essential, analytical, and functional cookies to ensure smooth, responsive dining experiences.',
    sections: [
      {
        id: 'what-are-cookies',
        title: '1. What Are Cookies and Local Storage',
        content: `
Cookies and browser LocalStorage are small data files stored on your device that enable our web application to recognize your session, remember table assignments, and preserve active shopping cart items during dining sessions.
        `,
      },
      {
        id: 'types-of-cookies-we-use',
        title: '2. Categories of Cookies We Use',
        content: `
- **Strictly Essential Cookies:** Necessary for order processing, table session security, CSRF protection, and payment routing. These cannot be disabled.
- **Functional Cookies:** Remember your volume preferences for kitchen acoustic chimes, active language selection, and theme settings.
- **Performance & Diagnostic Cookies:** Aggregate telemetry on page load speeds and API latencies to help our engineering team resolve bottlenecks.
        `,
      },
      {
        id: 'managing-cookies',
        title: '3. Managing Your Cookie Preferences',
        content: `
You can manage or disable non-essential cookies through your browser settings. Please note that disabling local storage may prevent guest shopping cart persistence between mobile browser tab refreshes.
        `,
      },
    ],
  },
  'data-processing-agreement': {
    title: 'Data Processing Agreement (DPA)',
    slug: 'data-processing-agreement',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Our Data Processing Agreement regulates the processing of personal data by Craviti on behalf of restaurant merchants in compliance with global data privacy regulations.',
    sections: [
      {
        id: 'scope-and-roles',
        title: '1. Scope & Relationship of Parties',
        content: `
For the purposes of processing diner personal data (names, contact numbers, table orders), the Restaurant Merchant acts as the Data Controller, and Craviti Technologies Private Limited acts as the Data Processor.
        `,
      },
      {
        id: 'processor-obligations',
        title: '2. Processor Obligations',
        content: `
Craviti agrees to:
- Process customer personal data solely upon documented instructions from the Merchant.
- Implement bank-grade technical and organizational security controls to protect against unauthorized access or breaches.
- Ensure that all personnel authorized to handle merchant data are bound by formal confidentiality obligations.
- Assist the Controller in responding to data subject access, rectification, or erasure requests.
        `,
      },
      {
        id: 'sub-processors',
        title: '3. Sub-Processors',
        content: `
The Controller provides general authorization for Craviti to engage certified sub-processors including Razorpay, AWS India, and Cloudinary for specific processing activities under equivalent data protection terms.
        `,
      },
    ],
  },
  'security-policy': {
    title: 'Security Policy',
    slug: 'security-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Comprehensive overview of Craviti technical architecture, encryption protocols, access controls, and compliance certifications.',
    sections: [
      {
        id: 'encryption-standards',
        title: '1. Encryption & Data Protection',
        content: `
- **In Transit:** All communication between mobile guests, kitchen terminals, admin dashboards, and our API servers is protected by TLS 1.3 with HSTS enabled.
- **At Rest:** Database volumes and digital document repositories utilize AES-256 encryption. Sensitive bank details and webhook secrets are stored in encrypted environment vaults.
        `,
      },
      {
        id: 'tenant-isolation',
        title: '2. Strict Multi-Tenant Isolation',
        content: `
Craviti backend architecture enforces strict tenant isolation on every database query. Restaurant IDs are validated through cryptographically signed JWT tokens, preventing cross-tenant data leakage or horizontal privilege escalation.
        `,
      },
      {
        id: 'vulnerability-management',
        title: '3. Vulnerability Disclosure & Audits',
        content: `
We conduct regular third-party penetration testing, static code analysis, and automated dependency vulnerability scans. If you identify a potential security vulnerability, please contact our security team at security@craviti.com.
        `,
      },
    ],
  },
  'merchant-agreement': {
    title: 'Merchant Service Agreement',
    slug: 'merchant-agreement',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'The definitive agreement between Craviti and hospitality merchants governing commercial terms, payout verification, platform SLAs, and operational obligations.',
    sections: [
      {
        id: 'commercial-terms',
        title: '1. Commercial Relationship',
        content: `
Craviti provides software-as-a-service infrastructure to empower independent restaurant operators. Craviti is not a restaurant, food delivery aggregator, or food manufacturer.
        `,
      },
      {
        id: 'bank-verification',
        title: '2. Payout & Bank Verification Compliance',
        content: `
To receive online guest payouts, merchants must submit valid commercial bank credentials, an FSSAI registration certificate, and a canceled cheque. Our compliance team verifies records against national banking registers prior to payout activation.
        `,
      },
      {
        id: 'sla-uptime',
        title: '3. Service Level Agreement (SLA)',
        content: `
We commit to a 99.99% monthly platform uptime target for our core guest ordering and kitchen display services, excluding scheduled maintenance announced 48 hours in advance.
        `,
      },
    ],
  },
  'customer-terms': {
    title: 'Customer Terms of Use',
    slug: 'customer-terms',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Terms governing patrons and diners who scan Craviti QR codes to view menus, place orders, and pay bills at partner restaurants.',
    sections: [
      {
        id: 'table-ordering-rules',
        title: '1. Table Ordering & Contract of Sale',
        content: `
When you submit an order through the Craviti web interface at a partner establishment, you enter into a direct contract of sale with that specific restaurant. The restaurant is solely responsible for food preparation, ingredient sourcing, and physical service.
        `,
      },
      {
        id: 'payments-receipts',
        title: '2. Payment Settlement & Digital Receipts',
        content: `
Online payments are processed securely through certified gateway partners. Upon completion of payment, a tamper-proof digital PDF receipt is generated with timestamped itemization and applicable GST details.
        `,
      },
    ],
  },
  'acceptable-use-policy': {
    title: 'Acceptable Use Policy (AUP)',
    slug: 'acceptable-use-policy',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Rules and guidelines defining prohibited activities across the Craviti network and restaurant portals.',
    sections: [
      {
        id: 'prohibited-activities',
        title: '1. Prohibited Activities',
        content: `
Users and merchants may not:
- Upload malicious payloads, scripts, or offensive imagery into restaurant menu catalogs.
- Attempt to flood or launch denial-of-service (DDoS) attacks against kitchen WebSocket channels.
- Intercept, spoof, or manipulate digital QR codes to redirect diner traffic to unauthorized sites.
- Submit fraudulent bank documents or misrepresent corporate identity.
        `,
      },
    ],
  },
  'disclaimer': {
    title: 'Disclaimer',
    slug: 'disclaimer',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Legal disclaimers regarding food allergen representations, network connectivity, and third-party payment gateway operations.',
    sections: [
      {
        id: 'allergen-disclaimer',
        title: '1. Allergen & Ingredient Disclaimers',
        content: `
While Craviti offers digital tagging tools for vegan, vegetarian, gluten-free, nut-free, and halal items, the accuracy of all menu descriptions and ingredient cross-contamination precautions is the sole responsibility of the individual restaurant kitchen.
        `,
      },
    ],
  },
  'gdpr': {
    title: 'GDPR Compliance Statement',
    slug: 'gdpr',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Our adherence to General Data Protection Regulation (GDPR) standards for international guests and dining visitors.',
    sections: [
      {
        id: 'data-subject-rights',
        title: '1. Rights of European Data Subjects',
        content: `
In compliance with Regulation (EU) 2016/679, visitors enjoy rights of access, rectification, erasure ("right to be forgotten"), restriction of processing, and data portability. Contact dpo@craviti.com to submit requests.
        `,
      },
    ],
  },
  'ccpa': {
    title: 'CCPA / CPRA Privacy Notice',
    slug: 'ccpa',
    lastUpdated: 'March 1, 2026',
    effectiveDate: 'March 1, 2026',
    summary:
      'Information for California residents regarding data collection, consumer rights, and our strict "Do Not Sell My Personal Information" pledge.',
    sections: [
      {
        id: 'california-consumer-rights',
        title: '1. California Consumer Rights',
        content: `
Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California residents may request disclosure of categories of personal information collected. Craviti does NOT sell personal data or dining history.
        `,
      },
    ],
  },
};

