# Tindahan Tracker — Mobile-First UI/UX Improvement Proposal

**Document type:** UI/UX proposal for review  
**Status:** Proposal only — not approved for implementation  
**Date:** 2026-11-06  
**Product:** Tindahan Tracker  
**Design direction:** Hybrid refinement  
**Primary priority:** Mobile experience  
**Secondary priority:** Desktop usability and consistency

---

## 1. Executive Summary

Tindahan Tracker should evolve through a **careful hybrid refinement** of its existing visual system. The goal is not to replace its identity with a generic SaaS dashboard, modern POS template, or decorative redesign. The goal is to make the existing interface clearer, more comfortable, faster to use, and more reliable for everyday family-store operations—especially on phones.

The current design has a recognizable foundation:

- Black-and-white, high-contrast visual language.
- Work Sans typography and tabular financial numerals.
- Grayscale surfaces, thin borders, and restrained card styling.
- Green and red reserved for positive and negative financial meaning.
- Minimal decoration and a numbers-first approach.
- Large touch targets, bilingual labels, and plain-language guidance.
- A mobile-oriented application shell with a desktop layout at wider widths.

These are strengths worth preserving. The proposed improvements focus on **information hierarchy, navigation, task flow, input ergonomics, data presentation, and feedback states**.

The intended result is a more polished and coherent Tindahan Tracker that remains familiar to its existing users.

> **Core design principle:** Preserve the identity; improve the experience.

---

## 2. Existing Design Identity to Preserve

The following characteristics should be treated as established design decisions unless code inspection or usability evidence demonstrates a concrete problem.

### 2.1 Visual identity

| Existing characteristic | Proposed treatment |
|---|---|
| White/light surfaces and black text | Preserve as the default visual foundation |
| Black active navigation and primary emphasis | Preserve; use consistently for primary actions |
| Grayscale borders and muted panels | Preserve, while improving contrast where necessary |
| Green/red financial semantics | Preserve; never use these colors as decoration |
| Work Sans | Preserve unless a measured readability issue justifies a change |
| Tabular/lining numerals | Preserve for currency, quantities, and financial comparisons |
| Thin borders and restrained corner radius | Preserve; refine consistency rather than adding heavy shadows |
| Minimal decoration and no unnecessary emoji | Preserve |
| Dark mode | Preserve and ensure all new components support it |
| Bilingual English/Filipino wording | Preserve; avoid layouts that break when labels are longer |

### 2.2 Experience identity

Tindahan Tracker is a family-store management tool, not a general-purpose enterprise platform. Its interface should remain:

- Practical rather than ornamental.
- Understandable to nontechnical family members.
- Optimized for frequent, small operational tasks.
- Clear about money, stock, debt, and business status.
- Forgiving of ordinary input mistakes.
- Consistent across devices without forcing users to learn two different interfaces.

### 2.3 What “hybrid” means in this proposal

Hybrid does **not** mean mixing unrelated design systems. It means combining:

1. **The existing minimalist identity** — high contrast, restrained color, simple surfaces, numerical clarity.
2. **Modern usability conventions** — stronger content hierarchy, clearer navigation, better form flow, useful feedback, and responsive layouts.
3. **A mobile-first interaction model** — important actions remain reachable, readable, and comfortable on a phone.
4. **A capable desktop presentation** — wider screens use space intelligently without simply stretching the mobile layout.

---

## 3. Goals and Non-Goals

### 3.1 Goals

1. Make the most common store tasks easier to find and complete on a phone.
2. Improve the visual hierarchy of the dashboard and other information-dense screens.
3. Reduce unnecessary scrolling, repeated navigation, and avoidable taps.
4. Make forms easier to complete accurately with a mobile keyboard.
5. Make financial figures and operational warnings easier to scan.
6. Improve consistency across modules without making every screen look identical.
7. Maintain accessibility in light mode and dark mode.
8. Preserve the existing business logic, data model, and application behavior unless a separate approved technical proposal authorizes changes.
9. Keep the experience understandable to the intended family users.

### 3.2 Non-goals

