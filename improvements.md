# Elhadar Engineering HRMS: Architectural Review & Improvements Plan

This document synthesizes user feedback, HR partner reviews, technical feasibility audits, and actionable implementation plans for the next evolution of the Elhadar Engineering HRMS platform.

---

## 1. Executive Summary of Audit Findings

### Employee Phone Numbers Audit
We conducted an automated database and Excel source audit on employee telephone records:
* **Total Workforce in Database**: 302 employees
* **Employees with Verified Phone Numbers**: **300 employees (99.34%)**
* **Employees Missing Phone Numbers**: **Exactly 2 employees (0.66%)**
  1. `A-043` — Adisu Aregay (Permanent)
  2. `B-001` — Beamlak Hailu (Permanent)
* **Phone Number Uniqueness**: **100% Unique** (0 duplicate phone numbers detected across the entire database).
* **Phone Formatting in Master List**:
  * Standard with dashes: `09-36-75-99-82`
  * Missing leading zero: `9-10-99-13-96`
  * Raw numbers without dashes: `0911707937`

#### Recommended Phone Login Architecture:
* Implement **Smart Multi-Identifier Login**:
  * Login field label: **"Phone Number, Email, or File No"**.
  * Input sanitization: The backend strips hyphens, spaces, and country code prefix (`+251` or `251`), normalizing to standard 9-digit / 10-digit format (`09XXXXXXXX`).
  * If the user enters a phone number (e.g. `0936759982` or `09-36-75-99-82`), the authentication service queries `Employee::where('phone', $normalizedPhone)->first()->user`.
  * If the user enters an email (`admin@elhadar.com`), it authenticates directly via `users.email`.
  * If the user enters their physical filing code (`A-001`), it looks up `Employee::where('file_no', $fileNo)->first()->user`.
  * This guarantees that **100% of employees can log in immediately**, including the 2 staff members currently awaiting phone registration.

---

## 2. Implementation Blueprints for the 6 Core Reviews

### Review 1: Inline Excel Sync & Export on Staff Directory (Eliminate Dedicated Import Page)
* **Problem**: Having a dedicated sidebar item and standalone page `/import` feels redundant and clutters the menu for an operation that belongs directly in the Staff Directory.
* **Solution**:
  1. **Top Action Ribbon on Staff Directory (`/employees`)**:
     * **"Export" Button with Dropdown**:
       * *Export Current Filtered View (CSV)*: Exports whatever search/department/workplace/status filters are currently active in the view.
       * *Export All Active Personnel (CSV)*: Full master list export.
       * *Download Import Template (CSV)*: Standardized blank spreadsheet for new bulk hires.
     * **"Excel Sync & Import" Button**:
       * Opens a sleek in-page modal dialog.
       * Provides drag-and-drop file upload for `.xlsx` or `.csv`.
       * Shows file preview with row count and validation checks.
       * One-click "Sync with Server Master List" to trigger background sync against the authoritative file on the server.
  2. **Navigation Cleanup**:
     * Remove "Excel Sync & Export" from the main sidebar.
     * Redirect any historical requests to `/import` to `/employees?openImport=true`.

---

### Review 2: Consolidate Probation & Contracts into Staff Directory Filters
* **Problem**: "Probation Reviews" and "Project Contracts" are essentially filtered subsets of employee records. Dedicated sidebar pages fragment the user experience.
* **Solution**:
  1. **Quick-Filter Status Tabs above Staff Directory**:
     * **All Staff** (`302`)
     * **Permanent** (`244`)
     * **Probation Pipeline** (`54`)
     * **Project Contracts** (`1`)
     * **Separated Archive** (`3`)
  2. **Context-Aware Row Actions**:
     * When viewing **Probation Pipeline**: The table automatically displays the **Statutory 60-Working-Day Countdown** (per Labour Proclamation No. 1156/2019) and a 1-click **"Confirm Permanency"** action button.
     * When viewing **Project Contracts**: The table displays **Contract Expiration Date** and a 1-click **"Renew Contract"** button.
  3. **Sidebar Streamlining**:
     * Remove "Probation Reviews" and "Project Contracts" from the sidebar navigation.
     * Keep existing backend action endpoints (`POST /probation/{employee}/confirm`, `POST /contracts/{employee}/renew`).

