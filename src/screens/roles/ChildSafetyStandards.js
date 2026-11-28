import React from "react";
import { WebNav, WebFooter, PageHero, usePage } from "../../web/site";

const TITLE = "tdc (The Deft Crew) Child Safety Standards";
export function childSafetyEmail(value) {
  const address = (value || "").trim();
  return /^[a-z0-9._+%-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(address) ? address : "privacy@gettdc.pk";
}

export default function ChildSafetyStandards() {
  usePage(TITLE);
  const contact = childSafetyEmail(process.env.REACT_APP_CHILD_SAFETY_EMAIL);
  return <div className="tdcw">
    <WebNav />
    <main>
      <PageHero title={TITLE} mark="" lead="tdc maintains a zero-tolerance policy toward child sexual abuse and exploitation." />
      <section className="wrap section" style={{ maxWidth: 820 }}>
        <h2>Prohibited activities</h2>
        <p>tdc prohibits child sexual abuse and exploitation of anyone under 18, including grooming, sexual extortion, and trafficking for sexual exploitation. Creating, distributing, sharing, or soliciting child sexual abuse material (CSAM) is prohibited.</p>
        <h2>Reporting concerns</h2>
        <p>In tdc, open Help &amp; Support, choose Report a safety concern, and select Child sexual abuse or exploitation. You can also report accounts, posts, comments, confessions, conversations, and messages from their reporting controls.</p>
        <p>Do not download, upload, screenshot, or forward suspected child sexual abuse material. Describe your concern using text only.</p>
        <h2>Enforcement and response</h2>
        <p>Authorized safety personnel review reports. When a violation is confirmed, tdc may restrict access to or remove prohibited content and suspend or permanently ban accounts. Confirmed CSAM is handled and reported to the National Center for Missing &amp; Exploited Children or the relevant regional authority in accordance with applicable laws and reporting obligations.</p>
        <h2>Compliance</h2>
        <p>tdc is committed to complying with applicable child safety laws and Google Play’s Child Safety Standards.</p>
        <h2>Child Safety Point of Contact</h2>
        <p>For concerns related to child sexual abuse and exploitation (CSAE), or questions about our child safety standards, please contact our designated child safety representative at <a href={`mailto:${contact}`}>{contact}</a>.</p>
        <p>Users can also submit safety concerns directly through the tdc application.</p>
      </section>
    </main>
    <WebFooter />
  </div>;
}