This proposal does **not** authorize:

- A complete visual rebrand.
- Replacing the current color system with a colorful dashboard theme.
- Introducing gradients, glassmorphism, decorative illustrations, or heavy shadows as a new identity.
- Replacing Work Sans without evidence.
- Rewriting the application in a framework.
- Replacing the current navigation architecture without first evaluating it.
- Changing financial calculations, inventory rules, debt logic, permissions, or data structures.
- Changing Supabase, authentication, database policies, or deployment.
- Adding features merely because they are common in other POS applications.
- Removing existing functionality to make the interface look simpler.

Visual changes must not silently alter application behavior.

---

## 4. Primary UX Strategy: Design Around Real Store Tasks

The interface should be evaluated by how efficiently a family member can complete real tasks—not by how modern a screenshot looks.

### 4.1 Task priorities

Claude should inspect actual usage paths and confirm which actions are most frequent. As a starting hypothesis, prioritize:

**High-frequency / operational**
- Record today's sales or daily entry.
- Record an expense or cash movement.
- Check current store health and today's figures.
- Find an item or check stock.
- Record or review a customer's utang.
- Check GCash or cash-related information.

**Medium-frequency / management**
- Review suppliers and purchases.
- Review household budget information.
- Check insights and historical performance.
- Review notifications and operational warnings.

**Lower-frequency / administration**
- Manage settings and users.
- Use data tools, exports, imports, or recovery functions.
- Review audit history and help content.

These are proposed priority groups, not confirmed analytics. Verify them with the owner and family users before reorganizing the interface.

### 4.2 Design implication

Frequent tasks should require fewer navigation steps and be easier to reach. Less frequent administration should remain available without competing visually with daily operations.

Do not assume that every module deserves equal prominence on the home screen.

---

## 5. Proposed Mobile Application Structure

### 5.1 Navigation recommendation

Evaluate a **mobile bottom navigation bar for a small set of primary destinations**, with a clearly labeled “More” destination for secondary modules. This is a recommendation to test, not an instruction to replace the current slide-out sidebar immediately.

A possible structure for evaluation:

- **Home** — Store Health and today's overview.
- **Entry** — Today's Entry and the most common recording actions.
- **Inventory** — Stock and item lookup.
- **Utang** — Customer balances and collection-related tasks.
- **More** — GCash, Household Budget, Suppliers, Expansion, Insights, Notifications, Settings, Data Tools, and Help.

The exact destinations must be chosen from actual usage frequency and the existing navigation structure. If the current modules make this grouping confusing, retain the existing navigation and improve its organization instead.

### 5.2 Navigation requirements

- Use a persistent, predictable primary navigation pattern on mobile.
- Each destination must have a visible text label; do not rely on icons alone.
- Active state must be obvious in grayscale and dark mode.
- Keep the number of primary destinations limited.
- Place secondary and administrative modules in a clearly named secondary area.
- Avoid nested menus several levels deep.
- Preserve a consistent way to return to Home.
- Do not hide important warnings or account/session status behind an obscure menu.
- Avoid placing navigation controls where they conflict with device gesture areas or the keyboard.

### 5.3 Sidebar and desktop

On wider screens, the existing sidebar can remain if it continues to work well. Improve its grouping and hierarchy rather than introducing a separate desktop visual identity.

Desktop navigation should:
- Group modules by purpose.
- Make the active location clear.
- Keep labels readable.
- Avoid excessive empty space or an overly long unstructured list.
- Preserve a clear distinction between everyday operations and administration.

### 5.4 Header

Review the current sticky header and fixed controls. On narrow screens:

- Keep the page title and essential actions visible.
- Avoid crowding the header with too many icons.
- Give icon-only controls accessible labels and clear hit areas.
- Prevent the header from consuming too much vertical space.
- Ensure content is not hidden behind the sticky header after navigation or anchor movement.

The undo and notification controls should remain easy to find if they are important to daily work, but should not visually compete with the page's primary action.

---

## 6. Home Dashboard: Improve Hierarchy Without Turning It Into a Marketing Dashboard

