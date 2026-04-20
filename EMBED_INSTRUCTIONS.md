# Embedding OptinaForm in Framer

This guide explains how to embed the OptinaForm in your Framer website with the modal opening in the parent window instead of inside the iframe.

## Step 1: Embed the Form in Framer

1. In Framer, add an **Embed** component (or **iframe** code embed)
2. Set the iframe URL to your deployed Next.js form (e.g., Vercel URL)
3. Set the iframe dimensions (e.g., width: 100%, height: 600px)

Example iframe code:
```html
<iframe
  src="https://your-form-url.vercel.app"
  width="100%"
  height="600px"
  frameborder="0"
  id="optina-form-iframe"
></iframe>
```

## Step 2: Add Modal Handler to Parent Page

Add this code to your Framer page using a **Code Override** or **Custom Code** component:

```html
<script>
  // Listen for messages from the iframe
  window.addEventListener('message', function(event) {
    // Check if message is from OptinaForm
    if (event.data.type === 'OPTINA_MODAL_OPEN') {
      // Show modal overlay in parent window
      showOptinaModal(event.data.formType);
    } else if (event.data.type === 'OPTINA_MODAL_CLOSE') {
      // Hide modal overlay in parent window
      hideOptinaModal();
    }
  });

  function showOptinaModal(formType) {
    // Create modal overlay in parent window
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

    // Create iframe for the form modal
    const modalIframe = document.createElement('iframe');
    modalIframe.id = 'optina-modal-iframe';
    modalIframe.src = 'https://your-form-url.vercel.app?modal=true&type=' + formType;
    modalIframe.style.cssText = `
      width: 100%;
      max-width: 480px;
      height: 90vh;
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
        hideOptinaModal();
      }
    });
  }

  function hideOptinaModal() {
    const overlay = document.getElementById('optina-modal-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }
</script>
```

## Step 3: Alternative Simple Solution

If you don't want to use postMessage, you can configure the iframe to allow the modal to overlay:

```css
/* Add to your Framer page CSS */
#optina-form-iframe {
  position: relative;
  z-index: 1;
}

/* Or embed the entire form in a full-page modal from the start */
```

## Step 4: Deploy Your Form

1. Deploy your Next.js form to Vercel or another hosting service
2. Copy the deployment URL
3. Use that URL in your Framer iframe embed

## Notes

- The form automatically detects when it's embedded in an iframe
- It sends `postMessage` events to the parent window when modal opens/closes
- The modal will have a very high z-index (999999) to appear above other content
- Make sure your Framer page has the message listener code active

## Troubleshooting

**Modal not appearing in parent:**
- Check browser console for errors
- Verify the postMessage listener is active
- Ensure the iframe URL is correct

**Modal appears inside iframe:**
- Make sure the parent page has the message listener code
- Check that the iframe and parent are communicating (check console logs)

**Cross-origin issues:**
- Deploy both the form and Framer site to the same domain if possible
- Or ensure CORS is properly configured
