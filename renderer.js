const webview = document.getElementById('browser');
const urlInput = document.getElementById('url-input');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const reloadBtn = document.getElementById('reload-btn');
const goBtn = document.getElementById('go-btn');
const pomBtn = document.getElementById('pom-btn');

// Navigation functions
function navigate(url) {
  if (!url) return;
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Check if it looks like a URL or a search query
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    } else {
      // Use Google search for queries
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
  }
  
  webview.src = url;
  urlInput.value = url;
}

// Button event listeners
backBtn.addEventListener('click', () => {
  if (webview.canGoBack()) {
    webview.goBack();
  }
});

forwardBtn.addEventListener('click', () => {
  if (webview.canGoForward()) {
    webview.goForward();
  }
});

reloadBtn.addEventListener('click', () => {
  webview.reload();
});

goBtn.addEventListener('click', () => {
  navigate(urlInput.value);
});

pomBtn.addEventListener('click', async () => {
  try {
    const result = await webview.executeJavaScript(`
      (function() {
        // Function to get XPath for an element
        function getXPath(element, skipId = false) {
          if (element.id && !skipId) {
            return '//*[@id="' + element.id + '"]';
          }
          if (element === document.body) {
            return '/html/body';
          }
          
          let ix = 0;
          const siblings = element.parentNode ? element.parentNode.childNodes : [];
          
          for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
              const parent = element.parentNode;
              return getXPath(parent, skipId) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
              ix++;
            }
          }
        }
        
        // Function to check if a selector is unique
        function isUnique(selector) {
          try {
            return document.querySelectorAll(selector).length === 1;
          } catch(e) {
            return false;
          }
        }
        
        // Function to get best unique selector
        function getBestSelector(element) {
          // Try ID first
          if (element.id && isUnique('#' + element.id)) {
            return { type: 'Id', value: element.id };
          }
          
          // Try name attribute
          if (element.name && isUnique('[name="' + element.name + '"]')) {
            return { type: 'Name', value: element.name };
          }
          
          // Try class name (if single class)
          if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\\s+/);
            if (classes.length === 1 && isUnique('.' + classes[0])) {
              return { type: 'ClassName', value: classes[0] };
            }
            // Try each class individually
            for (let cls of classes) {
              if (cls && isUnique('.' + cls)) {
                return { type: 'ClassName', value: cls };
              }
            }
          }
          
          // Try tag name with unique attribute combinations
          const tagName = element.tagName.toLowerCase();
          
          // Try type attribute (for inputs)
          if (element.type && isUnique(tagName + '[type="' + element.type + '"]')) {
            return { type: 'CssSelector', value: tagName + '[type="' + element.type + '"]' };
          }
          
          // Try placeholder (for inputs)
          if (element.placeholder && isUnique(tagName + '[placeholder="' + element.placeholder + '"]')) {
            return { type: 'CssSelector', value: tagName + '[placeholder="' + element.placeholder + '"]' };
          }
          
          // Try text content for buttons and links
          if ((tagName === 'button' || tagName === 'a') && element.textContent) {
            const text = element.textContent.trim();
            const xpath = '//' + tagName + '[normalize-space(text())="' + text.replace(/"/g, '\\\\"') + '"]';
            // Can't easily check XPath uniqueness without evaluate, use XPath as fallback
          }
          
          // Fallback to XPath
          return { type: 'XPath', value: getXPath(element) };
        }
        
        // Function to generate a clean variable name
        function generateName(element, type) {
          let name = '';
          
          // Prefer ID
          if (element.id) {
            name = element.id;
          }
          // Then name attribute
          else if (element.name) {
            name = element.name;
          }
          // Then text content (limited)
          else if (element.textContent) {
            name = element.textContent.trim().substring(0, 30).replace(/[^a-zA-Z0-9]/g, '');
          }
          // Then type-based name
          else if (element.placeholder) {
            name = element.placeholder.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '');
          }
          
          // Fallback to type + index
          if (!name) {
            name = type.replace(/[^a-zA-Z0-9]/g, '');
          }
          
          // Convert to lowercase
          return name.toLowerCase() || 'element';
        }
        
        const elements = [];
        
        // Find all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach((btn, i) => {
          const selector = getBestSelector(btn);
          elements.push({
            type: 'Button',
            text: btn.textContent.trim().substring(0, 50) || btn.value || btn.id || 'No text',
            name: generateName(btn, 'Button'),
            selector: selector,
            xpath: getXPath(btn, btn.id ? true : false)
          });
        });
        
        // Find all input fields
        const inputs = document.querySelectorAll('input');
        inputs.forEach((input, i) => {
          const selector = getBestSelector(input);
          elements.push({
            type: 'Input (' + (input.type || 'text') + ')',
            text: input.placeholder || input.value || input.name || input.id || 'No text',
            name: generateName(input, 'Input'),
            selector: selector,
            xpath: getXPath(input, input.id ? true : false)
          });
        });
        
        // Find all textareas
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((ta, i) => {
          const selector = getBestSelector(ta);
          elements.push({
            type: 'Textarea',
            text: ta.placeholder || ta.value || ta.name || ta.id || 'No text',
            name: generateName(ta, 'Textarea'),
            selector: selector,
            xpath: getXPath(ta, ta.id ? true : false)
          });
        });
        
        // Find all links
        const links = document.querySelectorAll('a');
        links.forEach((link, i) => {
          if (link.textContent.trim()) {
            const selector = getBestSelector(link);
            elements.push({
              type: 'Link',
              text: link.textContent.trim().substring(0, 50),
              name: generateName(link, 'Link'),
              selector: selector,
              xpath: getXPath(link, link.id ? true : false)
            });
          }
        });
        
        // Find all headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((h, i) => {
          const selector = getBestSelector(h);
          elements.push({
            type: h.tagName,
            text: h.textContent.trim().substring(0, 50),
            name: generateName(h, h.tagName),
            selector: selector,
            xpath: getXPath(h, h.id ? true : false)
          });
        });
        
        return elements;
      })()
    `);
    
    // Format the message with ATF lines
    let message = 'Elements found on page:\n\n';
    message += 'Total: ' + result.length + ' elements\n\n';
    message += '// ATF Element Definitions\n\n';
    
    const usedNames = new Map();
    
    result.forEach((el, i) => {
      // Ensure unique names
      let name = el.name;
      if (usedNames.has(name)) {
        const count = usedNames.get(name) + 1;
        usedNames.set(name, count);
        name = name + count;
      } else {
        usedNames.set(name, 1);
      }
      
      // Generate ATF line
      let atfLine = '';
      if (el.selector.type === 'Id') {
        atfLine = `Elements.Add("${name}", By.Id("${el.selector.value}"));`;
      } else if (el.selector.type === 'Name') {
        atfLine = `Elements.Add("${name}", By.Name("${el.selector.value}"));`;
      } else if (el.selector.type === 'ClassName') {
        atfLine = `Elements.Add("${name}", By.ClassName("${el.selector.value}"));`;
      } else if (el.selector.type === 'CssSelector') {
        atfLine = `Elements.Add("${name}", By.CssSelector("${el.selector.value}"));`;
      } else if (el.selector.type === 'XPath') {
        atfLine = `Elements.Add("${name}", By.XPath("${el.selector.value}"));`;
      }
      
      message += `// ${i + 1}. [${el.type}] "${el.text}"\n`;
      message += atfLine + '\n';
      
      // If not using XPath, add XPath version as well
      if (el.selector.type !== 'XPath' && el.xpath) {
        const xpathName = name + ' XPATH';
        message += `Elements.Add("${xpathName}", By.XPath("${el.xpath}"));\n`;
      }
      
      message += '\n';
    });
    
    // Show custom modal instead of alert
    showModal(message);
  } catch (error) {
    alert('Error finding elements: ' + error.message);
  }
});