---

### Review 3: Full-Width Employee Self-Service (Remove Admin Sidebar) & Expanded Discrepancy Fields
* **Problem**:
  1. Regular staff members logging in to view their self-service profile are greeted with a bulky desktop admin sidebar featuring links they cannot access.
  2. The data correction request dropdown only offers 8 basic fields.
* **Solution**:
  1. **Distraction-Free Self-Service Layout**:
     * Switch `resources/js/Pages/Portal/Profile.tsx` from `AuthenticatedLayout` to `PortalLayout` (or conditionally render `AuthenticatedLayout` without sidebar when `auth.user.role === 'Employee'`).
     * Staff members receive a clean top navigation bar, full-width profile cards, and maximum screen space.
  2. **Comprehensive 30+ Field Discrepancy Correction Dropdown**:
     * **Personal & Identity**: Full Name, Gender, Birth Date (E.C. / G.C.), Marital Status, Primary Telephone, Official Email.
     * **Residential Address**: Region, City, Sub-City (K/Ketema), Woreda, House Number.
     * **Emergency Contacts**: Emergency Contact Name, Emergency Phone, Relationship.
     * **Pension, Tax & Banking**: POESSA Pension Number, PSSSA Pension Number, Social Security Number, Tax ID (TIN), Commercial Bank Name, Bank Account Number.
     * **Education & Credentials**: Education Level / Degree, Graduating University / Institution, Graduation Year (E.C.), Professional License / Certificate, Cost Sharing Obligation.
     * **Operational & Job Assignment**: Position / Title, Workplace Location (Project Site / Head Office), Assigned Shift, Machinery / Vehicle Plate Number, Company Experience, Previous Experience.

---

### Review 4: Elimination of ISO Timestamp Clutter (`2024-06-01T00:00:00.000000Z`)
* **Problem**: Raw Carbon datetime strings serialize with UTC zero-timestamps (`T00:00:00.000000Z`) across table columns and profile cards.
* **Solution**:
  1. **Backend Model Casts**:
     * Update `app/Models/Employee.php`, `Separation.php`, `EmployeeSalary.php`:
       ```php
       protected function casts(): array {
           return [
               'employment_date' => 'date:Y-m-d',
               'birth_date' => 'date:Y-m-d',
               'probation_end_date' => 'date:Y-m-d',
               'permanent_status_date' => 'date:Y-m-d',
               'contract_end_date' => 'date:Y-m-d',
               'retirement_date' => 'date:Y-m-d',
               'effective_date' => 'date:Y-m-d',
           ];
       }
       ```
     * When cast as `'date:Y-m-d'`, Laravel serializes dates strictly as `2024-06-01`.
  2. **Frontend Date Formatter**:
     * Standardize with utility `formatDate(val)` that strips any time portion and handles null gracefully.

---

### Review 5: Natural Everyday HR Terminology (Replace "Dossier")
* **Problem**: "Dossier" sounds foreign and awkward to everyday users and HR clerks.
* **Solution**:
  * Replace "360° Digital Dossier" with **"Employee Profile"** or **"Personnel Details"**.
  * Replace table action button text `"Dossier"` with **`"View Profile"`** or **`"Profile"`**.
  * Replace `"Complete Onboarding & Create Dossier"` with **`"Complete Onboarding & Save Employee"`**.
  * Replace `"Return to 360° Dossier"` with **`"Back to Profile"`**.
  * Update interactive tour steps to reflect everyday workplace terminology.

---

