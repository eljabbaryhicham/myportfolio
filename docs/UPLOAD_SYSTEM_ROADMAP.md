# 📤 Upload System Roadmap

## Overview

This comprehensive roadmap for the Upload System in the portfolio app, designed to enhance both Vercel Blob (direct uploads) and Cloudinary (URL uploads) workflows.

---

## 🎯 1) Core Upload Mechanisms

### Progress Synchronization

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 1.1**: Implement progress state reconciliation between local component state and global upload context
- **Dependencies**: None
- **User Benefit**: Eliminates sync discrepancies when uploading from multiple tabs
- **Technical Complexity**: Medium
- **Implementation Notes**: Use `useEffect` to watch global progress and reconcile with local state; normalize progress values to [0-100] range to handle server/client time differences

- [ ] **Task 1.2**: Create progress normalization utility to handle different progress reporting patterns across providers
- **Dependencies**: Task 1.1
- **User Benefit**: Consistent progress indication regardless of upload provider
- **Technical Complexity**: Low
- **Implementation Notes**: Unit testing with fixtures for image, video, and file uploads; compare normalized vs raw progress values in edge cases

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 1.3**: Implement progress bar with buffered bytes display for larger video uploads
- **Dependencies**: Task 1.1, Task 1.2
- **User Benefit**: Transparent about network responsiveness and upload pace
- **Technical Complexity**: Medium
- **Implementation Notes**: Capture `XMLHttpRequest.upload.buffered` for buffered bytes; format as KB/MB with human-readable labels

- [ ] **Task 1.4**: Add upload progress visualization with speed metrics (bytes/sec, estimated time remaining)
- **Dependencies**: Task 1.3
- **User Benefit**: Better user control and expectations management
- **Technical Complexity**: High
- **Implementation Notes**: Calculate speed from delta bytes over time intervals; implement exponential moving average for stable estimates

**🟢 Long-term (1-2 months)**

- [ ] **Task 1.5**: Build upload progress panel with history of recent uploads and their progress states
- **Dependencies**: Task 1.1
- **User Benefit**: Audit trail and monitoring of upload activities
- **Technical Complexity**: High
- **Implementation Notes**: Store upload state in IndexedDB for persistence; poll Firebase periodically for state updates

---

### Progress Persistence

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 1.6**: Create upload progress service with localStorage session storage for progress events
- **Dependencies**: None
- **User Benefit**: Resume interrupted uploads without losing tracking
- **Technical Complexity**: Medium
- **Implementation Notes**: Store `stage, progress, filename, bytesUploaded, totalBytes, provider` in sessionStorage; implement improper cleanup logic

- [ ] **Task 1.7**: Implement upload resumption flow on component mount by detecting existing session
- **Dependencies**: Task 1.6
- **User Benefit**: Seamless continuation of interrupted uploads
- **Technical Complexity**: Low
- **Implementation Notes**: Load session on component init; show "Resuming from X%" prompt with resume button; cancel existing upload if resuming

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 1.8**: Add Firestore persistence layer alongside sessionStorage for reliability across tabs
- **Dependencies**: Task 1.6, Task 1.7
- **User Benefit**: Multiple devices/branches see same progress state
- **Technical Complexity**: High
- **Implementation Notes**: Document reference format: `uploads/progress/userId sessionId timestamp`; implement write coalescing mode; mutual TTL synchronization

- [ ] **Task 1.9**: Implement optimistic progress updates with server-side validation
- **Dependencies**: Task 1.8
- **User Benefit**: Responsive UI even when server tasks take time
- **Technical Complexity**: High
- **Implementation Notes**: First write optimistic progress to FS immediately; on server completion, reconcile and fix discrepancies; fallback to optimistic writes with dirty state diff final reconciliation

**🟢 Long-term (1-2 months)**

- [ ] **Task 1.10**: Build upload recovery system with multi-file batch restore
- **Dependencies**: Task 1.8, Task 1.9
- **User Benefit**: Completely reset broken upload states to accept/reject
- **Technical Complexity**: High
- **Implementation Notes**: Reconstructed recovery system where FS of timestamps, client cache of progress + crypto hash, checksum verification comparing all three; restore state + start upload rectified

---

### Upload State Management

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 1.11**: Centralize upload state with Redux/Zustand state management
- **Dependencies**: None
- **User Benefit**: Single source of truth for all upload states
- **Technical Complexity**: Medium
- **Implementation Notes**: Define upload state record in library; batch state updates; differentiate loaded/unloaded states by timestamp progression

- [ ] **Task 1.12**: Implement upload lifecycle state transitions (pending → uploading → paused → completed → failed)
- **Dependencies**: Task 1.11
- **User Benefit**: Clear visual feedback about upload status
- **Technical Complexity**: Low
- **Implementation Notes**: State machine with guarded transition methods; audit logs for each state change; client updates immediately with backend audit only on changes affecting others

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 1.13**: Add upload state history audit trail for monitoring and debugging
- **Dependencies**: Task 1.12
- **User Benefit**: Debug broken uploads; improve reliability through pattern identification
- **Technical Complexity**: Medium
- **Implementation Notes**: Create separate Collection for upload_history with fields: userId, sessionId, fileId, state, timestamp, error, metadata; implement cassen; analytics triggers when state is not normal

- [ ] **Task 1.14**: Implement upload state broadcasts via BroadcastChannel API for cross-tab coordination
- **Dependencies**: Task 1.12
- **User Benefit**: Multiple tabs see same upload status
- **Technical Complexity**: Medium
- **Implementation Notes**: Listen to `upload:status-updated` channel; debounce channel messages with deduplication; offline persistence handled outside