// Enter key in URL input
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    navigate(urlInput.value);
  }
});

// Update URL bar when page changes
webview.addEventListener('did-navigate', (e) => {
  urlInput.value = e.url;
});

webview.addEventListener('did-navigate-in-page', (e) => {
  urlInput.value = e.url;
});

// Update button states
webview.addEventListener('did-navigate', updateNavigationState);
webview.addEventListener('did-navigate-in-page', updateNavigationState);

function updateNavigationState() {
  backBtn.disabled = !webview.canGoBack();
  forwardBtn.disabled = !webview.canGoForward();
}

// Handle new window requests
webview.addEventListener('new-window', (e) => {
  webview.src = e.url;
});

// Loading indicator
webview.addEventListener('did-start-loading', () => {
  reloadBtn.textContent = '⊗';
});

webview.addEventListener('did-stop-loading', () => {
  reloadBtn.textContent = '↻';
});

// Page title
webview.addEventListener('page-title-updated', (e) => {
  document.title = e.title + ' - Electron Browser';
});

// Modal functions
const modal = document.getElementById('elements-modal');
const closeModalBtn = document.getElementById('close-modal');
const copyButton = document.getElementById('copy-button');
const elementsOutput = document.getElementById('elements-output');

function showModal(content) {
  elementsOutput.textContent = content;
  modal.classList.add('show');
  // Reset copy button text
  copyButton.textContent = 'Copy';
  copyButton.classList.remove('copied');
}

function closeModal() {
  modal.classList.remove('show');
}

closeModalBtn.addEventListener('click', closeModal);

copyButton.addEventListener('click', () => {
  const textToCopy = elementsOutput.textContent;
  navigator.clipboard.writeText(textToCopy).then(() => {
    copyButton.textContent = 'Copied!';
    copyButton.classList.add('copied');
    setTimeout(() => {
      copyButton.textContent = 'Copy';
      copyButton.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    copyButton.textContent = 'Failed';
    setTimeout(() => {
      copyButton.textContent = 'Copy';
    }, 2000);
  });
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('show')) {
    closeModal();
  }
});
