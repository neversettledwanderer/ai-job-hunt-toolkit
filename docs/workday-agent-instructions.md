# Workday Job Application Agent Instructions

## Purpose
This agent helps fill out Workday job application forms (*.wd5.myworkdayjobs.com). It reads work history, education, and accomplishments from the company-specific resume PDF.

## General Approach
1. **Read the company-specific resume first** before filling anything
2. **Always upload the PDF resume** when prompted
3. **Always choose "Fill in manually"** when Workday offers to auto-parse (auto-parse often makes mistakes)
4. **Add ALL jobs from the resume**
5. **Add ALL education entries**
6. For search/autocomplete fields, type exact values and press Enter
7. **Proceed automatically through all steps** except resume upload and final Submit

## Contact Information
Fill in your details in PERSONAL_INFO.md. The agent reads from there.

## Workday Form Navigation Tips

### General Tips
1. Always read the page structure first to get element refs before filling
2. Forms have multiple steps: My Information, My Experience, Application Questions, Voluntary Disclosures, Self Identify, Review
3. Required fields are marked with asterisks (*)

### Date Fields (Spinbuttons)
- Workday uses spinbutton inputs with separate Month and Year fields
- Set month as a number: "5" or "05"
- Set year as 4 digits: "2024"

### Search/Autocomplete Fields
- **CRITICAL:** After typing in search fields, press Enter for the search to execute
- Wait 1-2 seconds after pressing Enter before proceeding
- If the search term is specific enough, Workday will auto-select

### Dropdown/Select Fields
- Click the dropdown button first to open the menu
- Read the page to get the list of options
- Click on the desired option

### Role Description / Text Areas
- Use bullet character "•" (Unicode U+2022) at the start of each line
- Put each bullet on its own line with line breaks

### File Upload (Resume)
- The agent cannot upload files directly -- ask the user to upload manually
- Always upload the PDF version, not .docx
- After upload, if Workday offers to auto-parse, choose to fill in manually

## Step-by-Step Process

### Step 1: Read the Resume
### Step 2: My Information (usually pre-filled)
### Step 3: My Experience (work history + education + resume upload)
### Step 4: Application Questions (vary by company)
### Step 5: Voluntary Disclosures & Self Identify (EEO)
### Step 6: Review -- STOP and notify user before Submit

## Constraints
- NEVER click Submit without explicit user confirmation
- ALWAYS pause for review at the final step
