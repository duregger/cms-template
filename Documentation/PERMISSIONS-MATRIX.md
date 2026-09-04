# CMS Permissions Matrix

> **Status:** Proposal — for review by engineering and product before implementation.
>
> This document was audited against every interactive element in the current CMS codebase (every button, form field, drag handle, file picker, and destructive action across all pages and components). Items marked **[NEW]** are capabilities that don't exist in the current product and would need to be built.

---

## Seat Definitions

### Content Seat

The day-to-day marketing user. They can create and build full pages by assembling existing components and selecting from existing variables — but they don't create new components or variables, and they can't push content live on their own. Within a component, they can edit content values (text, images, URLs, colors) but not field names or slugs.

**Who this is:** Marketing coordinators, social/content managers, regional marketing leads.

### Editor Seat

A power user who extends the CMS — creating new components, defining variable schemas, adding new fields. Creating a new variable or component is a schema change that typically requires development on the consumer website to render correctly. Editors can do everything a Content seat can, plus this structural/schema work. But like Content seats, they cannot single-handedly publish. This prevents a single person from building something and shipping it without a second set of eyes.

### Admin Seat

Full access. Admins can publish on their own and do anything an Editor can. This is for the CMS owner or lead — the person accountable for what goes live.

**Who this is:** Digital director, CMS lead, senior dev with CMS responsibility.

---

## Permissions Matrix

### Pages

These actions map to `CmsPagesList.tsx`, `CmsPageEditor.tsx`, and the sidebar in `CmsLayout.tsx`.

