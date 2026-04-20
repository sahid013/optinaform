# Embedding OptinaForm in Framer - UPDATED

This form is designed to work in an iframe and will communicate with the parent window to show the modal outside the iframe boundaries.

## How It Works

When embedded in an iframe:
1. The form detects it's in an iframe automatically
2. When you click a CTA button, it sends a message to the parent window
3. The parent window receives the message and creates a modal overlay
4. The modal appears in the parent page viewport, not inside the iframe

## Step 1: Embed the Form in Framer

Add an **iframe** or **Embed** component in Framer with this code:

```html
<iframe
  src="https://optinaform.vercel.app"
  id="optina-form-iframe"
  style="width: 100%; height: 600px; border: none;"
  frameborder="0"
></iframe>
```

## Step 2: Add Modal Handler JavaScript to Your Framer Page

In Framer, add a **Custom Code** component or use **Page Settings > Start of <body> tag** to add this script:

```html
<script>
(function() {
  // Listen for messages from the OptinaForm iframe
  window.addEventListener('message', function(event) {

    if (event.data.type === 'OPTINA_OPEN_MODAL') {
      openOptinaModal(event.data.formType);
    }
    else if (event.data.type === 'OPTINA_CLOSE_MODAL') {
      closeOptinaModal();
    }
  });

  function openOptinaModal(formType) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'optina-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      background: rgba(17, 17, 17, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    // Create iframe for modal content
    const modalIframe = document.createElement('iframe');
    modalIframe.id = 'optina-modal-iframe';
    modalIframe.src = 'https://optinaform.vercel.app?modal=' + formType;
    modalIframe.style.cssText = `
      width: 100%;
      max-width: 500px;
      height: 80vh;
      max-height: 700px;
      border: none;
      border-radius: 4px;
      background: white;
    `;

    overlay.appendChild(modalIframe);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeOptinaModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', handleEscapeKey);
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeOptinaModal();
    }
  }

  function closeOptinaModal() {
    const overlay = document.getElementById('optina-modal-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscapeKey);

      // Notify iframe that modal is closed
      const mainIframe = document.getElementById('optina-form-iframe');
      if (mainIframe && mainIframe.contentWindow) {
        mainIframe.contentWindow.postMessage({
          type: 'OPTINA_CLOSE_MODAL'
        }, '*');
      }
    }
  }
})();
</script>
```

## Step 3: Test It Out

The form is already deployed at: **https://optinaform.vercel.app**

Simply copy the code from Steps 1 and 2 above - the URLs are already configured!

## Step 4: Test

1. Load your Framer page
2. Click on "Comparer mes offres" or "Optimiser ma facture"
3. The modal should appear in the parent page viewport, covering the entire screen

## Customization Options

### Change Modal Size
In the `openOptinaModal` function, modify:
```javascript
modalIframe.style.cssText = `
  width: 100%;
  max-width: 600px;  // Change this
  height: 90vh;      // Change this
  ...
`;
```

### Change Overlay Background
Modify the overlay background color:
```javascript
overlay.style.cssText = `
  ...
  background: rgba(0, 0, 0, 0.8);  // Darker
  backdrop-filter: blur(8px);       // More blur
  ...
`;
```

### Add Animation
Add a fade-in animation:
```javascript
overlay.style.opacity = '0';
overlay.style.transition = 'opacity 0.3s';
document.body.appendChild(overlay);
setTimeout(() => { overlay.style.opacity = '1'; }, 10);
```

## Troubleshooting

**Modal not appearing:**
- Check browser console for errors
- Verify the script is loaded (check Network tab)
- Make sure the iframe URL is correct

**Modal appears inside iframe:**
- Verify the postMessage listener script is active
- Check that both URLs use HTTPS (not mixing HTTP/HTTPS)
- Clear browser cache

**Console shows "Cross-origin" errors:**
- This is normal and expected
- The form will still work correctly

## Notes

- The form automatically detects when it's embedded in an iframe
- No modal is rendered inside the iframe when embedded
- All modal rendering happens in the parent window
- The modal will have z-index: 999999 to appear above all content
- Communication uses postMessage API which is secure and cross-origin compatible

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Make sure your Framer page has the JavaScript code active in Page Settings > Start of <body> tag
3. Verify the iframe is loading correctly (you should see the form)
4. Test in different browsers (Chrome, Safari, Firefox)

**Form URL:** https://optinaform.vercel.app
