# InfinityElement Development Guide

Welcome to your InfinityElement project! This guide will help you understand the development lifecycle and how to build elements that integrate with the Infinity Extensibility Framework.

## 📋 Table of Contents

- [What is an InfinityElement?](#what-is-an-infinityelement)
- [Using the Element API](#using-the-element-api)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Documentation](#documentation)

## What is an InfinityElement?

An **InfinityElement** is a secure, sandboxed web component that integrates with the Infinity Agent Desktop. It allows you to:

- Display custom UI within the agent interface
- Interact with agent data and interactions
- Respond to real-time events (calls, messages, status changes)
- Communicate with other elements via inter-element messaging

**Key Characteristics:**

- Built with React and compiled to a web component using `@r2wc/react-to-web-component`
- Sandboxed environment - cannot directly access DOM or window objects
- Communicates with the host application via `ElementAPI`
- Type-safe with full TypeScript support

## Using the Element API

The Element API is your bridge to the Infinity Agent Desktop. It provides secure, controlled access to agent data and operations.

### Installation

```bash
npm install @avaya/infinity-elements-api
```

### Basic Setup

```typescript
import { ElementAPI } from "@avaya/infinity-elements-api";
import { useEffect, useState } from "react";

function MyElement() {
  const [api] = useState(
    () =>
      new ElementAPI({
        elementId: "my-element",
        timeout: 5000,
        debug: true,
      })
  );

  useEffect(() => {
    // Initialize API
    const init = async () => {
      try {
        const userInfo = await api.getUserInfo();
        console.log("Agent:", userInfo.firstName, userInfo.lastName);
        console.log("Email:", userInfo.email);
      } catch (error) {
        console.error("Failed to get user info:", error);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      api.destroy();
    };
  }, [api]);

  return <div>My Element</div>;
}
```

### Common Patterns

#### Listening to Events

```typescript
useEffect(() => {
  const unsubscribeAccepted = api.onInteractionAccepted((interactionId) => {
    console.log("Interaction accepted:", interactionId);
    // Load customer data, show UI, etc.
  });

  const unsubscribeEnded = api.onInteractionEnded((interactionId) => {
    console.log("Interaction ended:", interactionId);
    // Clean up, save data, etc.
  });

  return () => {
    unsubscribeAccepted();
    unsubscribeEnded();
  };
}, [api]);
```

#### Getting Current Interaction

```typescript
const [interaction, setInteraction] = useState(null);

useEffect(() => {
  const loadInteraction = async () => {
    try {
      const current = await api.getInteraction();
      setInteraction(current);
    } catch (error) {
      // No active interaction
      setInteraction(null);
    }
  };

  loadInteraction();
}, [api]);
```

#### Sending Messages

```typescript
const sendMessage = async () => {
  try {
    const interaction = await api.getInteraction();
    await api.sendChatMessage({
      interactionId: interaction.interactionId,
      text: "Hello from my element!",
    });
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};
```

### Important Notes

⚠️ **Security**: Elements run in a sandboxed environment. You cannot:

- Access `window.parent` directly
- Access the DOM outside your element
- Use `localStorage` or `sessionStorage` directly (use ElementAPI methods instead)

✅ **Use ElementAPI for**:

- All communication with the host application
- Accessing agent and interaction data
- Sending messages and making requests
- Listening to events

## Project Structure

```
my-element/
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts           # Vite build configuration
├── index.html               # Development test page
├── README.md                # This file
├── docs/                    # Documentation
│   ├── ElementApi.md        # Complete API reference
│   └── oauth-coordination-analysis.md  # OAuth implementation details
└── src/
    ├── Element.tsx          # Your React component
    ├── Element.module.css   # Element styles
    └── index.ts             # Web component registration
```

## Element Properties (Variables)

InfinityElements support **configurable properties** that administrators set in the Infinity Configuration UI. These properties are passed to your web component as [HTML attributes](https://html.spec.whatwg.org/multipage/syntax.html#attributes-2), which `r2wc` automatically converts to React props.

### How It Works

1. **Admin Configuration**: In the Configuration UI, administrators add name/value pairs to the element's "Properties" section
2. **Attribute Injection**: When your element loads, these properties become HTML attributes
3. **React Props**: The `r2wc` library automatically maps these attributes to your element's props

### Example

**Admin sets properties:**
| Name | Value |
|------|-------|
| `theme` | `dark` |
| `customer-name` | `John Doe` |

**Your element receives:**

```html
<my-element theme="dark" customer-name="John Doe"></my-element>
```

### Implementing Element Properties

**1. Define props in your React component:**

```typescript
// src/Element.tsx
interface ElementProps {
  theme?: string;
  customerName?: string;
  maxItems?: string; // Note: all values are strings
}

const Element: React.FC<ElementProps> = ({
  theme = "light",
  customerName,
  maxItems = "10",
}) => {
  const max = parseInt(maxItems, 10); // Convert to number if needed

  return (
    <div className={theme === "dark" ? styles.dark : styles.light}>
      {customerName && <h2>Welcome, {customerName}</h2>}
      {/* Your element content */}
    </div>
  );
};
```

**2. Register props in the web component wrapper:**

```typescript
// src/index.ts
import r2wc from "@r2wc/react-to-web-component";
import Element from "./Element";

const WebElement = r2wc(Element, React, ReactDOM, {
  props: {
    theme: "string",
    customerName: "string",
    maxItems: "string",
  },
});

customElements.define("my-element", WebElement);
```

### Important Notes

- ⚠️ **All values are strings**: HTML attributes are always strings; parse numbers/booleans in your element
- ⚠️ **Props must be declared**: Only props listed in the r2wc `props` object will be passed to React
- ✅ **Provide defaults**: Always set sensible defaults since properties are optional
- ✅ **Use kebab-case for HTML attributes**: r2wc [automatically converts](https://github.com/bitovi/react-to-web-component) between kebab-case HTML attributes (e.g., `customer-name`) and camelCase React props (e.g., `customerName`)

### Custom Element Naming Rules

The element name in `customElements.define("my-element", WebElement)` must follow the [W3C Custom Elements specification](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name):

| Rule                             | Valid                        | Invalid                       |
| -------------------------------- | ---------------------------- | ----------------------------- |
| Must contain a hyphen            | `my-element`, `user-profile` | `myelement`, `profile`        |
| Must start with lowercase letter | `my-element`                 | `1-element`, `-element`       |
| All lowercase                    | `my-element`                 | `My-Element`, `myElement`     |
| No reserved names                | `my-annotation`              | `annotation-xml`, `font-face` |

**Reserved names** (cannot be used): `annotation-xml`, `color-profile`, `font-face`, `font-face-src`, `font-face-uri`, `font-face-format`, `font-face-name`, `missing-glyph`

### Common Property Use Cases

| Property      | Example Use                                   |
| ------------- | --------------------------------------------- |
| `theme`       | Dark/light mode preference per element        |
| `locale`      | Language/region for internationalization      |
| `apiEndpoint` | Custom backend URL for different environments |
| `customerId`  | Pre-populate with customer context            |
| `debugMode`   | Enable verbose logging during development     |
| `maxResults`  | Configure result limits                       |

## Development Workflow

### 1. Start Development Server

```bash
infinity dev
```

This will:

- Start Vite dev server (usually on `http://localhost:5173`)
- Enable hot module replacement (HMR)
- Open your element in a browser
- Watch for file changes

### 2. Edit Your Element

Edit `src/Element.tsx` to build your element:

```typescript
import React from "react";
import { ElementAPI } from "@avaya/infinity-elements-api";
import styles from "./Element.module.css";

const Element: React.FC = () => {
  const [api] = React.useState(
    () =>
      new ElementAPI({
        elementId: "my-element",
        debug: true,
      })
  );

  // Your element logic here

  return (
    <div className={styles.container}>
      <h1>My InfinityElement</h1>
    </div>
  );
};

export default Element;
```

### 3. Add ElementAPI Integration

```typescript
import { ElementAPI } from "@avaya/infinity-elements-api";

// Initialize API
const api = new ElementAPI({
  elementId: "my-element",
  timeout: 5000,
  debug: true,
});

// Use API methods
const userInfo = await api.getUserInfo();
api.onInteractionAccepted((id) => {
  // Handle interaction
});
```

### 4. Test Your Element

- Test in the dev server environment
- Test within the actual agent UI
- Verify all API interactions work correctly
- Check event handling and cleanup

### 5. Style Your Element

Use CSS Modules for scoped styling:

```css
/* Element.module.css */
.container {
  padding: 1rem;
  background: white;
  border-radius: 4px;
}
```

## Building for Production

### Build Command

```bash
infinity build
```

This will:

- Compile TypeScript to JavaScript
- Bundle and optimize your code
- Generate production-ready files in `dist/`
- Create a single JavaScript bundle

### Build Output

After building, you'll find:

- `dist/index.js` - Your compiled web component
- `dist/index.d.ts` - TypeScript definitions (if needed)

### Production Checklist

- [ ] Test the built element in production environment
- [ ] Verify all API calls work correctly
- [ ] Check that event listeners are properly cleaned up
- [ ] Ensure no console errors or warnings
- [ ] Validate security (no direct DOM access)
- [ ] Test in different browsers
- [ ] Verify performance and bundle size

## Deployment

### 1. Build Your Element

```bash
infinity build
```

### 2. Package the Output

The `dist/` directory contains your production-ready element. You can:

- Upload to a CDN or static hosting
- Include in a package for distribution
- Deploy to your hosting environment

### 3. Create an InfinityElement in Configuration UI

Navigate to **Account → Infinity Elements** in the Infinity Configuration UI.

1. Click **New** to open the Create InfinityElement modal
2. Fill in the required fields:
   | Field | Description | Example |
   |-------|-------------|---------|
   | **Name** | Display name shown to users | `Customer Lookup` |
   | **File** | Your built element file (`.js` or `.cjs`) | `dist/index.cjs` |
   | **Tag Name** | The web component custom element name | `customer-lookup` |
   | **API Version** | Element API version compatibility | `1.0.0` |
   | **Icon** | (Optional) Neo icon class for display | `neo-icon-search` |

3. Click **Save** to create the element

After creation, you can:

- Click on the element to view/edit details
- Add **Properties** (key/value pairs) that will be passed as HTML attributes to your element
- Update the element file when deploying new versions

### 4. Assign to Users or Queues

InfinityElements can be assigned at two levels:

#### Assign to a User (App-Level Elements)

App-level elements appear in the agent's sidebar and persist across all interactions.

1. Navigate to **Account → Users**
2. Select the user and go to the **Infinity Elements** tab
3. Click **Edit** and use the dropdown to add elements
4. Click **Save**

The element will appear in the agent's left sidebar when they log in.

#### Assign to a Queue (Interaction-Level Elements)

Interaction-level elements appear when an agent handles an interaction from that queue.

**For Tabs (appear in interaction tab bar):**

1. Navigate to **Queues → [Queue Name] → Tabs**
2. Click **Edit** and use the dropdown to add elements
3. Click **Save**

**For Side Panels (appear in interaction side panel):**

1. Navigate to **Queues → [Queue Name] → Panels**
2. Click **Edit** and select elements to add
3. Click **Save**

The element will appear when agents handle interactions from that queue.

### 5. Test in Production

- Verify element loads correctly
- Test all API interactions
- Validate event handling
- Check error handling and edge cases

## Documentation

### API Reference

See `docs/ElementApi.md` for complete API documentation including:

- All ElementAPI methods
- Event callbacks and types
- Request/response formats
- Error handling
- Examples and use cases

### OAuth Authentication

See `docs/oauth-coordination-analysis.md` for details on:

- OAuth 2.0 PKCE flow implementation
- Cross-iframe coordination
- Token management
- Security considerations

## Common Tasks

### Getting User Information

```typescript
const userInfo = await api.getUserInfo();
console.log(userInfo.firstName, userInfo.lastName, userInfo.email);
```

### Listening to Interaction Events

```typescript
api.onInteractionAccepted((interactionId) => {
  // Handle new interaction
});

api.onInteractionEnded((interactionId) => {
  // Handle interaction end
});

api.onInteractionStatusChanged(({ interactionId, status }) => {
  // Handle status change
});
```

### Sending Chat Messages

```typescript
const interaction = await api.getInteraction();
await api.sendChatMessage({
  interactionId: interaction.interactionId,
  text: "Hello!",
});
```

### Managing Agent Status

```typescript
const userInfo = await api.getUserInfo();
await api.setAgentStatus(userInfo.userId, { id: "away", name: "Away", category: "away" }, {
  id: "lunch",
  name: "Lunch Break",
});
```

## Troubleshooting

### Element Not Loading

- Check browser console for errors
- Verify the element is properly registered
- Ensure all dependencies are installed
- Check that the build output is correct

### API Calls Failing

- Verify ElementAPI is initialized correctly
- Check that you're in a valid Infinity environment
- Enable debug mode: `new ElementAPI({ debug: true })`
- Check network requests in browser dev tools

### Events Not Firing

- Ensure event listeners are set up correctly
- Check that cleanup functions are called properly
- Verify you're subscribed to the correct events
- Test in the actual agent UI environment

### Build Errors

- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies are installed
- Check Vite configuration
- Review build output for warnings

## Next Steps

1. **Explore the API**: Check `docs/ElementApi.md` for all available methods
2. **Review Examples**: Look at sample elements in the framework
3. **Build Your Feature**: Start implementing your element logic
4. **Test Thoroughly**: Test in both dev and production environments
5. **Deploy**: Package and deploy your element

## Resources

- **API Documentation**: `docs/ElementApi.md`
- **OAuth Guide**: `docs/oauth-coordination-analysis.md`
- **Element API**: [`@avaya/infinity-elements-api`](https://www.npmjs.com/package/@avaya/infinity-elements-api)

## Support

For issues, questions, or contributions:

- Check the documentation in `docs/`
- Review sample elements
- Open an issue in the repository

Happy coding! 🚀