The Store Health screen should remain the operational starting point. Its current plain-language verdict and financial figures are useful design decisions.

### 6.1 Recommended content order

Evaluate this order for mobile:

1. **Store status / health verdict** — a concise, understandable statement.
2. **Most important current financial figure** — only if the existing business logic defines a reliable primary figure.
3. **Today's key figures** — revenue, expenses, net result, or the existing equivalents.
4. **Actionable alerts** — items requiring attention, such as low stock or overdue balances, if supported by current data.
5. **Quick actions** — shortcuts to frequent tasks.
6. **Secondary summaries** — useful supporting information.
7. **Historical charts or deeper analysis** — lower on the page or within Insights.

Do not invent a new financial metric or change the meaning of an existing one to fit this layout.

### 6.2 Financial hierarchy

- Use size and weight to distinguish the most important number from supporting values.
- Keep currency symbols, signs, and units clear.
- Use tabular numerals to make values easier to compare.
- Preserve explicit positive/negative indicators and written labels.
- Never communicate profit, loss, debt, or warning status through color alone.
- Avoid showing too many equally prominent numbers in one section.
- Use consistent decimal and currency formatting.

### 6.3 Quick actions

Quick actions should be limited to tasks that are both frequent and safe to initiate.

- Use short, explicit labels such as “Record Sale” or the app's existing terminology.
- Keep the primary action visually distinct.
- Avoid a large grid of buttons for every module.
- Do not place destructive actions beside routine actions.
- If an action opens a form, preserve the user's context and provide a clear way back.

### 6.4 Alerts

Alerts should be actionable, not merely informational decoration.

Each alert should communicate:
- What needs attention.
- Why it matters, when known.
- What the user can do next.
- Whether it is urgent or simply a reminder.

Do not create alerts for conditions the current data cannot reliably determine.

---

## 7. Forms and Data Entry: Highest Mobile Usability Priority

Forms are central to a store-management application. A visually attractive dashboard will not compensate for frustrating or error-prone data entry.

### 7.1 Form layout

- Use one clear column on phones.
- Group related fields into short sections.
- Put labels above fields rather than relying on placeholder text.
- Keep helper text close to the relevant field.
- Use appropriate mobile input types and keyboards for numbers, currency, dates, and text.
- Avoid horizontal form layouts on narrow screens.
- Preserve entered values when validation fails.
- Make required and optional fields explicit.
- Keep the primary submit action easy to find.

### 7.2 Field behavior

- Use numeric keyboards for numeric values where appropriate.
- Do not force users to manually type formatting characters if the existing input logic can safely handle formatting.
- Make units and quantity expectations visible.
- Use sensible defaults only when they are already supported by business rules.
- Avoid pre-filling values that could create accidental transactions.
- Ensure focus and keyboard behavior do not cover the active field or submit button.
- Prevent accidental double submission where a transaction is being saved.

### 7.3 Validation

Validation messages should be:
- Specific about the field or issue.
- Written in plain language.
- Displayed close to the relevant input.
- Persistent enough to be read.
- Non-destructive to the rest of the form.

Avoid vague messages such as “Invalid input” when the actual correction can be explained.

### 7.4 Save and confirmation behavior

For important financial or inventory changes:
- Make the primary action label describe the action.
- Show a clear saving state.
- Prevent repeated taps while the operation is pending when appropriate.
- Confirm success only after the application reports success.
- If saving fails, explain that the change was not confirmed as saved.
- Preserve the user's input so they can retry.
- Do not show a success message merely because the button was tapped.

### 7.5 Destructive actions

For reset, delete, import replacement, or other high-impact actions:
- Separate them visually from routine actions.
- Explain the consequence before confirmation.
- Identify the affected data where possible.
- Require an intentional confirmation step.
- Avoid ambiguous buttons such as “Yes” and “No” without context.
- Preserve any existing owner-only restrictions.

UI changes must not weaken existing safeguards.

---

## 8. Tables, Lists, Inventory, and Utang

Dense desktop tables often become difficult to use on phones. Each module should use a mobile-appropriate presentation rather than shrinking a wide table until it becomes unreadable.

