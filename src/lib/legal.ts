/**
 * Terms of Service and Privacy Policy, shown inside the app.
 * Copied from https://giftmaster.pro/terms and /privacy — when the website
 * versions change, update this file too.
 */
export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Text after the bullet list. */
  closing?: string;
};

export type LegalDoc = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  lastUpdated: 'November 20, 2026',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      paragraphs: [
        'By creating an account or using GiftMaster (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.',
      ],
    },
    {
      heading: '2. The Service',
      paragraphs: [
        "GiftMaster is an AI-powered tool that generates personalized birthday and gift suggestions based on information you provide about a recipient. Suggestions are produced by a third-party large language model and are provided for informational purposes only. We do not sell, ship, or guarantee the availability, price, quality, or suitability of any product recommended by the Service. Purchases of recommended products are made through third-party retailers (such as Amazon) and are governed by those retailers' own terms.",
      ],
    },
    {
      heading: '3. Accounts',
      paragraphs: [
        'You must provide accurate information when registering and are responsible for keeping your login credentials secure and for all activity that occurs under your account. You must be at least 18 years old (or the age of majority in your jurisdiction) to purchase credits.',
      ],
    },
    {
      heading: '4. Credits and Payments',
      paragraphs: [
        "The Service operates on a prepaid credit model. Credits are purchased in U.S. dollars at a rate of $1 per credit, with a minimum purchase of $10. Each gift search consumes one credit and returns a set of AI-generated suggestions. Credits do not expire, have no cash value, and are non-transferable. Payments are processed by our payment provider, Paddle. By purchasing credits you also agree to Paddle's terms and authorize Paddle to charge your chosen payment method.",
      ],
    },
    {
      heading: '5. Acceptable Use',
      paragraphs: [
        'You agree not to use the Service to: (a) generate content that is unlawful, harassing, hateful, defamatory, sexually explicit involving minors, or that violates the rights of others; (b) attempt to reverse-engineer, scrape, or overload the Service; (c) resell or redistribute the Service or its output as a standalone product; or (d) circumvent the credit system or any usage limits.',
      ],
    },
    {
      heading: '6. Intellectual Property',
      paragraphs: [
        'The Service, including its software, design, and branding, is owned by GiftMaster and protected by applicable intellectual property laws. Subject to these Terms, you retain ownership of the inputs you provide and are granted a personal, non-exclusive license to use the AI-generated suggestions you receive for personal, non-commercial purposes.',
      ],
    },
    {
      heading: '7. Disclaimers',
      paragraphs: [
        'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. AI-generated suggestions may be inaccurate, incomplete, or unsuitable; you are solely responsible for evaluating any suggestion before acting on it.',
      ],
    },
    {
      heading: '8. Limitation of Liability',
      paragraphs: [
        'To the fullest extent permitted by law, GiftMaster and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill arising out of or related to your use of the Service. Our total liability for any claim arising out of these Terms or the Service will not exceed the amount you paid us in the twelve (12) months preceding the event giving rise to the claim.',
      ],
    },
    {
      heading: '9. Termination',
      paragraphs: [
        'We may suspend or terminate your access to the Service at any time if you violate these Terms or use the Service in a manner that could cause harm to us or other users. You may stop using the Service at any time by closing your account.',
      ],
    },
    {
      heading: '10. Changes to These Terms',
      paragraphs: [
        'We may update these Terms from time to time. Material changes will be reflected in the "Last updated" date above. Your continued use of the Service after changes take effect constitutes acceptance of the revised Terms.',
      ],
    },
    {
      heading: '11. Contact',
      paragraphs: ['Questions about these Terms can be sent to contact@giftmaster.pro.'],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  lastUpdated: 'November 20, 2026',
  sections: [
    {
      heading: '1. Introduction',
      paragraphs: [
        'This Privacy Policy explains what information GiftMaster ("we", "us") collects, how we use it, and the choices you have. It applies to your use of the GiftMaster website and related services (the "Service").',
      ],
    },
    {
      heading: '2. Information We Collect',
      bullets: [
        'Account information: your email address, an optional display name, and a hashed password (never stored in plain text).',
        'Gift search inputs: the recipient details, interests, budget, and any additional context you submit in order to generate suggestions.',
        'Generated content: the AI-generated gift suggestions associated with your account, and the items you mark as saved.',
        'Transaction information: credit purchases, balances, and a reference to the payment processed by Paddle. We do not store your full payment card number; that information is handled directly by Paddle.',
        'Technical data: basic log information such as IP address, browser type, and timestamps, used for security, abuse prevention, and debugging.',
      ],
    },
    {
      heading: '3. How We Use Information',
      bullets: [
        'To provide, maintain, and improve the Service.',
        'To generate gift suggestions by sending your inputs to our AI provider (Anthropic).',
        'To process credit purchases through Paddle and credit your account.',
        'To send transactional messages related to your account or purchases.',
        'To detect, prevent, and respond to fraud, abuse, or security incidents.',
        'To comply with legal obligations.',
      ],
    },
    {
      heading: '4. Sharing of Information',
      paragraphs: [
        'We do not sell your personal information. We share information only with the third-party service providers needed to operate the Service:',
      ],
      bullets: [
        'Anthropic — receives your gift search inputs to generate suggestions.',
        'Paddle — acts as the merchant of record for credit purchases and processes your payment information.',
        'Hosting and database providers — to store and serve your account data.',
      ],
      closing:
        'We may also disclose information when required by law or to protect the rights, property, or safety of GiftMaster, our users, or others.',
    },
    {
      heading: '5. Data Retention',
      paragraphs: [
        'We retain account, search history, and transaction records for as long as your account is active or as needed to provide the Service and to comply with our legal obligations. You may request deletion of your account at any time by contacting us.',
      ],
    },
    {
      heading: '6. Security',
      paragraphs: [
        'We use industry-standard measures to protect your information, including encryption in transit (HTTPS), hashed passwords, secure session cookies, and access controls. No system is perfectly secure, however, and we cannot guarantee absolute security.',
      ],
    },
    {
      heading: '7. Your Rights',
      paragraphs: [
        'Depending on your jurisdiction, you may have the right to access, correct, export, or delete the personal information we hold about you, and to object to or restrict certain processing. To exercise these rights, contact us at the address below.',
      ],
    },
    {
      heading: '8. Children',
      paragraphs: [
        'The Service is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.',
      ],
    },
    {
      heading: '9. International Users',
      paragraphs: [
        'By using the Service you understand that your information may be processed in countries other than the one in which you reside. We rely on appropriate safeguards required by applicable law for such transfers.',
      ],
    },
    {
      heading: '10. Changes to This Policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. The "Last updated" date at the top indicates when changes were made. Material changes will be highlighted in the Service.',
      ],
    },
    {
      heading: '11. Contact',
      paragraphs: ['For privacy questions or requests, email contact@giftmaster.pro.'],
    },
  ],
};