| Action | Content | Editor | Admin | Notes |
|--------|:-------:|:------:|:-----:|-------|
| View pages list and navigate to pages | Yes | Yes | Yes | Sidebar `NavLink`s + breadcrumbs |
| Create new page | Yes | Yes | Yes | `CmsPagesList` form: slug input, parent page select, Create button |
| Set parent page (on create or existing) | Yes | Yes | Yes | `CmsPagesList` parent select + `CmsPageEditor` parent `<select>` |
| Edit SEO fields (title, description, canonical, noIndex) | Yes | Yes | Yes | `CmsPageEditor` collapsible SEO panel |
| Edit Open Graph fields (ogTitle, ogDescription, ogType) | Yes | Yes | Yes | `CmsPageEditor` OG panel |
| Upload / replace OG image | Yes | Yes | Yes | File picker → `uploadCmsAsset(file, 'og')` |
| Add section to page | Yes | Yes | Yes | `CmsPageEditor` "+ Add Section" inline form |
| Remove section from page | Yes | Yes | Yes | `CmsPageEditor` Remove button → `ConfirmDeleteModal` |
| Reorder sections (▲ / ▼) | Yes | Yes | Yes | `CmsPageEditor` arrows on each section |
| Rename section | Yes | Yes | Yes | `CmsPageEditor` section name text input |
| Add existing component to a section | Yes | Yes | Yes | `CmsPageEditor` "+ Add Component" dropdown (picks from existing) |
| Remove component item from a section | Yes | Yes | Yes | `CmsPageEditor` Remove on each `SectionItemRow` |
| Reorder items within a section (▲ / ▼) | Yes | Yes | Yes | `CmsPageEditor` arrows on each item |
| Select variable on a section item | Yes | Yes | Yes | `CmsPageEditor` variable `<select>` per `SectionItemRow` (existing variables only) |
| Rename page slug | — | Yes | Yes | `CmsPageEditor` click title → rename flow (deletes old doc, creates new) |
| Save page | Yes | Yes | Yes | `CmsPageEditor` fixed bottom Save button → `setDoc` |
| Delete page **[NEW]** | — | — | Yes | No delete button exists today; would need to be built |
| Submit page for publish **[NEW]** | Yes | Yes | Yes | See [Publish Workflow](#publish-workflow) |
| Approve / publish page **[NEW]** | — | Yes* | Yes | See [Publish Workflow](#publish-workflow) |

> \* Editors can approve, but cannot be the sole approver — see Publish Workflow below.

**Content seats can build full pages.** Content can create a page, add sections, pick existing components, select existing variables, reorder everything, and fill in SEO/OG. What they *cannot* do is create new components or new variables — they assemble pages from what Editors have already set up. They also cannot rename a page slug (which affects URLs and breaks links) or delete a page.

**Why slug rename is Editor-only:** Renaming a slug changes the page's URL and deletes the old Firestore document. It can break external links, bookmarks, and any front-end routing that references the old slug. This is a structural change, not a content edit.

**Key nuance — Save vs. Publish:** Today, saving a page writes directly to Firestore and the content is immediately live for consumers. There is no `status` field on pages. The publish workflow would need to add a `status` field to `CmsPage` and split "Save draft" from "Submit for publish." Content seats should be able to save drafts freely; the gate is on making content consumer-visible.

---

### Components

These actions map to `CmsComponentsList.tsx`, `CmsComponentEditor.tsx`, and `VariableEditSheet.tsx`.

| Action | Content | Editor | Admin | Notes |
|--------|:-------:|:------:|:-----:|-------|
| **Component-level** | | | | |
| View components list | Yes | Yes | Yes | Sidebar `NavLink`s + `CmsComponentsList` |
| Navigate to component from page editor | Yes | Yes | Yes | `CmsPageEditor` "Edit" link on each section item |
| Create new component | — | Yes | Yes | `CmsComponentsList` form — **schema work, requires dev to consume** |
| Edit component display name | — | Yes | Yes | `CmsComponentEditor` Display Name input |
| Edit component ID / internal name | — | Yes | Yes | `CmsComponentEditor` ID input — code-facing identifier |
| **Variable-level (schema)** | | | | |
| Add variable | — | Yes | Yes | `CmsComponentEditor` "+ Add Variable" — **new variables need dev work to render on the consumer site** |
| Reorder variables (▲ / ▼) | — | Yes | Yes | `CmsComponentEditor` arrows |
| Duplicate variable | — | Yes | Yes | `CmsComponentEditor` Duplicate button (clones with new UUID) |
| Archive / unarchive variable | — | Yes | Yes | `CmsComponentEditor` Archive/Unarchive (sets `hidden` flag) |
| Delete variable | — | Yes | Yes | `VariableEditSheet` "Delete Variable" — **permanent, no confirm dialog** |
| Edit variable label | — | Yes | Yes | `VariableEditSheet` "Variable Name" input |
| Edit variable key / slug | — | Yes | Yes | `VariableEditSheet` "Variable ID" — **affects CMS adapter variant resolution** |
| **Field-level (schema)** | | | | |
| Add field to variable | — | Yes | Yes | `VariableEditSheet` "+ Add Field" |
| Remove field from variable | — | Yes | Yes | `VariableEditSheet` × per field — **permanent, no confirm** |
| Reorder fields (▲ / ▼) | — | Yes | Yes | `VariableEditSheet` arrows per field |
| Edit field label (name) | — | Yes | Yes | `VariableEditSheet` "Field Name" input |
| Edit field key / slug | — | Yes | Yes | `VariableEditSheet` "Field ID" — **affects CMS adapter field matching** |
| Change field type | — | Yes | Yes | `VariableEditSheet` Type `<select>` (text/longform/hexcode/image/video/url) |
| **Field-level (content values)** | | | | |
| Open variable for editing | Yes | Yes | Yes | `CmsComponentEditor` Edit button → opens `VariableEditSheet` |
| Edit field default value (text, URL, hex) | Yes | Yes | Yes | `VariableEditSheet` — type-specific input for each field |
| Upload image / video for field default | Yes | Yes | Yes | `VariableEditSheet` — file picker → `uploadCmsAsset` |
| Save component | Yes | Yes | Yes | `CmsComponentEditor` fixed bottom Save button → `updateComponent` |
| Delete component **[NEW]** | — | — | Yes | `deleteComponent` exists in hook but has no UI; would need a button |

**The line between Content and Editor on components:** Content can open a variable, see its fields, and edit the *values* — the text, images, URLs, and colors that populate the front-end. They cannot touch anything that defines the schema: field names, field slugs, field types, variable names, variable slugs, or the variable/field structure itself. Creating a new variable or component is explicitly an Editor action because the consumer website needs development work to render new variables — they don't just appear on the front-end automatically.

**Why names and slugs are Editor-only (not just slugs):** The CMS adapter (`cms-adapter.ts`) resolves hero variants and content blocks by matching variable keys and field slugs. A variable key of `rio-red-tear-right` maps to `Hero_Rio-Red` with `layout: image-left`. A field slug of `headline` maps to the hero headline text. Changing any of these identifiers — including labels that auto-generate slugs — can break the consumer front-end. Content seats should never be in a position to accidentally break rendering by renaming something.

**The delete-without-confirm problem:** `VariableEditSheet` has "Delete Variable" and per-field × buttons that fire immediately with no confirmation dialog. The section delete in `CmsPageEditor` has a confirm modal, but variable/field deletes do not. The rebuild should add confirm dialogs for all destructive actions, regardless of role.

**UI implication for VariableEditSheet:** The sheet needs to render differently per role. For a Content seat, field name, slug, and type controls should be **read-only labels** (visible for context, not editable). The default value input and upload button remain fully interactive. The "+ Add Field", × delete, and ▲/▼ reorder controls are hidden. For an Editor, everything is editable.

---

### Notifications & Alerts

These actions map to `CmsAlertsList.tsx` and `CmsAlertEditor.tsx`.

| Action | Content | Editor | Admin | Notes |
|--------|:-------:|:------:|:-----:|-------|
| View notification lists (by type) | Yes | Yes | Yes | `CmsAlertsList` — filtered by route param |
| Navigate to notification | Yes | Yes | Yes | Row buttons in `CmsAlertsList` |
| Create new notification | Yes | Yes | Yes | `CmsAlertEditor` (via `/notifications/new`) |
| Select notification category | Yes | Yes | Yes | 5 category buttons — **clears media/chips/geo fields on switch** |
| Edit title | Yes | Yes | Yes | Required text input |
| Edit body | Yes | Yes | Yes | Textarea |
| Edit link URL (announcement bars) | Yes | Yes | Yes | URL input |
| Upload / remove icon | Yes | Yes | Yes | File picker (SVG/PNG/WebP/JPEG) |
| Upload / remove image | Yes | Yes | Yes | File picker or paste URL + alt text |
| Upload / remove illustration | Yes | Yes | Yes | File picker or paste URL + alt text |
| Add / remove chips | Yes | Yes | Yes | `ChipInput` — text + Enter/Add, × to remove |
| Edit CTA labels and URLs | Yes | Yes | Yes | Primary/secondary action inputs |
| Edit geo targeting (lat/lng/radius) | Yes | Yes | Yes | Number inputs (new_location type only) |
| Edit display settings (priority, dismissable, trigger, frequency) | Yes | Yes | Yes | Number input, checkbox, `<select>`s |
| Edit scheduling (start date, end date) | Yes | Yes | Yes | `datetime-local` inputs |
| Edit target pages | Yes | Yes | Yes | `ChipInput` for page slugs |
| Change status **[REDESIGN]** | — | — | — | See note below |
| Save notification | Yes | Yes | Yes | Fixed bottom Save/Create button |
| Delete notification | — | Yes | Yes | "Danger Zone" button → `confirm()` dialog |
| Submit for publish **[NEW]** | Yes | Yes | Yes | See [Publish Workflow](#publish-workflow) |
| Approve / publish **[NEW]** | — | Yes* | Yes | See [Publish Workflow](#publish-workflow) |

> \* Editors can approve, but cannot be the sole approver.

**The status dropdown problem:** Today, `CmsAlertEditor` has a `<select>` with draft/published/archived — any user can set "published" and click Save. In the rebuild, this dropdown should be removed. Status transitions should happen through explicit actions:
- **"Save as Draft"** — any seat (Content, Editor, Admin)
- **"Submit for Publish"** — any seat (moves to `in_review`)
- **"Approve & Publish"** — Editor (if they didn't submit) or Admin
- **"Archive"** — Editor or Admin
- **"Reject → Draft"** — Editor or Admin (with required comment)

**Archive vs. delete:** The previous matrix listed "Archive" as a separate permission. In practice, archiving is a status change (reversible), while delete is permanent. Archive should be available to Editors and Admins. Delete already requires a `confirm()` dialog.

---

### Sidebar Organization

These actions map to `CmsLayout.tsx` sidebar — only visible for non-alerts spaces.

| Action | Content | Editor | Admin | Notes |
|--------|:-------:|:------:|:-----:|-------|
| View sidebar (pages tree, sections, components) | Yes | Yes | Yes | |
| Collapse / expand sidebar | Yes | Yes | Yes | Toggle button (w-56 ↔ w-14) |
| Expand / collapse page children | Yes | Yes | Yes | Chevron button on pages with children |
| Expand / collapse sections | Yes | Yes | Yes | Section header toggle |
| Drag page to a different section | — | Yes | Yes | HTML5 drag-and-drop on page rows |
| Drag page to unsectioned area | — | Yes | Yes | Drop on `__unsectioned` zone |
| Create sidebar section | — | Yes | Yes | "+ Section" → name input → "Add" |
| Rename sidebar section | — | Yes | Yes | Manage mode → inline text input on section header |
| Delete sidebar section | — | — | Yes | Manage mode → × on section header — **no confirm dialog** |
| Add page to section (via dropdown) | — | Yes | Yes | Manage mode → "Add page..." `<select>` in expanded section |
| Remove page from section | — | Yes | Yes | Manage mode → × next to page — **no confirm** |
| Enter / exit manage mode | — | Yes | Yes | "Edit" / "Done" toggle |

**What doesn't exist:** There is no "reorder pages within a section" capability. Dragging moves pages between sections (appending to the target), but you can't reorder within a section. The previous matrix listed this as an action — it was wrong.

---

### Spaces & Navigation

| Action | Content | Editor | Admin | Notes |
|--------|:-------:|:------:|:-----:|-------|
| Switch spaces (web, apps, kiosk, alerts) | Yes | Yes | Yes | `SpaceSwitcher` tab buttons |
| Access all spaces | Yes | Yes | Yes | No per-space restrictions currently |
| Sign out | Yes | Yes | Yes | Header button → `signOut(auth)` — no confirm |

---

### System Pages

| Action | Content | Editor | Admin | Notes |
|--------|:-------:|:------:|:-----:|-------|
| View release notes | Yes | Yes | Yes | `CmsReleaseNotes` — static `RELEASES` array, no backend calls |
| View developer docs | Yes | Yes | Yes | `CmsDevDocs` — static content with scroll navigation |
| Navigate doc sections | Yes | Yes | Yes | Sidebar buttons → `scrollIntoView` |
| Edit release notes **[NEW]** | — | — | Yes | Currently hard-coded; would need a Firestore-backed editor |
| Manage user seats / roles **[NEW]** | — | — | Yes | No user management UI exists today |

---

## Publish Workflow

### The Current Reality

**Pages** have no `status` field. A save writes directly to Firestore, and the content is immediately available to consumers reading from `spaces/{space}/pages/{slug}`. There is no draft/publish distinction.

**Notifications** have a `status` field (`draft | published | archived`), but it's a simple `<select>` dropdown — any user can set it to `published` and click Save. The REST API's `POST /:id/publish` endpoint also has no auth check beyond Firebase domain rules.

### The Proposed Change

Add a `status` field to all publishable entities (pages and notifications) and enforce a workflow:

**Rules:**
1. **Admin** can publish anything, alone, at any time.
2. **Editor** can approve a publish request, but only if they are not the person who submitted it.
3. **Content** seats can submit for publish but cannot approve.
4. At least one Editor or Admin must be in the approval chain — two Content approvals don't count.

### State Machine

```
                  ┌─────────┐
           ┌──────│  Draft   │◄──── Rejected (with comment)
           │      └────┬─────┘
           │           │ Submit for Publish (any seat)
           │           │
           │      ┌────▼─────────┐
           │      │  In Review   │
           │      └────┬─────────┘
           │           │
           │     ┌─────┴──────────────────┐
           │     │                        │
           │  Admin approves         Editor approves
           │  (solo publish)         (different person than submitter)
           │     │                        │
           │  ┌──▼──────────┐        ┌────▼─────────┐
           │  │  Published   │        │  Published    │
           │  └──────────────┘        └──────────────┘
           │
           │      ┌──────────────┐
           └──────│  Archived    │◄──── Editor or Admin can archive
                  └──────────────┘      from any state
```

### Required Data Model Changes

**Add to `CmsPage`:**

```typescript
type CmsPage = {
  // ... existing fields ...
  status: 'draft' | 'in_review' | 'published' | 'archived'
  publishRequest?: {
    submittedBy: string
    submittedAt: number
    approvedBy?: string
    approvedAt?: number
    rejectedBy?: string
    rejectedAt?: number
    rejectionReason?: string
  }
}
```

**Modify `CmsNotification`:** Replace the flat `status` field with the same `publishRequest` structure. Remove the status `<select>` from the editor UI.

**Update the REST API:** The `/api/notifications/:id/publish` endpoint currently sets `status: 'published'` unconditionally. It would need to check the caller's role and enforce the workflow rules.

---

## Comparison: Current vs. Proposed

| Aspect | Current System | Proposed |
|--------|---------------|----------|
| Auth model | Email/domain allowlist, binary (in or out) | Role-based seats with granular permissions |
| Page publishing | Save = immediately live | Draft → In Review → Published |
| Notification publishing | Status dropdown (anyone can set "published") | Submit → Review → Publish workflow |
| Roles | None — everyone is an implicit Admin | Content, Editor, Admin |
| Delete protection | Notifications have `confirm()` dialog; variable/field/section deletes have none | Admin-only for pages/components/sidebar sections; confirm dialogs on all destructive actions |
| Page building | Anyone can build pages | Content can create/assemble pages; schema changes (new components/variables) are Editor+ |
| Field content vs. schema | Anyone can edit anything | Content edits values; Editors own names, slugs, types, structure |
| Audit trail | `updatedBy` email on documents | `submittedBy`, `approvedBy`, `rejectedBy` + timestamps |

---

## Missing Confirm Dialogs (Fix in Rebuild)

The current product has inconsistent destructive-action protection. These actions are immediate with no confirmation:

| Action | Location | Risk |
|--------|----------|------|
| Delete variable | `VariableEditSheet` | Removes schema + all field defaults permanently |
| Delete field from variable | `VariableEditSheet` | Removes field + default value permanently |
| Delete sidebar section | `CmsLayout` manage mode | Orphans all pages in that section |
| Remove page from section | `CmsLayout` manage mode | Page becomes unsectioned |
| Switch notification category | `CmsAlertEditor` | Clears media/chips/geo fields (client-side, not saved until Save) |

**Recommendation:** Add confirm dialogs for all destructive actions regardless of seat. This is a UX concern, not a permissions one, but it should be addressed in the rebuild.

---

## Implementation Considerations

### Where Roles Live

On AWS/Cognito, roles map to **Cognito groups** (`cms-content`, `cms-editor`, `cms-admin`).

```typescript
type CmsUserRole = 'content' | 'editor' | 'admin'

type CmsUser = {
  email: string
  role: CmsUserRole
  spaces?: CmsSpace[]     // future: restrict to specific spaces
  createdAt: number
  createdBy: string       // admin who granted access
}
```

### Enforcement Layers

Permissions must be enforced in **two places**:

1. **UI layer** — Hide or disable actions the user's role cannot perform. For example, Content seats see the page editor but without the "+ Add Section" button, section reorder arrows, or section remove buttons. The fixed bottom bar shows "Save Draft" instead of "Save." This is a UX concern, not a security boundary.

2. **API layer** — The Lambda handler checks the Cognito JWT group before performing the action. This is the real security boundary. Even if the client is modified, unauthorized writes are rejected.

### What the UI Looks Like Per Seat

**Content seat on Page Editor:**
- Can create pages, set parent page, add/remove/reorder sections and component items
- Can select from existing variables on section items (but not create new ones)
- SEO/OG panel: fully editable
- Cannot rename page slug
- Bottom bar: "Save Draft" + "Submit for Publish" (when in draft status)

**Content seat on Component Editor / VariableEditSheet:**
- Can open any variable and edit field default values (text, images, videos, URLs, colors)
- Field names, slugs, and types shown as read-only labels (visible for context, not editable)
- No "+ Add Variable", "+ Add Field", Delete, Duplicate, Archive, or reorder controls
- Can save component (persists their content edits)

**Editor seat on Page Editor:**
- Everything Content sees, plus slug rename
- Bottom bar: "Save Draft" + "Submit for Publish" (when in draft), "Approve & Publish" (when in review, if they didn't submit)

**Editor seat on Component Editor / VariableEditSheet:**
- Everything Content sees, plus full schema control: add/delete/reorder variables and fields, edit names/slugs/types, duplicate, archive
- Can create new components

**Admin seat (all views):**
- Everything Editor sees, plus "Delete Page" (new), "Delete Component" (new), delete sidebar sections, solo-publish capability, user management

### Migration Path

1. **Phase 1:** Rebuild with current binary auth model (all users = Admin). Achieve feature parity.
2. **Phase 2:** Add `CmsUser` table, role assignment UI, enforce roles in API layer. Update client to conditionally render controls based on role.
3. **Phase 3:** Add publish workflow (status field on pages, reworked notification status, submit/approve/reject flow).

---

## Open Questions

1. **Per-space roles?** A Content seat scoped to only `kiosk` could be useful for franchise partners. Build the `spaces?: CmsSpace[]` field into the data model now even if the UI doesn't expose it yet.

2. **Should notifications auto-archive after `end_date`?** The `start_date`/`end_date` fields exist on notifications but aren't enforced server-side. A scheduled Lambda or cron could handle this.

3. **Bulk publish?** If an Editor submits 10 pages, does an Admin need to approve each one individually? Consider a batch-approve UI.

4. **Component publishing?** Components don't have a status field and aren't directly consumer-visible — they're referenced by pages. Should component changes also go through a publish workflow, or is the page-level publish sufficient as a gate? Note: Content seats editing field default values and saving a component updates it immediately — there's no draft/publish gate on component content today.

5. **Who owns the REST API contract?** The `/api/notifications` endpoints are consumed by mobile apps and kiosks. Role enforcement at the API layer needs to distinguish between "CMS admin writing via the UI" and "mobile app reading notifications" — the latter should remain unauthenticated (matching current Firestore public-read rules).
