import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LegalShell, { H2, P, UL } from '@/components/layout/LegalShell';

export default function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="June 4, 2026">
      <P>
        These Terms govern your use of GM/OS, operated by <strong>Hook &amp; Quill LLC</strong> (Pennsylvania, USA)
        (“we”, “us”). By creating an account or using the service, you agree to these Terms.
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

      <H2>Subscriptions, lifetime licences &amp; billing</H2>
      <P>
        GM/OS is currently free to use. We intend to offer two paid options: a recurring <strong>subscription</strong>
        and a one-time <strong>lifetime licence</strong>. Paid plans are billed through Stripe, and the price and any
        plan-specific terms are presented to you at the time of purchase.
      </P>
      <P>
        <strong>Lifetime licences.</strong> “Lifetime” refers to the operational lifetime of the GM/OS service — it is
        not a guarantee of perpetual, uninterrupted, or indefinite availability. We may modify, suspend, or discontinue
        GM/OS, in whole or in part, at any time. If the service becomes unavailable or is discontinued for any reason,
        you agree that Hook &amp; Quill LLC is not responsible or liable for any loss, damage, lost data, or claim
        arising from a lifetime licence or any other payment, and that no refund is owed, to the maximum extent
        permitted by law. We encourage you to export your data regularly (Account → Export my data).
      </P>

      <H2>Disclaimers</H2>
      <P>The service is provided “as is” and “as available,” without warranties of any kind to the fullest extent permitted by law.</P>

      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, we are not liable for indirect, incidental, special, or consequential
        damages, or for loss of data, profits, or goodwill, arising from your use of (or inability to use) the service —
        including any interruption, suspension, or discontinuation of the service, regardless of your plan. Our total
        aggregate liability for any claim is limited to the greater of the amount you paid us in the twelve months
        before the claim or USD&nbsp;100.
      </P>

      <H2>Termination</H2>
      <P>
        You may delete your account at any time from Account settings. We may suspend or terminate accounts that violate
        these Terms.
      </P>

      <H2>Governing law</H2>
      <P>
        These Terms are governed by the laws of the <strong>Commonwealth of Pennsylvania, United States</strong>,
        without regard to conflict-of-laws rules.
      </P>

      <H2>Changes</H2>
      <P>We may update these Terms; continued use after changes constitutes acceptance. We will update the “Last updated” date.</P>

      <H2>Contact</H2>
      <P>Questions: <strong>contact@hookandquill.com</strong>.</P>
    </LegalShell>
  );
}
