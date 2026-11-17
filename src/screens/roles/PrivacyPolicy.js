// PrivacyPolicy.js — /privacy: the tdc app and gettdc.pk privacy policy (public, linked in the footer
// and used as the privacy URL in the App Store and Google Play listings).
// Keep it in step with the app: app/src/components/Privacy.js and the Meta consent sheet.
import React from "react";
import { WebNav, WebFooter, LINKS, PageHero, usePage } from "../../web/site";

const UPDATED = "17 November 2026";

const SECTIONS = [
  {
    h: "who we are",
    p: [
      "tdc (The Deft Crew) is a student app and website run from DHA Phase 6, Karachi, Pakistan, and is part of MSB Group. this policy covers the tdc app on iPhone and Android and gettdc.pk.",
      `questions about your data: ${LINKS.hello}.`,
    ],
  },
  {
    h: "what we collect",
    list: [
      "account details: your name, email, phone number and the institute you study at, so we can verify you are a tdc user.",
      "your profile and CV: what you add to your work profile and resume, so we can match you to jobs and internships.",
      "what you do in the app: offers you claim and redeem, jobs, scholarships and events you apply or register for, and posts, comments, likes and confessions in the social section.",
      "photos and voice messages you choose to upload or send.",
      "your location, only while the app is open and only if you allow it, to show deals near you.",
      "device details we need to run the app, like your device type and a token to send you notifications.",
    ],
  },
  {
    h: "how we use it",
    list: [
      "to run your account, verify you and show you discounts, jobs, scholarships and events.",
      "to match you with jobs using your CV and work profile.",
      "to send notifications about deals, jobs, events and your account. you can turn these off in your phone settings.",
      "to keep tdc safe and stop misuse of offers.",
      "to see what works and improve the app.",
    ],
  },
  {
    h: "who sees it",
    list: [
      "brands: when you redeem a discount, the brand sees that a verified tdc user redeemed it and which institute they are from. brands don't get your personal details.",
      "employers and programmes: when you apply for a job or programme, they receive your application and CV. that is the point of applying.",
      "other students: your posts and comments in the social section. confessions are shown without your name.",
      "service providers who help us run tdc, for example hosting, notifications and the AI features (resume tools, AI chat and the travel assistant). they only use your data to provide that service to us.",
      "we don't sell your personal data.",
    ],
  },
  {
    h: "ads and Meta",
    p: [
      "we advertise tdc on Facebook and Instagram. to see which ads bring students to tdc, the app shares some activity with Meta: the install (counted when the app first connects), app opens, sign-up, finishing the app tour, offer claims, discounts redeemed, job applications, AI resumes, event registrations, scholarship applications, new posts, new confessions, likes and comments, AI chat use, travel assistant use, new skillshare listings and new skillshare offers. only that it happened (and, for some, which offer, job, scholarship or listing), never what you wrote. why: so Meta can tell us which ads worked, and we stop paying for the ones that don't. we never share your name, messages or what you write.",
      "by default this is shared without your email or phone number. on Android, your phone's advertising ID is included unless you turn off \"ads with your details\". on iPhone, nothing that identifies you is shared unless you tap \"continue\" when the app asks and then choose Allow when Apple asks.",
      "your email and phone number are shared with Meta only after you tap \"continue\" (on iPhone, also Apple's Allow), and only hashed: scrambled one way before they leave your phone, so Meta can match them to an account it already knows but can't read them.",
      "two switches in the app, settings → privacy: \"ad measurement\" turns off everything the app shares with Meta; \"ads with your details\" turns off the advertising ID and the hashed email and phone. you can also reset or turn off your advertising ID in your phone settings.",
    ],
  },
  {
    h: "your choices",
    list: [
      "edit your profile and CV any time in the app.",
      "turn location and notifications on or off in your phone settings.",
      "turn off \"ad measurement\" or \"ads with your details\" in settings → privacy.",
      "delete your account and its data from the app settings, or email us and we will do it for you.",
    ],
  },
  {
    h: "keeping it safe",
    p: [
      "data between the app and our servers is sent over encrypted connections, and only people on our team who need it can access it. no system is perfect, so if you think your account has been misused, tell us straight away.",
    ],
  },
  {
    h: "changes",
    p: [
      "if we change this policy we will update this page and the date at the top. for bigger changes we will also tell you in the app.",
    ],
  },
];

export default function PrivacyPolicy() {
  usePage("privacy policy");
  return (
    <div className="tdcw">
      <WebNav />
      <main>
        <PageHero eyebrow={`last updated ${UPDATED}`} title="privacy policy" lead="what tdc collects, why, who sees it, and how you stay in control. plain words, no fine print." />
        <section className="wrap section" style={{ paddingTop: 48, maxWidth: 820 }}>
          {SECTIONS.map((s) => (
            <article key={s.h} style={{ marginBottom: 40 }}>
              <h2 className="card-h" style={{ fontSize: 26 }}>{s.h}<span className="dot" aria-hidden="true">.</span></h2>
              {s.p && s.p.map((t, i) => <p key={i} style={{ marginTop: 12, color: "#111111" }}>{t}</p>)}
              {s.list && (
                <ul style={{ marginTop: 12, paddingLeft: 20, color: "#111111", lineHeight: 1.6 }}>
                  {s.list.map((t, i) => <li key={i} style={{ marginBottom: 8 }}>{t}</li>)}
                </ul>
              )}
            </article>
          ))}
          <div className="card" style={{ padding: 28 }}>
            <h2 className="card-h" style={{ fontSize: 22 }}>contact us<span className="dot" aria-hidden="true">.</span></h2>
            <p style={{ marginTop: 8 }}>
              email <a href={`mailto:${LINKS.hello}`}>{LINKS.hello}</a>, call or WhatsApp <a href={LINKS.phoneHref}>{LINKS.phone}</a>, or write to us at DHA Phase 6, Karachi.
            </p>
          </div>
        </section>
      </main>
      <WebFooter />
    </div>
  );
}