### 8.1 Mobile presentation

For each existing table, evaluate:
- A compact stacked record/card layout.
- A short list with the most important values visible.
- A detail view for secondary information.
- Horizontal scrolling only when the data genuinely requires a table.

Do not convert every record into a large decorative card. The aim is efficient scanning.

### 8.2 Information priority

For inventory, prioritize the fields users need to identify and act on an item. For utang, prioritize the customer, balance, and the next relevant action. For suppliers, prioritize identification and the information needed for the current workflow.

The exact fields must be derived from the existing data model and screens. Do not omit important information merely to achieve a cleaner layout.

### 8.3 Search and filtering

- Keep search easy to reach on long lists.
- Use clear search hints.
- Make active filters visible.
- Provide a simple way to clear filters.
- Avoid overly complex filter panels for routine tasks.
- Ensure empty search results explain that nothing matched and how to recover.

### 8.4 Sorting and status

- Make the current sort order understandable where sorting exists.
- Use text labels alongside status colors.
- Keep status terminology consistent across modules.
- Avoid showing a status badge without explaining its meaning when the meaning is not obvious.

---

## 9. Charts and Insights

Charts should support decisions, not act as decoration.

- Preserve the restrained visual language.
- Use a limited, consistent chart palette.
- Reserve green and red for the same positive/negative semantics used elsewhere.
- Ensure labels, axes, and tooltips remain readable on small screens.
- Avoid legends that consume more space than the chart itself.
- Provide a text or numerical summary for important chart conclusions.
- Do not rely on color alone to distinguish series.
- On mobile, avoid charts that require precise hovering to reveal essential values.
- Keep detailed historical analysis in Insights rather than crowding the Home screen.

If a chart cannot remain legible at phone width, use a simplified mobile presentation or a concise data list. Do not force the desktop chart into a tiny container.

---

## 10. Visual System Refinements

The design system should be made more consistent, not replaced.

### 10.1 Color

Retain:
- White and black as primary surfaces and text.
- Grayscale for borders, secondary surfaces, and muted information.
- Green for positive financial meaning.
- Red for negative financial meaning or appropriately serious warnings.

Recommendations:
- Audit text and border contrast in both light and dark modes.
- Avoid introducing additional accent colors without a clear semantic purpose.
- Use neutral emphasis for ordinary navigation and actions.
- Do not make every card or module use a different accent color.
- Ensure warnings remain understandable in monochrome or low-quality displays.

### 10.2 Typography

Retain Work Sans and the current numbers-first approach.

Refine:
- A consistent type scale for page titles, section headings, body text, labels, helper text, and captions.
- Clear differences between primary values and supporting values.
- Adequate line height for small-screen reading.
- Consistent font weights.
- Tabular numerals for financial and quantitative values.

Avoid shrinking text simply to fit more information on screen.

### 10.3 Spacing and layout

- Define a consistent spacing scale and apply it across modules.
- Use tighter spacing for related financial values and list rows.
- Use larger spacing between unrelated sections.
- Avoid both excessive blank space and cramped content.
- Keep card padding consistent unless the component has a clear reason to differ.
- Ensure page content has sufficient bottom space when fixed navigation is present.

### 10.4 Borders, cards, and elevation

- Preserve thin borders and restrained corner radii.
- Do not add shadows to every card.
- Use surface contrast and spacing before adding elevation.
- Use cards only when they group related information or actions.
- Avoid placing a card inside another card without a clear information-architecture reason.

### 10.5 Icons

- Use icons consistently and sparingly.
- Pair icons with text for primary navigation and important actions.
- Ensure icons have clear meaning at small sizes.
- Avoid emoji as a substitute for a consistent icon system.
- Do not introduce icons that are visually inconsistent with the existing interface.

---

## 11. Mobile Responsiveness and Touch Ergonomics

Mobile is the primary design target. Desktop should adapt from the mobile system, not dictate it.

### 11.1 Touch targets

The existing code already uses large controls in many places. Preserve that strength.