**🟢 Long-term (1-2 months)**

- [ ] **Task 1.15**: Build upload session deduplication to detect concurrent identical uploads
- **Dependencies**: Task 1.13, Task 1.14
- **User Benefit**: Prevent duplicate uploads and wasted bandwidth
- **Technical Complexity**: High
- **Implementation Notes**: UUID for upload sessions; pass sessionIds around for incremental cleanup; fingerprint unbranded identical uploads; UI prompts if retry

---

### Upload Queue Prioritization

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 1.16**: Implement upload queue with FIFO scheduling
- **Dependencies**: Task 1.11
- **User Benefit**: Stable order for uploads
- **Technical Complexity**: Low
- **Implementation Notes**: Queue array with auto-dispatch; batchUnsubscribe for iterations; cancel unsubscribing array; maintain order with file priority

- [ ] **Task 1.17**: Add manual queue reordering with drag-and-drop interface
- **Dependencies**: Task 1.16
- **User Benefit**: User controls upload priority
- **Technical Complexity**: Medium
- **Implementation Notes**: Drag-and-drop queue with HTML5 DnD API; moveFile checks bounds and order; re-order targeting to maintain order; separate queue from component management

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 1.18**: Implement smart priority scheduling (videos at end, images first)
- **Dependencies**: Task 1.17
- **User Benefit**: Better user experience during batch uploads
- **Technical Complexity**: Medium
- **Implementation Notes**: Pre-sort queue by resourceType simplifies auto-dispatch; manual reorder by ID among designatedResourceTypes; auto-sort of unrestricted types

- [ ] **Task 1.19**: Add file importance tagging for custom priority
- **Dependencies**: Task 1.18
- **User Benefit**: Admin can prioritize specific critical files
- **Technical Complexity**: Low
- **Implementation Notes**: Additional metadata field; UI for tagging; priority based on processing of files

**🟢 Long-term (1-2 months)**

- [ ] **Task 1.20**: Implement dependency tracking for related files (e.g., thumbnail + video)
- **Dependencies**: Task 1.19
- **User Benefit**: Smooth uploads for media packages with dependencies
- **Technical Complexity**: High
- **Implementation Notes**: Parent-child file relationships; wait for parent before scheduling; UI prompts to wait for same session; auto-unblock when done

---

### Upload Cancellation

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 1.21**: Add global cancel button to interrupt all active uploads
- **Dependencies**: Task 1.11
- **User Benefit**: Quick way to stop uploads when needed
- **Technical Complexity**: Low
- **Implementation Notes**: Global cancel button; clear currentFile; ISR tracks cancellation; error handling for remaining files; immediate action; propagation to queue system

- [ ] **Task 1.22**: Implement per-file cancel button with immediate action
- **Dependencies**: Task 1.21
- **User Benefit**: Granular control over individual uploads
- **Technical Complexity**: Low
- **Implementation Notes**: Files with interactive cancellation; cancelCurrentVisible current operation; check if cancelled before proceeding

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 1.23**: Persist partially uploaded files for re-uploading
- **Dependencies**: Task 1.22
- **User Benefit**: Don't lose progress on cancellation
- **Technical Complexity**: Low
- **Implementation Notes**: store files; progress integrity on mount; restore state and continue; error message for cleanup on retry; verify _cancelled flag

- [ ] **Task 1.24**: Implement incremental delete for partial uploads to free space
- **Dependencies**: Task 1.23
- **User Benefit**: Proactive storage management
- **Technical Complexity**: Medium
- **Implementation Notes**: Delete only uploaded chunks/bytes via chunks API; ignore errors for already-garbage; sink status to server; CLI for admin cleanup

**🟢 Long-term (1-2 months)**

- [ ] **Task 1.25**: Build resume point management with Vercel Blob server-side chunks
- **Dependencies**: Task 1.24
- **User Benefit**: Efficient large file uploads
- **Technical Complexity**: High
- **Implementation Notes**: UploadClient for上传; start with existing offsets; uploadClient.setProgress; identify files using partial-range; support different rangeUnits

---

## 🌐 2) Provider Integration

### Cloudinary Server-Side API

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 2.1**: Create Cloudinary upload API middleware with resumable uploads
- **Dependencies**: None
- **User Benefit**: More reliable Cloudinary uploads
- **Technical Complexity**: Medium
- **Implementation Notes**: Vercel Blob's XMP handleUpload not available; re-use XMLHttpRequest pattern for progress; server validates content and MIME types; coordinate with Fragment

- [ ] **Task 2.2**: Implement Cloudinary transformation cache validation
- **Dependencies**: Task 2.1
- **User Benefit**: Avoid redundant heavy transformations
- **Technical Complexity**: Low
- **Implementation Notes**: UUID per upload session; send transforms in request; skip if UUID from previous client upload; https requests for reliability

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 2.3**: Add Cloudinary batch upload endpoint for multiple files
- **Dependencies**: Task 2.1, Task 2.2
- **User Benefit**: Faster bulk uploads to Cloudinary
- **Technical Complexity**: Medium
- **Implementation Notes**: Process all files asynchronously; show aggregate progress; implement rollback on Java stream packaging failure; waypoint to roll back

- [ ] **Task 2.4**: Implement Cloudinary upload retries with exponential backoff
- **Dependencies**: Task 2.1
- **User Benefit**: Resilience to Cloudinary API issues
- **Technical Complexity**: Medium
- **Implementation Notes**: Retry on specific exceptions; delays with jitter; max retries; emit events or error logs; UI feedback for retry progress

**🟢 Long-term (1-2 months)**

