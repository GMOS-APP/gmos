import React from 'react';
import LegalShell, { H2, P, UL } from '@/components/layout/LegalShell';

export default function PrivacyPolicy() {
  return (
    <LegalShell title="Privacy Policy" updated="July 13, 2026">
      <P>
        This Privacy Policy explains how GM/OS (“we”, “us”) collects, uses, and protects your personal information,
        and the rights you have over it. GM/OS is operated by <strong>Hook &amp; Quill LLC</strong> (Pennsylvania,
        USA), the data controller, contactable at <strong>contact@hookandquill.com</strong>.
      </P>

      <H2>Information we collect</H2>
      <UL>
        <li><strong>Account identity</strong> — your email address and display name, provided when you sign up with email &amp; password or via Google sign-in.</li>
        <li><strong>Content you create</strong> — campaigns and everything in them: world entities (NPCs, locations, etc.), sessions and prep, notes, relationships, maps, and random tables.</li>
        <li><strong>Billing identifiers</strong> — if you subscribe, a Stripe customer ID and subscription ID. Card details are handled by Stripe and never stored by us.</li>
        <li><strong>Essential technical data</strong> — an authentication session and small preferences (e.g. theme, layout) stored in your browser.</li>
        <li><strong>Usage analytics</strong> — privacy-friendly, <strong>cookieless</strong> product analytics (via Vercel) that record aggregate page views and feature events to help us understand how GM/OS is used. This sets no cookies, does not track you across other websites, and is never used for advertising.</li>
      </UL>

      <H2>How we use your information</H2>
      <UL>
        <li>To provide and operate the service (store and display your campaigns, authenticate you).</li>
        <li>To process subscriptions and billing, where applicable.</li>
        <li>To understand aggregate usage and improve the service.</li>
        <li>To secure the service and prevent abuse.</li>
        <li>To comply with legal obligations.</li>
      </UL>

      <H2>Legal bases (EEA/UK GDPR)</H2>
      <P>
        We process your data to perform our contract with you (providing the service), on the basis of our legitimate
        interests (securing and improving the service), to comply with legal obligations, and — where applicable — with
        your consent, which you may withdraw at any time.
      </P>

      <H2>Service providers (sub-processors)</H2>
      <UL>
        <li><strong>Supabase</strong> — database, authentication, and hosting of your content (US region).</li>
        <li><strong>Stripe</strong> — payment processing, for subscribers.</li>
        <li><strong>Google</strong> — optional sign-in (OAuth).</li>
        <li><strong>Vercel</strong> — hosting of the web application and privacy-friendly, cookieless usage analytics.</li>
      </UL>

      <H2>Where your data is processed</H2>
      <P>
        Your data is stored and processed in the United States by our service providers. If you access GM/OS from
        outside the United States, you understand and agree that your information is transferred to and processed in
        the US in order to provide the service to you.
      </P>

      <H2>Data retention</H2>
      <P>
        We keep your data for as long as your account is active. When you delete your account, your content, profile, and
        sign-in identity are permanently erased from our systems. You can export a full copy of your data at any time
        from <strong>Account → Your data</strong>.
      </P>

      <H2>Your rights</H2>
      <P>
        Depending on where you live, you may have some or all of the following rights. We honour these regardless of
        region:
      </P>
      <UL>
        <li><strong>Access &amp; portability</strong> — download all your data (Account → Export my data).</li>
        <li><strong>Rectification</strong> — correct your name or password in Account settings.</li>
        <li><strong>Erasure</strong> — delete your account and all data (Account → Delete account).</li>
        <li><strong>Restriction &amp; objection</strong> — ask us to limit or stop certain processing.</li>
        <li><strong>Withdraw consent</strong> — where processing relies on consent.</li>
        <li><strong>California (CCPA/CPRA)</strong> — to know, delete, and correct your information, and to non-discrimination. We do <strong>not</strong> sell or share your personal information, and we do not use sensitive personal information for inference.</li>
        <li><strong>Brazil (LGPD)</strong> — confirmation, access, correction, anonymisation/deletion, portability, and information about sharing.</li>
        <li>The right to lodge a complaint with your local supervisory authority.</li>
      </UL>
      <P>
        Exercise access and erasure instantly in-app, or contact <strong>contact@hookandquill.com</strong> for any
        other request. We respond within the timeframes required by applicable law.
      </P>

      <H2>Cookies &amp; local storage</H2>
      <P>
        We use only strictly necessary browser storage: your authentication session and interface preferences (such as
        theme and layout). Our usage analytics are cookieless and store no identifiers in your browser, and we set no
        advertising or analytics cookies — so no consent banner is required.
      </P>

      <H2>Children</H2>
      <P>
        GM/OS is not directed to children under 16 (or the minimum age in your jurisdiction), and we do not knowingly
        collect their data.
      </P>

      <H2>Security</H2>
      <P>
        Access to your data is protected by row-level security so that only you can read or modify it, and by
        authentication managed by Supabase. No system is perfectly secure, but we take reasonable measures to protect
        your information.
      </P>

      <H2>Changes</H2>
      <P>We may update this policy; we will revise the “Last updated” date and, for material changes, notify you in-app or by email.</P>

      <H2>Contact</H2>
      <P>
        Questions or requests: <strong>contact@hookandquill.com</strong>. Postal: <strong>Hook &amp; Quill LLC</strong>,
        Pennsylvania, USA (full mailing address available on request).
      </P>
    </LegalShell>
  );
}
