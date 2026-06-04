import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LegalShell, { H2, P, UL } from '@/components/layout/LegalShell';

export default function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="June 2026">
      <P>
        These Terms govern your use of GM/OS, operated by <strong>[Operator legal name]</strong> (“we”, “us”). By
        creating an account or using the service, you agree to these Terms.
      </P>

      <H2>The service</H2>
      <P>
        GM/OS is a campaign-management tool for tabletop role-playing game Game Masters. We may change, suspend, or
        discontinue features over time.
      </P>

      <H2>Your account</H2>
      <UL>
        <li>You must provide accurate information and are responsible for activity under your account.</li>
        <li>Keep your credentials secure; notify us of any unauthorised use.</li>
        <li>You must be old enough to form a binding contract in your jurisdiction.</li>
      </UL>

      <H2>Your content</H2>
      <P>
        You retain ownership of the campaigns and content you create. You grant us a limited licence to store, process,
        and display that content solely to operate the service for you. You are responsible for your content and for
        having the rights to use it.
      </P>

      <H2>Acceptable use</H2>
      <P>You agree not to misuse the service — including unlawful activity, infringing others’ rights, attempting to breach security, or disrupting the service.</P>

      <H2>Third-party game content</H2>
      <P>
        GM/OS incorporates open-licensed material, including the D&amp;D System Reference Document 5.1 (CC BY 4.0,
        Wizards of the Coast), the Lazy GM’s Resource Document (CC BY 4.0, Michael E. Shea / SlyFlourish.com), and
        Open5e content. See the{' '}
        <Link to={createPageUrl('About')} className="text-amber-600 dark:text-amber-400 hover:underline">attributions</Link>{' '}
        for details and applicable licences. Such content remains the property of its respective authors.
      </P>

      <H2>Our intellectual property</H2>
      <P>The GM/OS name, interface, and software are owned by us or our licensors and are protected by applicable law.</P>

      <H2>Subscriptions &amp; billing</H2>
      <P>
        Paid plans, if offered, are billed through Stripe on the terms presented at purchase. <strong>[Confirm refund,
        renewal, and cancellation terms with counsel.]</strong>
      </P>

      <H2>Disclaimers</H2>
      <P>The service is provided “as is” and “as available,” without warranties of any kind to the fullest extent permitted by law.</P>

      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages, or
        for loss of data or profits, arising from your use of the service. <strong>[Confirm liability cap with
        counsel.]</strong>
      </P>

      <H2>Termination</H2>
      <P>
        You may delete your account at any time from Account settings. We may suspend or terminate accounts that violate
        these Terms.
      </P>

      <H2>Governing law</H2>
      <P>These Terms are governed by the laws of <strong>[jurisdiction]</strong>, without regard to conflict-of-laws rules.</P>

      <H2>Changes</H2>
      <P>We may update these Terms; continued use after changes constitutes acceptance. We will update the “Last updated” date.</P>

      <H2>Contact</H2>
      <P>Questions: <strong>[support@yourdomain]</strong>.</P>
    </LegalShell>
  );
}