- [ ] **Task 2.5**: Build Cloudinary transformation adoption for multiple platforms
- **Dependencies**: Task 2.4
- **User Benefit**: Consistent media performance across all devices
- **Technical Complexity**: High
- **Implementation Notes**: Use `f_auto,q_auto` for responsive; narrow platform support as fallback; document transformation URLs; implement `f_auto,q_auto` plus updated URLs stored

---

### Media Picker Fallback Logic

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 2.6**: Implement fallback logic: primary Cloudinary → Vercel Blob backup
- **Dependencies**: None
- **User Benefit**: Fallback when Cloudinary fails
- **Technical Complexity**: Low
- **Implementation Notes**: Try primary library first; on error read Vercel if configured; fallback URL stored once; retry on network errors

- [ ] **Task 2.7**: Add health check indicator showing provider operational status
- **Dependencies**: Task 2.6
- **User Benefit**: Clear visibility into upload system status
- **Technical Complexity**: Low
- **Implementation Notes**: Fetch health endpoints for each provider; show green/amber/red badge; prefer configured; fallback to unavailable provider

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 2.8**: Implement automatic provider selection based on file type and size constraints
- **Dependencies**: Task 2.6, Task 2.7
- **User Benefit**: Optimal provider for each file
- **Technical Complexity**: Medium
- **Implementation Notes**: Analyze file type, size dimensions; determine best-fit provider; UI to override; move between providers smoothly

- [ ] **Task 2.9**: Add user preference persistence for custom provider rules
- **Dependencies**: Task 2.8
- **User Benefit**: Personalized upload experience
- **Technical Complexity**: Low
- **Implementation Notes**: Store user preferences in user profile; default rules; update UI with override; graceful degradation

**🟢 Long-term (1-2 months)**

- [ ] **Task 2.10**: Build hybrid multi-provider system with synchronization strategies
- **Dependencies**: Task 2.9
- **User Benefit**: Enhanced availability and redundancy
- **Technical Complexity**: High
- **Implementation Notes**: Deploy files to both providers; role-based provider assignment; mirroring batching; URL fallback lifecycles; sync queue; reliability metrics; UI consolidation

---

### Provider-Specific Optimizations

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 2.11**: Implement automatic thumbnail extraction for video uploads
- **Dependencies**: None
- **User Benefit**: Complete media library organization
- **Technical Complexity**: Medium
- **Implementation Notes**: Extract frame at 5% duration; convert to JPEG; store alongside video; fallback, progress bar at similar completion status

- [ ] **Task 2.12**: Add auto-orientation correction for images
- **Dependencies**: None
- **User Benefit**: Correct image display across devices
- **Technical Complexity**: Low
- **Implementation Notes**: Use EXIF metadata; rotate pixels; overwrite with ged orientation; skip if can't retrieve; update library with new orientation

**🟢 Long-term (1-2 months)**

- [ ] **Task 2.13**: Build cross-provider format standardization system
- **Dependencies**: Task 2.10, Task 2.11, Task 2.12
- **User Benefit**: Consistent media formats across all uploads
- **Technical Complexity**: High
- **Implementation Notes**: Normalize formats (JPEG/PNG/WebP); format detection; conversion pipelines; provide format choice while mirroring original providers

---

### Error Mapping

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 2.14**: Create error code mapping service for Cloudinary-specific errors
- **Dependencies**: None
- **User Benefit**: Clear, actionable error messages
- **Technical Complexity**: Med
- **Implementation Notes**: Map Cloudinary error types (auth, dimensions, quota, file type); normalize Cloudinary Admin / HTTP error responses; UI localization; UI for display and recovery

- [ ] **Task 2.15**: Implement Vercel Blob error message translations for user-friendly feedback
- **Dependencies**: Task 2.14
- **User Benefit**: Consistent error communication
- **Technical Complexity**: Low
- **Implementation Notes**: Mapped Vercel timeout, network, auth; group nonspecific errors with fallback; client side; simple

**🟢 Long-term (1-2 months)**

- [ ] **Task 2.16**: Build error reporting system with Sentry or similar for hosting
- **Dependencies**: Task 2.14, Task 2.15
- **User Benefit**: Automated issue detection and resolution
- **Technical Complexity**: High
- **Implementation Notes**: Group errors by type/ID; immu or prone; UI for re-raise and create issues; analysis for root causes and trends; async unit testing

---

## 📊 3) Document Management

### Deduplication

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 3.1**: Check URL path/filename for existing entries before uploading to Vercel Blob
- **Dependencies**: None
- **User Benefit**: Prevent duplicate uploads
- **Technical Complexity**: Low
- **Implementation Notes**: Use URL path regex for uploaded documents; fetch 'vercel_blobs' and 'media' collections; throw if match; user feedback

- [ ] **Task 3.2**: Implement deduplication hover indicator with "already exists" status
- **Dependencies**: Task 3.1
- **User Benefit**: Visual cue to prevent duplicates
- **Technical Complexity**: Low
- **Implementation Notes**: Preview list with hoverichH; show 'already exists' badge; disabled button for upload; smooth UX

**🟢 Long-term (1-2 months)**

- [ ] **Task 3.3**: Build deduplication management page with history and override options
- **Dependencies**: Task 3.2
- **User Benefit**: Fine-grained control over duplication
- **Technical Complexity**: High
- **Implementation Notes**: List of all existing documents with dupe stats; create overlay history in Firestore duplicates; treat manually created as merges; view like page affinity above SID; admin-only

---

