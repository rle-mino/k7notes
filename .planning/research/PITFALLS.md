# Pitfalls Research

**Domain:** AI-powered note-taking app with meeting capture
**Researched:** 2026-01-31
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Local-First Sync Conflict Hell

**What goes wrong:**
Teams underestimate the complexity of conflict resolution in local-first architecture. Writing custom sync algorithms leads to a "rabbit hole of edge cases" including partial updates, retry loops, and race conditions. Without proper CRDT or operational transform handling, users experience data loss when editing the same note offline on multiple devices.

**Why it happens:**
The local-first ecosystem is still immature (as of 2026). Tools like ElectricSQL and PowerSync handle some scenarios but developers find themselves solving problems they expected the tools to handle. Teams often implement "last-write-wins" because it seems simple, not realizing it silently drops changes.

**How to avoid:**
- Use mature sync solutions (ElectricSQL, PowerSync) instead of custom implementations
- Implement CRDT-based data structures for conflict-free merging
- Never use "last-write-wins" for user-generated content
- Design data model to minimize conflicts (user-owned documents, append-only logs)
- Build conflict resolution UI early (don't assume auto-merge will always work)

**Warning signs:**
- Team discussing "rolling our own sync protocol"
- Sync edge cases discovered during late-stage testing
- Users reporting "my changes disappeared"
- Test suite doesn't simulate multi-device offline scenarios
- Sync retry logic causing exponential API calls

**Phase to address:**
Phase 1 (Foundation) - Architecture decision must be made early; switching sync strategies post-launch requires data migration.

**Sources:**
- [Local-first architecture with Expo](https://docs.expo.dev/guides/local-first/)
- [Cool frontend arts of local-first: storage, sync, conflicts](https://evilmartians.com/chronicles/cool-front-end-arts-of-local-first-storage-sync-and-conflicts)

---

### Pitfall 2: Audio Transcription Privacy Violations

**What goes wrong:**
Meeting recording without proper consent violates state/federal law. Over a dozen states (California, Florida, Pennsylvania) require all-party consent. AI meeting tools that silently transcribe conversations create legal liability. Apps get banned from enterprise environments or sued for wiretapping violations.

**Why it happens:**
Federal "one-party consent" misleads developers into thinking it applies everywhere. Teams build features first, add legal compliance as an afterthought. Privacy policies buried in Terms of Service don't satisfy legal consent requirements.

**How to avoid:**
- Always apply strictest consent rules (all-party consent) for multi-state meetings
- Show visible recording indicator throughout entire session
- Require explicit opt-in before recording starts (not default-on)
- Implement "remove AI assistant" feature for participants who decline
- Add pre-meeting consent screen listing all attendees
- Store consent records with timestamps
- Block transcription of sensitive categories (financial, medical, privileged legal)

**Warning signs:**
- Recording starts automatically without user action
- No visible recording indicator
- Consent buried in settings or terms of service
- App joins meetings "silently" without participant awareness
- Privacy policy doesn't specify data retention periods
- No mechanism for participants to object to recording

**Phase to address:**
Phase 1 (Foundation) - Legal/UX patterns must be correct from MVP; retrofitting consent flows breaks existing users' workflows.

**Sources:**
- [Recording Virtual Meetings: Legal Concerns](https://screenrec.com/business-communication-app/recording-virtual-meetings-legal-concerns/)
- [It's Okay to Say No to AI Notetaking](https://www.coblentzlaw.com/news/its-okay-to-say-no-to-ai-notetaking-and-meeting-recordings/)
- [Consent and Audio Recording Laws by State](https://blog.eyespysupply.com/2026/01/15/consent-and-audio-recording-laws-explained-by-state/)

---

### Pitfall 3: React Native Web Platform Fragmentation

**What goes wrong:**
UI components work inconsistently across iOS, Android, and Web. Teams build for mobile first, add web later, and discover fundamental incompatibilities. Third-party libraries break on web (35% of developers report third-party plugin issues). Design that looks native on iOS looks foreign on Android and broken on web.

**Why it happens:**
iOS and Android receive first-class support from Meta; web/desktop depend on community projects with varying update cycles. Developers treat platforms as interchangeable instead of respecting platform-specific design guidelines. React Native Web is a separate project (necolas/react-native-web) with different capabilities.

**How to avoid:**
- Test on all three platforms (iOS, Android, Web) from week 1
- Use Platform.select() for platform-specific code
- Audit third-party libraries for web compatibility before adoption
- Accept platform-specific UI differences (iOS vs Android design patterns)
- Plan for 20-30% additional effort for web-specific adaptations
- Use web-safe libraries (avoid native modules that don't work in browser)

**Warning signs:**
- Development/testing happens on only one platform
- Demo videos only show iOS
- Third-party library README doesn't mention web support
- Styling uses iOS-specific patterns exclusively
- No web testing in CI/CD pipeline
- Team says "we'll add web later"

**Phase to address:**
Phase 1 (Foundation) - Cross-platform compatibility must be validated continuously; addressing late causes rewrites.

**Sources:**
- [Common Challenges in Cross-Platform App Development 2026](https://www.techloy.com/common-challenges-in-cross-platform-app-development-and-how-to-overcome-them-in-2026/)
- [React Native in 2026: Advanced Practices, Challenges & Future Trends](https://medium.com/@EnaModernCoder/react-native-in-2026-advanced-practices-challenges-future-trends-1700dc7ab45e)

---

### Pitfall 4: Background Audio Recording Platform Restrictions

**What goes wrong:**
iOS 18+ and Android 15 aggressively kill background tasks to preserve battery. Recording mysteriously stops after variable durations when app is backgrounded. OS flags app as "battery drainer" and permanently restricts it. Users lose meeting recordings with no error message.

**Why it happens:**
Mobile OS battery optimization logic is opaque and changes between versions. Developers test on foreground scenarios only. Foreground service requirements (Android) and background mode configurations (iOS) are complex and poorly documented.

**How to avoid:**
- **Android**: Use foreground services with visible notification (@notifee/react-native)
- **Android 14+**: Add `android:foregroundServiceType="microphone"` to AndroidManifest.xml
- **iOS**: Configure `UIBackgroundModes` array in app.json with audio mode
- **iOS**: Handle interruptions (headphone disconnect, incoming calls)
- Test long-duration recordings (60+ minutes) with screen off
- Implement recording state recovery (resume after interruption)
- Show persistent notification during recording
- Monitor battery usage stats in testing

**Warning signs:**
- Background recording only tested for 5-10 minutes
- No foreground service implementation
- Recording silently fails when app backgrounded
- No interruption handling code
- Users report "recording stopped unexpectedly"
- Battery usage shows app as top consumer

**Phase to address:**
Phase 2 (Meeting Capture MVP) - Background recording is core to meeting capture; must work reliably from first release.

**Sources:**
- [Run React Native Background Tasks 2026](https://dev.to/eira-wexford/run-react-native-background-tasks-2026-for-optimal-performance-d26)
- [Enabling Background Recording on Android with Expo](https://drebakare.medium.com/enabling-background-recording-on-android-with-expo-the-missing-piece-41a24b108f6d)
- [expo-audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)

---

### Pitfall 5: LLM API Cost Explosion at Scale

**What goes wrong:**
Usage-based LLM pricing creates unpredictable costs. A single viral user generates thousands of API calls. Summarizing 60-minute meetings with full transcripts costs $2-5 per meeting. Free tier users drive 80% of API costs but 0% of revenue. Company burns through $50k/month unexpectedly.

**Why it happens:**
Teams don't model API costs during design. Using GPT-4 for tasks where smaller models work. No rate limiting, caching, or usage tiers. Sending entire transcripts instead of chunking/summarizing first. Testing with small samples doesn't reveal scale issues.

**How to avoid:**
- Calculate cost per operation during design (transcription + summarization + search)
- Implement aggressive caching for repeated queries
- Use smallest model that works (GPT-3.5 vs GPT-4, Claude Haiku vs Sonnet)
- Chunk long transcripts, summarize progressively
- Rate limit users (e.g., 10 AI operations/day on free tier)
- Monitor per-user API costs in production
- Set budget alerts at 80% of threshold
- Implement fallback to local models for simple tasks
- Consider on-device small models for common operations

**Warning signs:**
- No cost modeling in product specs
- Every feature defaults to "use GPT-4"
- No caching layer for AI responses
- Sending full meeting transcripts to LLM APIs
- Free tier has no usage limits
- No per-user cost tracking
- Budget discussions happen quarterly, not weekly
- Team surprised by API bills

**Phase to address:**
Phase 1 (Foundation) - API cost structure affects business model viability; must be addressed before feature buildout.

**Sources:**
- [Integrating LLMs in Mobile Apps: Challenges & Best Practices](https://www.theusefulapps.com/news/integrating-llms-mobile-challenges-best-practices-2025)
- [LLMs in Mobile Apps: Practices, Challenges, and Opportunities](https://arxiv.org/html/2502.15908v1)
- [Breaking Down Unified API Pricing](https://www.apideck.com/blog/breaking-down-unified-api-pricing-why-api-call-pricing-stands-out)

---

### Pitfall 6: Calendar API Integration Breaking Changes

**What goes wrong:**
Calendar sync mysteriously stops working. Google Calendar and Outlook update security protocols without warning, breaking existing integrations. Webhook subscriptions expire after 24 hours (Microsoft Graph). Timezone handling bugs cause meetings to appear at wrong times. "Import calendar" feature doesn't sync updates (users expect real-time sync).

**Why it happens:**
Calendar APIs have inconsistent behaviors (Google vs Microsoft vs Apple). "Import" vs "sync" vs "subscribe" are fundamentally different but users expect sync. Webhook renewal logic requires background jobs. Manual timezone entry in Outlook breaks parsing. Platform updates break OAuth flows.

**How to avoid:**
- **Never** use calendar import/snapshot features (users expect sync)
- Implement webhook renewal background job (every 12 hours for safety)
- Use calendar subscription (iCal URLs) for read-only scenarios
- Handle timezone strings defensively (users can type anything in Outlook)
- Test admin consent flow (enterprise requires admin approval)
- Set up monitoring for webhook failures
- Build "Ask your admin" error flow
- Plan for OAuth re-authentication flow
- Support calendar-specific quirks (Outlook all-day events, Google recurring events)

**Warning signs:**
- Webhook subscriptions not renewed automatically
- No admin consent error handling
- Timezone parsing assumes standard format
- Testing only with personal Google accounts (not enterprise)
- Import feature documented as "sync"
- No monitoring for integration failures
- Calendar changes take 24+ hours to appear

**Phase to address:**
Phase 3 (Calendar Integration) - Calendar integration is complex; allocate 2x estimated time for edge cases.

**Sources:**
- [How to Integrate Outlook Calendar API Into Your App](https://www.onecal.io/blog/how-to-integrate-outlook-calendar-api-into-your-app)
- [Google Calendar Syncing No Longer Working for Outlook](https://learn.microsoft.com/en-us/answers/questions/5690324/google-calendar-syncing-no-longer-working-for-outl)

---

### Pitfall 7: Markdown Editor Performance Degradation

**What goes wrong:**
Editor becomes sluggish when notes exceed 5,000 characters. Real-time markdown rendering blocks UI thread. Copy-pasting large formatted text crashes app. Users complain about "lag when typing."

**Why it happens:**
Most React markdown libraries (react-markdown) re-render entire document on every keystroke. No virtualization for large documents. Rendering markdown to preview requires expensive parsing. Using WebView-wrapped editors adds performance penalty.

**How to avoid:**
- Use native text input with markdown shortcuts, NOT full markdown rendering while typing
- Render markdown preview only on demand (separate view/edit modes)
- Implement virtualization for rendering long notes
- Chunk large documents (render only visible portion)
- Use react-native-live-markdown for live syntax highlighting (native performance)
- Debounce preview updates (300ms delay)
- Test with realistic note sizes (10,000+ characters)
- Measure frame rate drops during typing

**Warning signs:**
- Typing feels laggy on older devices
- Editor re-renders on every keystroke
- Preview and edit modes render simultaneously
- Using react-markdown without virtualization
- No performance testing with large documents
- Users report app "freezing" when typing

**Phase to address:**
Phase 1 (Foundation) - Editor performance is core UX; poor experience kills adoption early.

**Sources:**
- [Improving performance of react-markdown](https://github.com/orgs/remarkjs/discussions/1027)
- [React Native Live Markdown](https://madewithreactjs.com/react-native-live-markdown)

---

### Pitfall 8: Speaker Diarization Accuracy Failures

**What goes wrong:**
"Who said what" attribution is wrong 30-50% of the time in real meetings. Overlapping speech assigns all words to one speaker. Background noise ruins speaker separation. Meetings with 5+ participants produce unusable diarization. Users stop trusting AI features.

**Why it happens:**
Speaker diarization is a hard AI problem. Most systems assign only one speaker per segment and fail with overlapping speech. Training on impure data (common in all current systems) degrades accuracy. Real meetings have noise, cross-talk, varied accents. Diarization results don't generalize across acoustic conditions.

**How to avoid:**
- Set user expectations correctly (call it "speaker detection" not "identification")
- Provide easy manual correction UI (tap to reassign speaker)
- Warn when audio quality is too poor for diarization
- Support user-labeled speaker training ("This is John")
- Don't auto-label speakers by name (use Speaker 1, Speaker 2)
- Test with realistic meeting audio (background noise, overlapping speech)
- Consider diarization optional feature, not core functionality
- Fall back gracefully (show transcript without speaker labels if quality low)

**Warning signs:**
- Marketing promises "perfect speaker identification"
- No manual correction UI
- Diarization failures treated as bugs, not expected behavior
- Testing only with clean studio audio
- No fallback when diarization confidence is low
- Users can't override speaker assignments

**Phase to address:**
Phase 4 (Speaker Diarization) - This is an enhancement, not MVP; defer until core transcription works well.

**Sources:**
- [Speaker Diarization: A Review of Recent Research](https://www.researchgate.net/publication/220655948_Speaker_Diarization_A_Review_of_Recent_Research)
- [A Review of Speaker Diarization: Recent Advances with Deep Learning](https://www.sciencedirect.com/science/article/abs/pii/S0885230821001121)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| AsyncStorage for all data | Simple API, no setup | No encryption, 6MB limit, slow queries | Early prototyping only; migrate to SQLite/WatermelonDB by Phase 2 |
| Last-write-wins conflict resolution | Easy to implement | Silent data loss on conflicts | Never acceptable for user content |
| Recording without foreground service | Works in foreground | Background recording fails silently | Never - implement from day 1 |
| Sending full transcripts to LLM | No chunking logic needed | 10x API costs, hits token limits | Only for meetings <10 minutes |
| WebView-wrapped markdown editor | Cross-platform consistency | Poor performance, clunky UX | Never - use native text input |
| Default-on recording | Faster UX | Legal liability, user distrust | Never - require explicit consent |
| No rate limiting on AI features | Users can explore freely | API cost explosion | Only during closed beta with known users |
| Storing voice recordings indefinitely | Users can replay anytime | Storage costs, privacy risk | Acceptable if disclosed; delete after 90 days otherwise |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI/Anthropic APIs | Sending entire 60-min transcript | Chunk into 5-min segments, progressive summarization |
| Google Calendar API | Using import (snapshot) instead of sync | Use calendar subscriptions or implement webhook sync |
| Microsoft Graph (Outlook) | Assuming webhooks don't expire | Renew subscriptions every 12 hours via background job |
| Audio transcription APIs | Not handling poor audio quality | Check audio quality first, warn user, offer cleanup |
| Speaker diarization | Promising 95%+ accuracy | Set expectations at 70-80%, provide manual correction |
| OAuth providers | No admin consent flow | Build "Ask your admin" error screen for enterprise users |
| Calendar timezones | Assuming standard format | Handle manual text entry, validate defensively |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No LLM response caching | Identical queries hit API every time | Cache responses for 7 days | At 1,000 users (repetitive questions) |
| Full note re-render on keystroke | Editor lags when typing | Debounce updates, use native text input | Notes >2,000 characters |
| Storing all notes in memory | Fast access | App crashes on older devices | >500 notes or >50MB total |
| Synchronous audio transcription | Simple API flow | App freezes during transcription | Files >5 minutes |
| No pagination on note list | All notes load immediately | Virtual scrolling, lazy load | >100 notes |
| Uploading full audio files to cloud | Works for short recordings | Slow uploads, high bandwidth costs | Files >50MB (45+ min meetings) |
| No audio compression | Maintains quality | Storage fills up quickly | >20 recorded meetings |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing recordings in AsyncStorage | Unencrypted data accessible to other apps | Use encrypted SQLite or secure keychain |
| No GDPR/CCPA data deletion | Legal violations, fines | Implement 30-day data deletion on user request |
| Vendor uses meeting audio for AI training | Privacy violation, enterprise ban | Verify API terms prohibit training, use enterprise tiers |
| Recording continues after permissions revoked | App crashes, legal issues | Listen for permission changes, stop recording immediately |
| Transcripts stored without encryption | Sensitive meeting content exposed | Encrypt at rest and in transit |
| No audit log for recordings | Can't prove consent was obtained | Log who started recording, who consented, timestamp |
| Sharing notes with public links has no expiry | Links leaked permanently expose private notes | Auto-expire share links after 7 days |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No offline indicator | Users don't know why features are disabled | Show clear "Offline - will sync when connected" badge |
| Recording fails silently | Users think meeting was captured but wasn't | Show persistent recording indicator, alert on failure |
| AI summary has no "show original" link | Can't verify AI accuracy | Always link to source transcript |
| No manual speaker correction | Stuck with wrong speaker labels forever | Tap-to-change speaker assignment |
| Calendar permission is all-or-nothing | Users reject permission | Request only needed scopes (read calendar, not edit) |
| Auto-transcription depletes battery | App drains battery during meeting | Warn user, offer "audio only" mode |
| Notes sync conflicts overwrite silently | User loses work without knowing | Show conflict dialog, let user choose version |
| "Uploading..." blocks entire UI | Can't use app while uploading | Background upload with progress notification |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Audio recording:** Often missing background recording support — verify recording continues with screen off for 60+ minutes
- [ ] **Transcription:** Often missing poor audio quality handling — verify error message when audio is too noisy/quiet
- [ ] **Calendar sync:** Often missing webhook renewal — verify sync continues working 48+ hours later
- [ ] **Offline mode:** Often missing conflict resolution UI — verify what happens when same note edited offline on two devices
- [ ] **Speaker diarization:** Often missing manual correction — verify users can reassign misidentified speakers
- [ ] **Note sharing:** Often missing link expiration — verify public links auto-expire after 7 days
- [ ] **Permission flows:** Often missing "denied" state handling — verify app works when user denies microphone/calendar permissions
- [ ] **LLM features:** Often missing rate limiting — verify free users can't trigger $1,000 in API calls
- [ ] **Meeting capture:** Often missing consent screen — verify all participants explicitly consent before recording
- [ ] **Data deletion:** Often missing actual file removal — verify "delete account" removes all audio/transcript files, not just DB records

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Local-first sync data loss | HIGH | Implement append-only log, replay events to recover state; may require user to choose version |
| Privacy lawsuit from recording | HIGH | Legal settlement, implement consent retroactively, audit all recordings, offer deletion to affected users |
| Platform fragmentation (web broken) | MEDIUM | Isolate web-specific code, use Platform.select(), rewrite incompatible components |
| Background recording broken on iOS 18 | MEDIUM | Add UIBackgroundModes, test on latest iOS, submit app update immediately |
| LLM API costs exceeded budget | LOW | Implement rate limiting, switch to cheaper model, add caching, pause free tier temporarily |
| Calendar integration broken | LOW | Add monitoring, implement fallback to manual entry, communicate issue to users |
| Markdown editor performance issues | MEDIUM | Replace library, migrate to view/edit split mode, add virtualization |
| Speaker diarization producing wrong results | LOW | Add manual correction UI, reduce confidence threshold, show "low confidence" warning |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Local-first sync conflicts | Phase 1: Foundation | Multi-device offline edit test passes, conflict UI screenshot |
| Recording privacy violations | Phase 1: Foundation | Legal review of consent flows, per-state compliance check |
| React Native web incompatibility | Phase 1: Foundation | CI runs tests on iOS, Android, Web; all pass |
| Background recording failure | Phase 2: Meeting Capture | 90-minute screen-off recording test on iOS 18 & Android 15 |
| LLM cost explosion | Phase 1: Foundation | Cost model spreadsheet, per-user monitoring dashboard |
| Calendar API breaking | Phase 3: Calendar Integration | Webhook renewal job running, 48-hour sync stability test |
| Markdown editor lag | Phase 1: Foundation | 60fps typing test with 10,000 character note |
| Speaker diarization errors | Phase 4: Speaker Diarization | Manual correction UI implemented, accuracy documented realistically |

## Sources

**React Native / Expo:**
- [25 React Native Best Practices for High Performance Apps 2026](https://www.esparkinfo.com/blog/react-native-best-practices)
- [5 common errors in a React Native app when using Expo](https://www.imaginarycloud.com/blog/5-common-errors-found-in-a-react-native-app-using-expo)
- [Common Challenges in Cross-Platform App Development 2026](https://www.techloy.com/common-challenges-in-cross-platform-app-development-and-how-to-overcome-them-in-2026/)
- [React Native in 2026: Advanced Practices, Challenges & Future Trends](https://medium.com/@EnaModernCoder/react-native-in-2026-advanced-practices-challenges-future-trends-1700dc7ab45e)

**Local-First Architecture:**
- [Local-first architecture with Expo](https://docs.expo.dev/guides/local-first/)
- [Cool frontend arts of local-first: storage, sync, conflicts](https://evilmartians.com/chronicles/cool-front-end-arts-of-local-first-storage-sync-and-conflicts)
- [The Architecture Shift: Why I'm Betting on Local-First in 2026](https://dev.to/the_nortern_dev/the-architecture-shift-why-im-betting-on-local-first-in-2026-1nh6)

**Audio Recording & Transcription:**
- [expo-audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Run React Native Background Tasks 2026](https://dev.to/eira-wexford/run-react-native-background-tasks-2026-for-optimal-performance-d26)
- [Enabling Background Recording on Android with Expo](https://drebakare.medium.com/enabling-background-recording-on-android-with-expo-the-missing-piece-41a24b108f6d)
- [Audio Quality Ruining Your Transcripts? The Complete 2026 Fix Guide](https://brasstranscripts.com/blog/audio-quality-ruining-transcripts-2026-fix-guide)

**Privacy & Legal:**
- [Recording Virtual Meetings: Legal Concerns](https://screenrec.com/business-communication-app/recording-virtual-meetings-legal-concerns/)
- [It's Okay to Say No to AI Notetaking](https://www.coblentzlaw.com/news/its-okay-to-say-no-to-ai-notetaking-and-meeting-recordings/)
- [Consent and Audio Recording Laws by State](https://blog.eyespysupply.com/2026/01/15/consent-and-audio-recording-laws-explained-by-state/)
- [Mobile audio recording permissions best practices](https://developer.android.com/guide/topics/permissions/overview)

**Speaker Diarization:**
- [Speaker Diarization: A Review of Recent Research](https://www.researchgate.net/publication/220655948_Speaker_Diarization_A_Review_of_Recent_Research)
- [A Review of Speaker Diarization: Recent Advances with Deep Learning](https://www.sciencedirect.com/science/article/abs/pii/S0885230821001121)
- [Speaker Diarization: A Review of Objectives and Methods](https://www.mdpi.com/2076-3417/15/4/2002)

**LLM Integration:**
- [LLMs in Mobile Apps: Practices, Challenges, and Opportunities](https://arxiv.org/html/2502.15908v1)
- [Integrating LLMs in Mobile Apps: Challenges & Best Practices](https://www.theusefulapps.com/news/integrating-llms-mobile-challenges-best-practices-2025)
- [Building LLM-Powered Mobile Apps: A Practical Guide](https://medium.com/@treena95d/building-llm-powered-mobile-apps-a-practical-guide-for-founders-and-product-teams-in-2025-78225227100a)

**Calendar Integration:**
- [How to Integrate Outlook Calendar API Into Your App](https://www.onecal.io/blog/how-to-integrate-outlook-calendar-api-into-your-app)
- [How to Integrate Google Calendar API Into Your App](https://www.onecal.io/blog/how-to-integrate-google-calendar-api-into-your-app)
- [Google Calendar Syncing No Longer Working for Outlook](https://learn.microsoft.com/en-us/answers/questions/5690324/google-calendar-syncing-no-longer-working-for-outl)

**Performance & Storage:**
- [React Native AsyncStorage: Complete Guide](https://mernstackdev.com/react-native-asyncstorage/)
- [Best Practices of using Offline Storage in React Native](https://medium.com/@tusharkumar27864/best-practices-of-using-offline-storage-asyncstorage-sqlite-in-react-native-projects-dae939e28570)
- [Improving performance of react-markdown](https://github.com/orgs/remarkjs/discussions/1027)

**Cost & Scaling:**
- [Breaking Down Unified API Pricing](https://www.apideck.com/blog/breaking-down-unified-api-pricing-why-api-call-pricing-stands-out)
- [Mobile App Development Cost In 2026](https://www.appverticals.com/blog/mobile-app-development-cost/)

---
*Pitfalls research for: K7Notes - AI-powered note-taking app with meeting capture*
*Researched: 2026-01-31*