- Keep important interactive targets around 44–48 CSS pixels or larger where practical.
- Provide sufficient spacing between destructive and non-destructive controls.
- Avoid tiny close, edit, or overflow icons.
- Make list rows easy to tap without requiring precision.
- Do not let decorative spacing reduce the actual clickable area.

### 11.2 Screen widths

Test at a range of realistic phone widths, including narrow devices. At minimum, inspect:
- 320 CSS px.
- 360 CSS px.
- 375 CSS px.
- 390 CSS px.
- 430 CSS px.
- Tablet widths.
- Desktop widths at and above the existing breakpoint.

The 320px case is a stress test; do not sacrifice normal phone layouts to make every screen fit without scrolling.

### 11.3 Fixed and sticky elements

Review the header, navigation, notification, undo, and other fixed controls.

Check:
- They do not overlap page content.
- They do not cover form fields or submit actions when the keyboard opens.
- They respect safe areas on modern phones.
- They do not consume excessive vertical space.
- Their behavior remains stable during scrolling and route/module changes.

### 11.4 Responsive content

- Prefer reflowing content over scaling it down.
- Stack related columns on phones.
- Use two-column layouts only when values remain comfortably readable.
- Allow long names and bilingual labels to wrap.
- Prevent currency values from clipping.
- Avoid horizontal page overflow.
- Keep important actions visible without requiring unnecessary scrolling.

---

## 12. Accessibility, Readability, and Family Usability

The app serves users with different levels of technical familiarity. The interface should communicate clearly without requiring them to understand software conventions.

### 12.1 Readability

- Keep body text comfortably readable.
- Use clear labels instead of unexplained abbreviations.
- Explain unfamiliar terms in Help or contextual hints.
- Maintain sufficient contrast in both themes.
- Do not rely on tiny captions for important instructions.

### 12.2 Interaction

- Provide visible focus states for keyboard users.
- Ensure every icon-only button has an accessible name.
- Keep controls in a predictable order.
- Avoid relying on hover to reveal essential information.
- Make error and success feedback perceivable.
- Respect reduced-motion preferences.

### 12.3 Language

- Preserve existing English/Filipino support.
- Check that longer Filipino labels do not break buttons, navigation, or cards.
- Avoid truncating important financial or operational wording.
- Use consistent terminology for the same business concept across screens.

### 12.4 Avoiding user mistakes

- Make action consequences clear.
- Distinguish viewing from editing.
- Distinguish saving from canceling.
- Use clear labels for money movement and debt-related actions.
- Do not rely on color or icon shape alone to communicate risk.

---

## 13. Dark Mode

Dark mode should be treated as a first-class version of the same design system, not a separate theme.

- Preserve the same information hierarchy and component structure.
- Maintain readable contrast for text, muted text, borders, and disabled controls.
- Keep green/red financial semantics consistent and legible.
- Ensure input fields, dropdowns, dialogs, charts, and validation states all adapt.
- Check that black active navigation remains distinguishable from dark surfaces.
- Avoid pure-black-on-near-black combinations that erase component boundaries.
- Test all newly refined components in both themes.

Do not introduce a new color palette solely for dark mode.

---

## 14. Feedback, Loading, Empty, and Error States

A polished interface must communicate what the application is doing.

Review every important workflow for these states:

| State | Expected behavior |
|---|---|
| Loading | Show a clear, restrained loading indication; prevent misleading interaction |
| Saving | Indicate that the action is in progress |
| Success | Confirm only after the operation succeeds |
| Validation error | Explain the issue close to the relevant field |
| Network/save failure | State that the operation was not confirmed as saved; preserve user input where possible |
| Empty list | Explain that there are currently no records and what action is available |
| No search results | Explain that no records matched and provide a way to clear the search |
| Offline/pending write | Communicate pending status accurately; do not imply server confirmation |
| Read-only mode | Explain why editing is unavailable |
| Conflict | Make the conflict understandable and avoid silently overwriting data |

Use the app's existing offline queue, save-conflict, undo, and read-only behavior as constraints. Do not redesign their underlying logic as part of a visual-only task.

---