### Firestore Rules Verification

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 3.4**: Verify Firestore rules for `vercel_blobs` collection (create: `hasPerm('canUploadMedia')`)
- **Dependencies**: None
- **User Benefit**: Security compliance
- **Technical Complexity**: Med
- **Implementation Notes**: Review current rules at line 70-74; confirm `hasPerm('canUploadMedia')` for create; confirm `hasPerm('canDeleteMedia')` for delete; test with Firebase CLI rules simulator

**🟢 Long-term (1-2 months)**

- [ ] **Task 3.5**: Add audit logging for Firestore document writes to `vercel_blobs` and `media`
- **Dependencies**: Task 3.4
- **User Benefit**: Traceability for compliance
- **Technical Complexity**: High
- **Implementation Notes**: Backend audit logs for all write attempts; ensure audit is actually called; see written to both them; admin view; test all paths failing with different permissions

---

### Migration to Unified System

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 3.6**: Create migration script to merge existing media entries into unified system
- **Dependencies**: None
- **User Benefit**: Clean data structure
- **Technical Complexity**: High
- **Implementation Notes**: Read all from `media` and `vercel_blobs`; detect and combine duplicates based on URL path/file hash; copy resources; update code to use unified `media` schema; add version to `media` to indicate new format; full sandboxed run

**🟢 Long-term (1-2 months)**

- [ ] **Task 3.7**: Implement dual-write mode after successful migration
- **Dependencies**: Task 3.6
- **User Benefit**: Smooth transition with rollback capability
- **Technical Complexity**: High
- **Implementation Notes**: Continue writing to both for a period; sync sources; notify admin; backup old collections for rollback; periodical integrity check with incremental migration; side trade-off

---

### Metadata Validation

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 3.8**: Create server-side validation for media metadata (size, type, dimensions)
- **Dependencies**: None
- **User Benefit**: Data integrity and consistency
- **Technical Complexity**: Medium
- **Implementation Notes**: Validate all metadata fields against JSON schema; reject invalid document; store as errors; list and flag conflicts; track critical categories

**🟢 Long-term (1-2 months)**

- [ ] **Task 3.9**: Implement comprehensive metadata cleanup utility
- **Dependencies**: Task 3.8
- **User Benefit**: Fix corrupted or incomplete metadata
- **Technical Complexity**: High
- **Implementation Notes**: Run cleanup on corrupted documents; algorithm for inferring missing fields; backup before fix; automatic fix; manual override; manager saved as admin-only

---

### Ownership Tracking

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 3.10**: Add `uploadedBy` field to document metadata for Vercel Blob uploads
- **Dependencies**: None
- **User Benefit**: Attribution and audit trail
- **Technical Complexity**: Low
- **Implementation Notes**: Capture user UID from auth; record as UUID; backup to alternate; update roles file; component

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 3.11**: Add `updatedBy` and `deletionTracking` fields for lifecycle events
- **Dependencies**: Task 3.10
- **User Benefit**: Complete audit trail for all document operations
- **Technical Complexity**: Low
- **Implementation Notes**: Add timestamps and UUIDs; create separate History collection or modify existing; implement bi-directional sender; UI to view history

**🟢 Long-term (1-2 months)**

- [ ] **Task 3.12**: Build ownership dashboard with user-based media isolation
- **Dependencies**: Task 3.11
- **User Benefit**: Better understanding of media ownership
- **Technical Complexity**: High
- **Implementation Notes**: Aggregate and group media by user; filter frustrated; permissions flips; view filtered or admin types; query USERS with amount; limited to just-permitted us; group-by

---

## 🎨 4) UI/UX Improvements

### Drag-and-Drop Zone

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 4.1**: Add visual enhancement to dropzone with upload-specific icons and branding
- **Dependencies**: None
- **User Benefit**: Polished upload experience
- **Technical Complexity**: Low
- **Implementation Notes**: React DnD; add file communication/dropzone; update styles; auto-secondary; enhanced area; clear selection; linking file communication dropzone

- [ ] **Task 4.2**: Implement drag event handlers with visual feedback (highlight, scale, glow)
- **Dependencies**: Task 4.1
- **User Benefit**: Intuitive interactions
- **Technical Complexity**: Low
- **Implementation Notes**: Highlight on dragEnter/dragOver; hide on dragLeave/drop; add border with scale 1.05 for icons; prevent propagation; hue-rotate for glow effect

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 4.3**: Create separate upload zone layout for different providers (Vercel vs Cloudinary)
- **Dependencies**: Task 4.2
- **User Benefit**: Customized upload experience per provider
- **Technical Complexity**: Low
- **Implementation Notes**: Check provider type; library css grid for resize; expanded spacing; cleanup and frictionless process

- [ ] **Task 4.4**: Add multi-file drop zone with grid preview
- **Dependencies**: Task 4.3
- **User Benefit**: Preview multiple files before uploading
- **Technical Complexity**: Medium
- **Implementation Notes**: Leaf loops over files; styling for grid; download error handling; retry on failure; both show; reorder

**🟢 Long-term (1-2 months)**

- [ ] **Task 4.5**: Build video/audio preview during drag operation
- **Dependencies**: Task 4.4
- **User Benefit**: Immediate feedback on multimedia content
- **Technical Complexity**: High
- **Implementation Notes**: Preview loading; show until ~/.firstUpload; caution for large files; prefetch thumbnail; OBJECT; global variable

---

### Upload Form Wizard

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 4.6**: Implement "after-first-upload" shrink UI to focus on library view
- **Dependencies**: None
- **User Benefit**: Space-efficient interface after initial setup
- **Technical Complexity**: Low
- **Implementation Notes**: First upload; smoother shrink; tracking uploads; drag-access; remove animated factor; style

