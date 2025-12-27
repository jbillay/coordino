# Coordino SaaS Landing Page - Content & Structure Blueprint

**Note:** This document is a blueprint for the landing page content and layout. It uses Markdown to structure the information and includes notes `(in parentheses)` that reference the `DESIGN_GUIDELINES.md` to guide the final visual implementation.

---

## 1. Navigation Bar

*   **Logo:** `[Coordino Logo Image (coordino-logo.png)]` Coordino
*   **Links:** Product | Features | Pricing | (Spaced out)
*   **Actions:**
    *   `Log In` (Styled as a secondary/text button)
    *   `Get Started for Free` (Styled as a primary button with `var(--brand-teal-500)` background)

---

## 2. Hero Section

**(Background: A subtle, light gray or a dark-themed gradient depending on the detected system preference)**

**Headline:**
# Stop Juggling Apps. Start Coordinating.

**(Typography: Use `--text-4xl`, `--font-bold`)**

**Sub-headline:**
Coordino is the calm, integrated workspace for your tasks, notes, and meetings. Finally, all your work is in one focused place.

**(Typography: Use `--text-xl`, `--font-normal`, `var(--text-secondary)`)**

**Call to Action (CTA):**
[Button: `Get Started for Free`]
*(Style: Primary button, large, with `var(--brand-teal-500)` background. Includes a subtle hover-lift effect.)*

**Below CTA:**
*No credit card required. Start organizing in seconds.*
*(Style: Use `--text-sm`, `var(--text-tertiary)`)*

**Visual:**
`[Hero image showing a clean, aesthetically pleasing screenshot of the Coordino dashboard. The shot should subtly feature elements from the Tasks, Notes, and Scheduling modules to hint at the integrated experience. Use the light or dark theme to match the user's preference.]`

---

## 3. Social Proof

**(A simple, clean section below the fold to build immediate trust.)**

**Text:**
Join thousands of productive individuals and teams who are organizing their work and life with Coordino.

**(Logos: Optional - If you have them, a series of muted grayscale logos of companies or organizations. e.g., `[Logo 1] [Logo 2] [Logo 3]`)**

---

## 4. Features Section (Benefit-Oriented)

**(Organized as a 3-part grid or alternating sections. Each section has a heading, a paragraph, and a corresponding visual.)**

### Feature 1: Tasks

**Icon:** `[Check-circle icon, colored with brand-teal-500]`

**Headline:**
## Flow Through Your Tasks, Effortlessly.

**Body:**
Move beyond basic to-do lists. Coordino's task manager is built for speed and clarity. Create custom workflows, set priorities, and filter your view to see only what matters now. Our information-dense design means less scrolling and more doing.

**Visual:**
`[An animated GIF or short video showing the compact task list. It demonstrates a user quickly filtering the list using the chip-based filters, hovering to reveal actions, and checking off a task with the celebration animation.]`

### Feature 2: Notes

**Icon:** `[File-edit icon, colored with brand-purple-500]`

**Headline:**
## Capture Knowledge, Not Clutter.

**Body:**
A second brain, seamlessly integrated with your work. Our rich-text editor is your space for everything from quick thoughts to detailed project specs. Organize with topics, find anything with powerful search, and trust that autosave has you covered.

**Visual:**
`[A close-up screenshot of the rich-text editor in action. It shows formatted text, including a heading, a list, and a code block, emphasizing its versatility and clean interface.]`

### Feature 3: Scheduling (The Differentiator)

**Icon:** `[Users icon, colored with brand-ocean-500]`

**Headline:**
## Schedule Meetings with Global Respect.

**Body:**
Stop the timezone gymnastics. Coordino’s revolutionary **Meeting Equity Score** helps you find the fairest time for everyone, instantly. Our heatmap visualizes the impact on all participants, considering working hours and local holidays, so you can build a truly global-friendly team culture.

**Visual:**
`[A vibrant image of the Scheduling Assistant's heatmap, showing a clear "sweet spot" highlighted in green. Include the Equity Score gauge prominently, displaying a high score like "92/100".]`

---

## 5. Unique Value Proposition Section

**(A central section to drive home the core "why".)**

**Headline:**
# Your Work, Finally Connected.

**Body:**
Tired of linking to a dozen different apps? The magic of Coordino is its **integrated context**. Link notes directly to your tasks. Create follow-up actions from your meeting schedule. See everything related to a project in one view. Stop switching, start syncing.

**Visual:**
`[A diagram or animation showing lines connecting a Task card, a Note document, and a Meeting event, all within the Coordino UI, forming a connected triangle around a central project name.]`

---

## 6. Pricing Section

**(A clear, 3-column pricing table with a toggle for Monthly/Annually billing.)**

**Headline:**
## Find the Plan That’s Right for You.

[Toggle: `Monthly` | `Annually (Save 20%)`]

| **Personal** | **Pro** | **Teams** |
| :--- | :--- | :--- |
| **Free** | **$8** / month | **$15** / user / month |
| For individuals organizing their life and work. | For power users and freelancers automating their productivity. | For collaborative teams that need to stay in sync. |
| [Button: `Start for Free`] *(Primary Style)* | [Button: `Upgrade to Pro`] *(Secondary Style)* | [Button: `Contact Sales`] *(Secondary Style)* |
| **Includes:** | **Everything in Personal, plus:** | **Everything in Pro, plus:** |
| ✅ 3 Active Projects | ✅ Unlimited Projects | ✅ Shared Workspaces |
| ✅ 200 Active Tasks | ✅ Unlimited Tasks & Notes | ✅ Collaborative Tasks & Notes |
| ✅ 100 Notes | ✅ AI-Enhanced Scheduling | ✅ Team-Aware Scheduling |
| ✅ Basic Scheduling Assistant | ✅ Advanced Note Features (Search, History) | ✅ Roles & Permissions |
| ✅ Core Features | ✅ Advanced Task Features (Recurring) | ✅ Centralized Billing |
| | ✅ Calendar Sync (Coming Soon) | ✅ Audit Logs |

---

## 7. FAQ Section

**(An accordion-style component to keep the layout clean.)**

1.  **Is the Personal plan really free forever?**
    *   Yes! The Personal plan is free forever for individuals. It includes all core features with the usage limits listed above.

2.  **Can I collaborate with others on the Pro plan?**
    *   The Pro plan is designed for a single user. To collaborate with others in a shared workspace, you'll need the Teams plan.

3.  **How does the Teams plan billing work?**
    *   You are billed per user per month. The workspace owner manages the subscription and can add or remove members at any time.

4.  **Can I export my data if I decide to leave?**
    *   Absolutely. We believe in data ownership. You can export all of your data at any time on any plan.

---

## 8. Final Call to Action (CTA)

**(A visually distinct, full-width section just before the footer.)**

**Headline:**
# Ready to Unify Your Workflow?

**Body:**
Get started with Coordino for free and experience a calmer, more organized way to work.

[Button: `Sign Up Now - It's Free!`]
*(Style: Primary button, extra large, with `var(--brand-teal-500)` background.)*

---

## 9. Footer

**(Simple, clean, and follows the dark/light theme.)**

*   `[Coordino Logo]`
*   © 2025 Coordino Inc. All rights reserved.
*   **Links:**
    *   Product
    *   Pricing
    *   Changelog
    *   Contact
    *   Privacy Policy
    *   Terms of Service
*   **Social Icons:** `[Twitter Icon]` `[LinkedIn Icon]`