## 15. Module-by-Module Review Checklist

Claude should inspect each module and record the actual screen, current behavior, and recommended UI change before implementation.

| Module | UI/UX review focus |
|---|---|
| Store Health / Home | Information hierarchy, primary figures, actionable alerts, quick actions |
| Today's Entry | Form order, numeric input, save feedback, error recovery |
| GCash | Clear balance and transaction presentation; avoid ambiguous money labels |
| Household Budget | Distinguish household and store figures; improve scanning without changing calculations |
| Utang / Loans | Customer identification, balance visibility, payment actions, confirmation |
| Suki Utang | Clear customer and balance hierarchy; avoid accidental payment or balance changes |
| Expansion | Explain status and next actions; prevent dense information from overwhelming mobile |
| Inventory | Search, stock visibility, item details, low-stock communication |
| Suppliers | Easy scanning and access to relevant supplier information |
| Insights | Mobile chart readability and concise numerical summaries |
| Notifications | Clear priority, readable message, useful next action |
| Settings | Group related preferences; distinguish local-device settings from account-wide settings |
| Data Tools | Strong visual separation and confirmation for high-impact actions |
| Help | Searchable or well-grouped guidance; plain-language explanations |

This is a review checklist, not a request to redesign every module simultaneously.

---

## 16. Recommended Implementation Priorities

Work in small, reviewable stages. The order below is a suggested sequence; Claude should adjust it if source inspection reveals dependencies.

### Phase 0 — Audit and baseline

**Priority: Required before implementation**

- Inspect the current `index.html` and relevant styles/scripts.
- Map the actual navigation and module structure.
- Identify shared components and repeated patterns.
- Identify the most common task flows with the owner.
- Record existing responsive breakpoints and fixed elements.
- Capture baseline screenshots at representative mobile and desktop widths.
- Record existing behavior that must not change.
- Identify any existing accessibility or responsive defects.

**Deliverable:** A concise audit with evidence, affected selectors/components, and proposed changes.

### Phase 1 — Mobile foundation

**Priority: Highest**

- Fix mobile overflow and clipping.
- Review header and fixed-control collisions.
- Standardize touch-target sizing.
- Improve form layout and keyboard behavior.
- Improve spacing and typography consistency.
- Ensure sticky/fixed elements do not obscure content.
- Verify light and dark mode.

**Reason:** These changes affect nearly every module and reduce everyday friction.

### Phase 2 — Home and primary navigation

**Priority: High**

- Refine Store Health information hierarchy.
- Evaluate a small mobile primary navigation plus “More.”
- Improve quick-action placement.
- Improve alert presentation.
- Preserve the current sidebar where appropriate on desktop.

**Reason:** Users should quickly understand the store's current state and reach common tasks.

### Phase 3 — High-frequency workflows

**Priority: High**

- Refine Today's Entry.
- Refine inventory lookup and stock presentation.
- Refine utang and payment-related flows.
- Refine GCash or other frequently used money workflows.
- Improve validation, saving, success, and error states.

**Reason:** These screens are where usability problems can cause operational mistakes.

### Phase 4 — Secondary modules and data presentation

**Priority: Medium**

- Refine Household Budget, Suppliers, Expansion, and Insights.
- Improve mobile lists and tables.
- Improve chart summaries and filtering.
- Group Settings and Help more clearly.

### Phase 5 — Polish and regression

**Priority: Required before release**

- Test all representative screen widths.
- Test light and dark modes.
- Test English and Filipino labels.
- Test keyboard and touch interaction.
- Test all high-impact confirmation flows.
- Verify no business logic or data behavior changed.
- Compare before/after screenshots.

---

## 17. Acceptance Criteria

A UI change should not be considered complete merely because it looks better in one screenshot.

### 17.1 Mobile acceptance

- No unintended horizontal page scrolling at supported phone widths.
- No clipped financial figures or important labels.
- No overlapping header, navigation, keyboard, or content.
- Primary actions are reachable and clearly labeled.
- Important touch targets are comfortably tappable.
- Forms remain usable with the on-screen keyboard open.
- Validation does not erase unrelated user input.
- Loading, success, failure, empty, and pending states are understandable.
- Long Filipino and English labels do not break the layout.