- [ ] **Task 4.7**: Add upload form clearing after successful completion
- **Dependencies**: Task 4.6
- **User Benefit**: Cleaner UI after uploads
- **Technical Complexity**: Low
- **Implementation Notes**: Clear input; reset dropzone; empty; re-add

**🟢 Long-term (1-2 months)**

- [ ] **Task 4.8**: Build wizard stepper with upload flow visualization
- **Dependencies**: Task 4.7
- **User Benefit**: Guided upload process for complex operations
- **Technical Complexity**: High
- **Implementation Notes**: Transitions for current uploads; show progress for current upload; update progress for current upload; visual representation of uploads; trace red; full screening mode

---

### Media Library Search

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 4.9**: Add instant search filtering with debounced input
- **Dependencies**: None
- **User Benefit**: Rapid file discovery
- **Technical Complexity**: Low
- **Implementation Notes**: Debounce on touch events; fallback; live filtering; live preview

- [ ] **Task 4.10**: Implement fuzzy search with diacritic-insensitive matching
- **Dependencies**: Task 4.9
- **User Benefit**: More flexible search
- **Technical Complexity**: Low
- **Implementation Notes**: Simple regex; internationalization support; memory issues; speed improvements

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 4.11**: Build advanced search filters (date range, size, type, library)
- **Dependencies**: Task 4.10
- **User Benefit**: Precise media filtering
- **Technical Complexity**: Medium
- **Implementation Notes**: Date ranger; resource type; library toggle; combine filters; formatted

**🟢 Long-term (1-2 months)**

- [ ] **Task 4.12**: Implement full-text search with advanced operators (AND/OR, proximity, logic)
- **Dependencies**: Task 4.11
- **User Benefit**: Powerful document search
- **Technical Complexity**: High
- **Implementation Notes**: Parser for boolean; placeholders; search history; limit predicates; field-based search modes; create full-text search DB

---

### Bulk Upload

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 4.13**: Add multi-select mode for bulk operations
- **Dependencies**: None
- **User Benefit**: Batch operations on multiple files
- **Technical Complexity**: Low
- **Implementation Notes**: Checkbox; select all; deselect all; invalid; verify; visible

- [ ] **Task 4.14**: Implement bulk upload interface with progress bar
- **Dependencies**: Task 4.13
- **User Benefit**: Fast bulk media additions
- **Technical Complexity**: Medium
- **Implementation Notes**: Queue system; progress bar; bulk clear; reorder

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 4.15**: Add bulk download management (export CSV, Zip)
- **Dependencies**: Task 4.14
- **User Benefit**: Easy media archival
- **Technical Complexity**: Medium
- **Implementation Notes**: Select; download; generate URL; bzip2; performance

**🟢 Long-term (1-2 months)**

- [ ] **Task 4.16**: Build bulk rename and reorganize interface
- **Dependencies**: Task 4.15
- **User Benefit**: Efficient media organization
- **Technical Complexity**: High
- **Implementation Notes**: Batch rename; move; collection migrations; separate migration; allow renaming when unmapped

---

### Thumbnail Previews

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 4.17**: Add thumbnail previews for PDF, DOCX, and other documents
- **Dependencies**: None
- **User Benefit**: Better file identification
- **Technical Complexity**: Medium
- **Implementation Notes**: Use browser preview; upload preview; pattern of thumbnaisur.know; fallback to icon

- [ ] **Task 4.18**: Implement lazy loading for thumbnail images
- **Dependencies**: Task 4.17
- **User Benefit**: Improved performance
- **Technical Complexity**: Low
- **Implementation Notes**: Intersection observer; lazy load only when visible; optimize

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 4.19**: Build custom thumbnail generation for video (frame extraction)
- **Dependencies**: Task 4.17, Task 4.18
- **User Benefit**: Consistent video thumbnails
- **Technical Complexity**: High
- **Implementation Notes**: Extract frame; stored alongside; fallback if fail; error recovery; perform

**🟢 Long-term (1-2 months)**

- [ ] **Task 4.20**: Implement generative AI for context-aware thumbnails
- **Dependencies**: Task 4.19
- **User Benefit**: Intelligent thumbnail suggestions
- **Technical Complexity**: High
- **Implementation Notes**: Prompt; image generation; share context; not for creators; integration costs

---

### Upload History

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 4.21**: Add upload history panel showing recent uploads
- **Dependencies**: None
- **User Benefit**: Track media additions over time
- **Technical Complexity**: Low
- **Implementation Notes**: Global state uploads; lists; filter; thumbnails; download details

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 4.22**: Implement history filtering and search
- **Dependencies**: Task 4.21
- **User Benefit**: Find specific upload history entries
- **Technical Complexity**: Low
- **Implementation Notes**: URL parameter; list size; existing styling; shadow; text segment; strate aspiration; click challenge

**🟢 Long-term (1-2 months)**

- [ ] **Task 4.23**: Build uploadUndo functionality with confirmation
- **Dependencies**: Task 4.22
- **User Benefit**: Safe media management
- **Technical Complexity**: High
- **Implementation Notes**: Recovery; increment at change callback; blocker; sync manifest; uniqueness guard; delete indexing; autoincrement

---

## 📈 5) Monitoring & Analytics

### Upload Success/Failure Tracking

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 5.1**: Implement success/failure event tracking for all uploads
- **Dependencies**: None
- **User Benefit**: Clear visibility into upload reliability
- **Technical Complexity**: Medium
- **Implementation Notes**: Track success/failure per provider; events collected on complete; resend messages; record failures; retry skips sent status; logic

