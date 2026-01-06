# Electron Browser with POM Generator

A full-featured browser built with Electron and Chromium, featuring an integrated Page Object Model (POM) generator for automated testing.

## Features

### Browser Features
- **Full Chrome/Chromium rendering engine** - Complete web browsing capabilities
- **Navigation controls** - Back, forward, and reload buttons
- **Smart URL bar** - Enter URLs or search queries (automatically uses Google search)
- **Integrated webview** - Opens external links in the same window
- **Page title tracking** - Window title updates with current page

### POM Generator (POM Button)
The POM button scans the current webpage and generates ATF-style element definitions for automated testing frameworks.

#### What It Does:
- **Scans all interactive elements** including:
  - Buttons
  - Input fields (all types)
  - Textareas
  - Links
  - Headings (H1-H6)

- **Intelligent selector generation** - Chooses the best unique locator strategy in priority order:
  1. `By.Id()` - If element has a unique ID
  2. `By.Name()` - If element has a unique name attribute
  3. `By.ClassName()` - If element has a unique class
  4. `By.CssSelector()` - For unique attribute combinations
  5. `By.XPath()` - Fallback for elements without unique identifiers

- **Dual locator support** - For elements using Id, Name, ClassName, or CssSelector, also generates an XPath alternative:
  ```
  Elements.Add("login", By.Id("login-button"));
  Elements.Add("login XPATH", By.XPath("/html/body/div[1]/form/button[1]"));
  ```

- **Dynamic ID protection** - XPath alternatives never use element IDs, ensuring they work even if IDs are dynamically generated

- **Smart naming** - Generates clean, lowercase element names based on:
  - Element ID
  - Name attribute
  - Text content
  - Placeholder text
  - Element type (fallback)

#### Output Modal Features:
- **Scrollable display** - Horizontal and vertical scrolling for long XPath values
- **Copy to clipboard** - One-click copy button to export all element definitions
- **Visual feedback** - Copy button shows "Copied!" confirmation
- **Keyboard shortcuts** - Press Escape to close modal
- **Click outside to close** - Click anywhere outside the modal to dismiss

#### Example Output:
```csharp
// ATF Element Definitions

// 1. [Input (text)] "Search"
Elements.Add("search", By.Name("q"));
Elements.Add("search XPATH", By.XPath("/html/body/form/div[1]/input[1]"));

// 2. [Button] "Google Search"
Elements.Add("googlesearch", By.Name("btnK"));
Elements.Add("googlesearch XPATH", By.XPath("/html/body/form/div[2]/button[1]"));

// 3. [Link] "Sign in"
Elements.Add("signin", By.XPath("/html/body/header/div/a[1]"));
```

## Installation

```bash
npm install
```

## Running the App

```bash
npm start
```

To run in development mode with DevTools:

```bash
npm run dev
```

## Usage

### Browsing
1. Enter a URL in the address bar or type a search query
2. Use navigation buttons to go back/forward
3. Click reload to refresh the current page
4. The app starts with Google as the home page

### Generating POM Definitions
1. Navigate to the webpage you want to analyze
2. Click the **POM** button (pink button next to "Go")
3. View the generated element definitions in the modal
4. Click **Copy** to copy all definitions to your clipboard
5. Paste into your test automation framework

## Use Cases

- **Test automation setup** - Quickly generate page object model definitions
- **Element discovery** - Identify all interactive elements on a page
- **Selector validation** - Verify unique selectors for test reliability
- **Documentation** - Export element definitions for team reference
- **Migration** - Generate definitions when updating test frameworks

## Technical Details

- **Framework**: Electron 28.x
- **Renderer**: Chromium (via webview)
- **Node Integration**: Enabled for DOM access
- **Selector Strategy**: CSS selectors + XPath fallback
- **Uniqueness Validation**: Real-time verification using querySelectorAll

## Notes

- XPath alternatives are generated without using element IDs to avoid issues with dynamic IDs
- Element names are automatically deduplicated with numeric suffixes
- All element names are lowercase for as required by ATF
- The modal supports both horizontal and vertical scrolling for long content