### 17.2 Visual consistency acceptance

- Existing black-and-white identity remains recognizable.
- Green and red retain their existing semantic roles.
- Work Sans remains the primary typeface unless separately justified.
- Cards, borders, spacing, and typography use consistent rules.
- No unnecessary gradients, decorative color systems, or heavy shadows are introduced.
- Dark mode remains coherent and readable.

### 17.3 Functional regression acceptance

- All existing modules remain accessible.
- Existing calculations and business rules are unchanged.
- Existing permissions and visibility rules are unchanged.
- Existing save, undo, offline, conflict, and read-only behaviors remain intact.
- No existing data is discarded or migrated as part of a visual-only change.
- No new production database or Supabase changes are made.
- No deployment occurs without explicit approval.

### 17.4 Review evidence

For each completed phase, provide:
- Before/after screenshots at the same viewport size.
- A list of files and components changed.
- A short explanation of each meaningful change.
- A regression checklist.
- Any known limitations or unresolved questions.

---

## 18. Constraints for Claude

**This document is a proposal for assessment, not implementation authorization.**

Before changing code, Claude must:

1. Inspect the current source and compare this proposal with the actual implementation.
2. Identify which recommendations are already satisfied.
3. Identify recommendations that conflict with existing behavior or technical constraints.
4. Preserve working patterns where there is no demonstrated usability problem.
5. Separate visual changes from business-logic changes.
6. Avoid rewriting the application or introducing a framework for this task.
7. Avoid changing database schema, Supabase configuration, RLS, authentication, roles, or security behavior.
8. Avoid removing modules or features to simplify the interface.
9. Present any material trade-offs before implementation.
10. Wait for explicit owner approval of the proposed implementation plan.

### Required classification

For every recommendation, use one of these labels:

- **Already satisfied** — the current implementation already meets the recommendation.
- **Required** — a clear usability, accessibility, or functional issue warrants the change.
- **Recommended** — likely improvement with low risk.
- **Optional** — aesthetic or convenience refinement with limited impact.
- **Not recommended** — conflicts with the product identity, creates unnecessary complexity, or has insufficient benefit.
- **Needs owner input** — requires confirmation of actual family workflow or preference.

### Required assessment output

Before implementation, return:

1. **Current UI summary** — describe the actual design and responsive behavior.
2. **Existing strengths to preserve** — identify concrete code/UI patterns.
3. **Mobile usability issues** — ranked by severity and frequency.
4. **Navigation assessment** — compare the current sidebar with the proposed mobile navigation; recommend one with reasons.
5. **Module review** — identify the most important screens to refine first.
6. **Design-system impact** — list proposed token or component changes, if any.
7. **Regression risks** — especially around fixed controls, forms, financial values, and existing state behavior.
8. **Phased implementation plan** — small, independently reviewable stages.
9. **Open questions** — only questions that materially affect the design.
10. **Recommendation** — what should be done first and what should be left unchanged.

Do not implement during this assessment.

---

## 19. Final Design Direction

Tindahan Tracker should look more intentional, not more complicated.

The ideal result is still recognizably the same product:
- White and black remain the foundation.
- Financial numbers remain the center of attention.
- Green and red retain meaning.
- Layouts become clearer and more disciplined.
- Navigation becomes easier on a phone.
- Forms become faster and safer to use.
- Dense information becomes easier to scan.
- Desktop gains structure without becoming a different product.

The guiding test for every proposed change is:

**Does this make a real store task clearer, faster, safer, or easier on a phone while preserving the product's existing identity?**

If the answer is no, the change probably does not belong in this proposal.

---

## 20. Scope Note

This proposal is based on the repository's existing source-level design and documented product structure. It is not a complete usability study with family members, nor a pixel-perfect audit of every live screen. Claude should verify each recommendation against the current code and actual rendered screens. Where behavior or user workflow is uncertain, it must be treated as an assumption and confirmed before implementation.