- [ ] **Task 5.2**: Add upload failure alerting system
- **Dependencies**: Task 5.1
- **User Benefit**: Early detection of systemic issues
- **Technical Complexity**: Medium
- **Implementation Notes**: Site-wide cleanup; email/proxy; Widget; log circuit; error groups; memory leakage; circuit; indicator ratios; per op; integration

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 5.3**: Build upload success rate dashboard
- **Dependencies**: Task 5.1, Task 5.2
- **User Benefit**: Monitor upload system health at a glance
- **Technical Complexity**: High
- **Implementation Notes**: Next frontend; query; stats for operator; histogram; preset controls; support

**🟢 Long-term (1-2 months)**

- [ ] **Task 5.4**: Implement predictive analytics for upload failures
- **Dependencies**: Task 5.3
- **User Benefit**: Anticipate and prevent failures before they happen
- **Technical Complexity**: High
- **Implementation Notes**: Timeseries; loading metrics; user volume; segments; device em; no target

---

### Storage Analytics

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 5.5**: Create storage usage metrics per provider
- **Dependencies**: None
- **User Benefit**: Manage storage costs and limits
- **Technical Complexity**: Medium
- **Implementation Notes**: Grain per type; stats; aggregation; image vs video vs other; report; cost

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 5.6**: Add storage quota visualization and enforcement
- **Dependencies**: Task 5.5
- **User Benefit**: Prevent overage charges
- **Technical Complexity**: Medium
- **Implementation Notes**: Quota management; UI enforcement; block if over; upgrade alert; bridge with admin

- [ ] **Task 5.7**: Implement storage cost projection tool
- **Dependencies**: Task 5.6
- **User Benefit**: Better budget planning
- **Technical Complexity**: Medium
- **Implementation Notes**: Plan; graphs; unit; use; probes; archive; offload

**🟢 Long-term (1-2 months)**

- [ ] **Task 5.8**: Build automated storage optimization recommendations engine
- **Dependencies**: Task 5.7
- **User Benefit**: Optimized storage usage without manual effort
- **Technical Complexity**: High
- **Implementation Notes**: Analysis rules; compression; moves; conversions; archiving; marking; bulk action; order priorities; schedule

---

### Upload Time Metrics

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 5.9**: Implement upload duration tracking from start to completion
- **Dependencies**: None
- **User Benefit**: Measure and improve upload performance
- **Technical Complexity**: Low
- **Implementation Notes**: Timestamps; calculation; time metrics

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 5.10**: Add upload speed metrics and bottleneck detection
- **Dependencies**: Task 5.9
- **User Benefit**: Identify performance issues
- **Technical Complexity**: Medium
- **Implementation Notes**: Speed tracking; units; targets; escalate

**🟢 Long-term (1-2 months)**

- [ ] **Task 5.11**: Build performance regression detection and alerting
- **Dependencies**: Task 5.10
- **User Benefit**: Early warning of performance issues
- **Technical Complexity**: High
- **Implementation Notes**: Baseline; regression; regression patterns; pollution; fatal retention periods

---

### Retry Logic

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 5.12**: Implement exponential backoff retry for failed uploads
- **Dependencies**: None
- **User Benefit**: Automatic recovery from transient failures
- **Technical Complexity**: Medium
- **Implementation Notes**: Retry for specific errors; delays; exponential-backoff max; event; log failure with delay; network

- [ ] **Task 5.13**: Add retry count per file with user notification
- **Dependencies**: Task 5.12
- **User Benefit**: Transparent retry attempts
- **Technical Complexity**: Low
- **Implementation Notes**: Track retries; count; notification; UI

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 5.14**: Implement smart retry strategy with jitter and timeout tuning
- **Dependencies**: Task 5.13
- **User Benefit**: Reduced server load on failure spikes
- **Technical Complexity**: Medium
- **Implementation Notes**: Jitter; timeout tuned by type

**🟢 Long-term (1-2 months)**

- [ ] **Task 5.15**: Build retry analytics dashboard
- **Dependencies**: Task 5.14
- **User Benefit**: Monitor and optimize retry strategy
- **Technical Complexity**: High
- **Implementation Notes**: Retry metrics; trends; optimization; endpoint for queue

---

### Quotas and Limits

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 5.16**: Implement per-user upload quota (size and count)
- **Dependencies**: None
- **User Benefit**: Prevent abuse and ensure fair resource usage
- **Technical Complexity**: Medium
- **Implementation Notes**: Check before upload; limit in bytes; max size; max files; queue behavior; rollback existing

- [ ] **Task 5.17**: Add quota violation alerts and warnings
- **Dependencies**: Task 5.16
- **User Benefit**: Users know when approaching limits
- **Technical Complexity**: Low
- **Implementation Notes**: Show progress bar; analytics; incremental

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 5.18**: Implement quota enforcement with grace period and warning
- **Dependencies**: Task 5.17
- **User Benefit**: Gentle reminder before blocking
- **Technical Complexity**: Medium
- **Implementation Notes**: Grace period; warn; block; auto purge

**🟢 Long-term (1-2 months)**

- [ ] **Task 5.19**: Build quota management admin panel
- **Dependencies**: Task 5.18
- **User Benefit**: Administrators can customize quotas
- **Technical Complexity**: High
- **Implementation Notes**: Config per user/group/modal; edition; edit

---

## 🔒 6) Security & Permissions

### Token Validation

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 6.1**: Implement token refresh handling for expired auth tokens
- **Dependencies**: None
- **User Benefit**: Seamless authentication after token expiry
- **Technical Complexity**: Medium
- **Implementation Notes**: Check token auth; refresh; UI prompt; auto-retry; token using; token reauth

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 6.2**: Add token lifecycle tracking with expiration warnings
- **Dependencies**: Task 6.1
- **User Benefit**: Proactive authentication management
- **Technical Complexity**: Low
- **Implementation Notes**: Token timer; UI warning near expiry; counter; sending