### Review 6: Employee Profile Picture System
* **Problem**: The interface currently renders a generic green box with the employee's initial. HR requested real profile pictures for all staff.
* **Solution**:
  1. **Database**:
     * Migration: Add `profile_photo_path` (string, nullable) to `employees` table.
     * Model: Add accessor `profile_photo_url` returning `asset('storage/' . $this->profile_photo_path)`.
  2. **Storage & Upload**:
     * Store avatars under `storage/app/public/photos/employees/`.
     * Add endpoint: `POST /employees/{employee}/photo` with image validation (JPG/PNG/WEBP, max 2MB).
     * Add photo removal endpoint: `DELETE /employees/{employee}/photo`.
  3. **Frontend Component (`EmployeeAvatar.tsx`)**:
     * If photo exists: Render `<img src={profile_photo_url} alt={name} className="object-cover rounded-full ..." />`.
     * If photo is absent: Render an elegant initials avatar or stylized DiceBear/UI-Avatars placeholder.
     * On Employee Profile page (`Show.tsx`): Include a camera button allowing HR to upload, crop, or replace the photo directly.
     * In Staff Directory (`Index.tsx`): Display circular avatar thumbnails next to every employee's name.

---

## 3. Additional Recommended High-Value Improvements

Beyond the user's specific feedback, here are strategic improvements that will elevate Elhadar Engineering HRMS to enterprise-grade construction HR standards:

### 1. Dual-Language Search (Amharic & English Name Matching)
* **Rationale**: Ethiopian tripartite names often have multiple English transliterations (e.g. `Sewmehon` vs `Sewmehone`, `Bizuayehu` vs `Bizuayhu`).
* **Recommendation**: Add an optional `full_name_amharic` field and index both names so staff can be searched in Fidel (ግዕዝ) or Latin characters.

### 2. Bulk Actions in Staff Directory
* **Rationale**: Managing 302 employees across 8 remote project sites requires mass operations.
* **Recommendation**:
  * Checkbox multi-select in Staff Directory.
  * Bulk actions:
    * Mass transfer between project sites (e.g. move 10 technicians from `GERD II` to `Bishoftu Airport Project`).
    * Bulk allowance adjustment (e.g. apply temporary desert allowance increase for site personnel).
    * Bulk contract renewal or probation confirmation.

### 3. Automated SMS / Telegram Notifications
* **Rationale**: Field workers at remote hydro and airport construction sites rarely check work emails, but almost all (99.3%) have mobile phones.
* **Recommendation**:
  * Integrate an Ethiopian SMS gateway (e.g. Ethio Telecom SMS API or local gateway) to send automated alerts:
    * Monthly salary slip summary.
    * Probation passage confirmation.
    * Leave request status and annual balance notices.
    * Data correction approval confirmation.

### 4. Offline Site Perdiem & Attendance Logging
* **Rationale**: Remote sites like `Gilgel Gibe II` or `GERD II` occasionally experience internet outages.
* **Recommendation**:
  * Implement LocalStorage / PWA offline capability for site managers to record daily perdiem and attendance, automatically synchronizing once connectivity is restored.

---

## 4. Implementation Phasing Matrix

| Phase | Tasks Included | Estimated Complexity | Core Impact |
| :--- | :--- | :--- | :--- |
| **Phase 1: Quick Wins & Polish** | • Date format cleanup (`date:Y-m-d` cast & utility)<br>• Replace "Dossier" with "View Profile"<br>• Expand Self-Service Data Correction dropdown (30+ fields)<br>• Remove sidebar from Employee portal view | Low | Immediate polish and usability improvement |
| **Phase 2: Directory Consolidation** | • Add Export dropdown & Import modal to Staff Directory<br>• Add Probation & Contracts quick-filter tabs with inline actions<br>• Remove redundant `/import`, `/probation`, `/contracts` sidebar links | Medium | Major decluttering of UI navigation and operational workflow |
| **Phase 3: Photo Avatar System** | • Database migration `profile_photo_path`<br>• Backend photo upload controller & storage symlink<br>• `EmployeeAvatar` component on Directory, Profile, Edit, and ESS | Medium | Visual transformation of employee profiles |
| **Phase 4: Phone-First Login** | • Backend phone number normalization service<br>• Multi-identifier authentication (Phone / Email / File No)<br>• Update login UI input & validation | Medium | High convenience for field staff |