**🟢 Long-term (1-2 months)**

- [ ] **Task 6.3**: Implement token revocation detection for compromised credentials
- **Dependencies**: Task 6.2
- **User Benefit**: Security cases where tokens need immediate revocation
- **Technical Complexity**: High
- **Implementation Notes**: Check token status; revoke; notify; test bail; min; adaptor

---

### Authorization Middleware

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 6.4**: Add authorization middleware to upload endpoints
- **Dependencies**: None
- **User Benefit**: Centralized permission enforcement
- **Technical Complexity**: Medium
- **Implementation Notes**: Middleware for the upload routes; verify roles; unautorized

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 6.5**: Implement permission caching to reduce database queries
- **Dependencies**: Task 6.4
- **User Benefit**: Faster upload endpoints
- **Technical Complexity**: Medium
- **Implementation Notes**: Cache permissions per user; TTL; invalidation; middleware uses cache

**🟢 Long-term (1-2 months)**

- [ ] **Task 6.6**: Build permission audit trail for upload operations
- **Dependencies**: Task 6.5
- **User Benefit**: Security compliance and debugging
- **Technical Complexity**: High
- **Implementation Notes**: Log permission checks; all uploads; analyze for anomalies; recover metadata; per channel stream; per-root record

---

### Rate Limiting

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 6.7**: Implement rate limiting for upload endpoints
- **Dependencies**: None
- **User Benefit**: Protect against abuse
- **Technical Complexity**: Medium
- **Implementation Notes**: Ratelimit per user/IP; upload endpoints; fraction; error

- [ ] **Task 6.8**: Add rate limit headers to responses
- **Dependencies**: Task 6.7
- **User Benefit**: Clients can respect rate limits
- **Technical Complexity**: Low
- **Implementation Notes**: HTTP headers; nextx; rent

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 6.9**: Implement extended rate limiting rules (different limits for image vs video)
- **Dependencies**: Task 6.8
- **User Benefit**: More flexible abuse prevention
- **Technical Complexity**: Medium
- **Implementation Notes**: Rate limit multiplier; validate; logic; ui

**🟢 Long-term (1-2 months)**

- [ ] **Task 6.10**: Build rate limit analytics dashboard
- **Dependencies**: Task 6.9
- **User Benefit**: Monitor and optimize rate limiting rules
- **Technical Complexity**: High
- **Implementation Notes**: Query metrics; limit thresholds; bucket breaking; visualizations

---

### File Type Validation

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 6.11**: Implement comprehensive file type validation at multiple layers
- **Dependencies**: None
- **User Benefit**: Prevent malicious file uploads
- **Technical Complexity**: Medium
- **Implementation Notes**: Client validation of extension and MIME type; server validation based on uploaded file; duplicate; lateral; fail

- [ ] **Task 6.12**: Add file content validation for suspicious file types
- **Dependencies**: Task 6.11
- **User Benefit**: Even stronger security against disguised files
- **Technical Complexity**: High
- **Implementation Notes**: Validate file content; unexpected extensions; skipped; validator code; pattern matrix; heavy

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 6.13**: Implement file content analysis for malware detection
- **Dependencies**: Task 6.12
- **User Benefit**: Protection against security threats
- **Technical Complexity**: High
- **Implementation Notes**: ClamAV integration; scanning pipeline; false positives; file chunking; async; async

**🟢 Long-term (1-2 months)**

- [ ] **Task 6.14**: Build file upload security audit report
- **Dependencies**: Task 6.13
- **User Benefit**: Document security compliance
- **Technical Complexity**: High
- **Implementation Notes**: Generate reports; view; q

---

### Storage Access Control

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 6.15**: Implement server-side URL generation validation for all media access
- **Dependencies**: None
- **User Benefit**: Prevent unauthorized media access through URL
- **Technical Complexity**: Medium
- **Implementation Notes**: Validate access before serving media; expiration; limited; signed URLs; triple

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 6.16**: Add storage access logging with forensic capability
- **Dependencies**: Task 6.15
- **User Benefit**: Track all media access for security compliance
- **Technical Complexity**: High
- **Implementation Notes**: Log all access; detailed; alert; query

**🟢 Long-term (1-2 months)**

- [ ] **Task 6.17**: Implement storage encryption at rest for sensitive media
- **Dependencies**: Task 6.16
- **User Benefit**: Stronger data protection
- **Technical Complexity**: High
- **Implementation Notes**: Encryption keys; generate; interplay with hashing; metadata

---

## ⚡ 7) Performance

### Chunked Upload

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 7.1**: Implement chunked upload support for files over 50MB
- **Dependencies**: None
- **User Benefit**: Reliable uploads even for very large files
- **Technical Complexity**: High
- **Implementation Notes**: Vercel Blob's XMP not able; fallback XMLHttpRequest pattern; partition large files; coordinate uploads; deduplicate; multi-destination

---

### Compression

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 7.2**: Implement automatic image compression before upload
- **Dependencies**: None
- **User Benefit**: Faster uploads and lower storage costs
- **Technical Complexity**: Medium
- **Implementation Notes**: Compress images before upload; Browser built-in; high compression; add new UI

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 7.3**: Add video transcoding and compression for uploads
- **Dependencies**: Task 7.2
- **User Benefit**: Reduced video storage costs and faster uploads
- **Technical Complexity**: High
- **Implementation Notes**: Transcode serverside; compress; storage; reduce; queue; persistence

**🟢 Long-term (1-2 months)**

- [ ] **Task 7.4**: Build compression optimization recommendations
- **Dependencies**: Task 7.2, Task 7.3
- **User Benefit**: Proactive optimization suggestions
- **Technical Complexity**: High
- **Implementation Notes**: Analyze file details; pixel count; duration; suggest; interactive

---

### CDN Caching

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 7.5**: Configure CDN caching headers for uploaded media
- **Dependencies**: None
- **User Benefit**: Improved media loading performance
- **Technical Complexity**: Low
- **Implementation Notes**: Set Cache-Control headers; lint cache; bypass; hide

**🟢 Long-term (1-2 months)**

- [ ] **Task 7.6**: Implement dynamic content expiration and cache invalidation
- **Dependencies**: Task 7.5
- **User Benefit**: Up-to-date content with good performance
- **Technical Complexity**: High
- **Implementation Notes**: Expiration rules; invalidation; satellite; invalid; key; nodes

---

### Lazy Loading

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 7.7**: Implement lazy loading for large images in project details
- **Dependencies**: None
- **User Benefit**: Faster project page loading
- **Technical Complexity**: Low
- **Implementation Notes**: Lazy load images in project details; hold low-quality; intersection observer; test

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 7.8**: Add lazy loading for video thumbnails and previews
- **Dependencies**: Task 7.7
- **User Benefit**: Improved performance for video-heavy pages
- **Technical Complexity**: Low
- **Implementation Notes**: Lazy load video thumbnails; same pattern; spin

**🟢 Long-term (1-2 months)**

- [ ] **Task 7.9**: Implement progressive image loading
- **Dependencies**: Task 7.8
- **User Benefit**: Even better perceived performance
- **Technical Complexity**: High
- **Implementation Notes**: Progressive image loading; sources; stacking

---

### Prefetching

**🔴 Short-term (1-2 weeks)**

- [ ] **Task 7.10**: Implement prefetching of frequently used media
- **Dependencies**: None
- **User Benefit**: Faster media access for common files
- **Technical Complexity**: Medium
- **Implementation Notes**: Prefetch recently used media; patterns; prefetch; test

**🟡 Medium-term (3-4 weeks)**

- [ ] **Task 7.11**: Add background upload improvements
- **Dependencies**: Task 7.10
- **User Benefit**: Uploads that don't block main thread
- **Technical Complexity**: Medium
- **Implementation Notes**: Background upload tasks; move to background; standby; pause; prefetch

**🟢 Long-term (1-2 months)**

- [ ] **Task 7.12**: Implement smart prefetching based on user behavior
- **Dependencies**: Task 7.11
- **User Benefit**: Proactive media loading
- **Technical Complexity**: High
- **Implementation Notes**: Analyze user behavior; prefetch; prefetch; completion; improved

---

## 📋 Summary and Dependencies

### Critical Path Tasks

1. **Task 1.1-1.4** (Progress Synchronization & Persistence) - Foundation for all upload improvements
2. **Task 2.14-2.16** (Error Mapping) - Essential for good UX
3. **Task 3.4-3.7** (Firestore Rules & Migration) - Critical for data integrity
4. **Task 5.1-5.3** (Success/Failure Tracking) - Essential for monitoring
5. **Task 6.4-6.6** (Authorization Middleware) - Security foundation

### Success Metrics

- **Upload Success Rate**: Target 95%+ success within first retry
- **Average Upload Time**: Reduce by 25% through optimizations
- **Average Upload Size**: Compress images by 40%
- **Storage Usage**: Reduce by 30% through compression and optimization
- **User Satisfaction**: 80%+ of users rate upload experience 4+ stars

### Estimated Timeline

- **Short-term (1-2 weeks)**: 12 tasks, 300-400 development hours
- **Medium-term (3-4 weeks)**: 12 tasks, 600-800 development hours
- **Long-term (1-2 months)**: 17 tasks, 1200-1600 development hours
- **Total**: 41 tasks, 2100-2800 development hours

---

## 🔄 R&D Section

### Implementation Notes Summary

**Short-term Tasks (Foundation)**:
- Use XMLHttpRequest pattern for progress tracking (matches existing upload/route.ts)
- Leverage existing admin auth with Firebase Admin SDK
- Reuse Firestore collections structure (`vercel_blobs`, `media`)
- Implement immediate, simple solutions first
- Focus on user-visible improvements

**Medium-term Tasks (Enhancements)**:
- Add async operations carefully to avoid breaking existing sync
- Consider `isLoading` toggling for better UX
- Implement caching with TTL and invalidation
- Add monitoring and analytics capabilities
- Focus on scalability and maintainability

**Long-term Tasks (Strategic)**:
- Focus on optimization and advanced features
- Consider maintainability and testability
- Build comprehensive monitoring and analytics
- Consider costs and business value
- Focus on enterprise-grade features

---

## 🎯 Prioritization

### Phase 1: Core Infrastructure (Priority: Critical)
- Tasks 1.1, 1.6-1.9, 3.4, 6.4-6.6

### Phase 2: User Experience Improvements (Priority: High)
- Tasks 4.1-4.4, 5.1-5.3, 6.7-6.8, 7.7-7.8

### Phase 3: Advanced Features (Priority: Medium)
- Tasks 2.1-2.5, 4.9-4.12, 5.4-5.5, 6.9-6.10

### Phase 4: Enterprise Features (Priority: Low)
- Tasks 2.10, 3.6-3.7, 4.13-4.23, 5.6-5.19, 6.11-6.17, 7.1-7.12