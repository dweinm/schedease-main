// This script will help copy UI components and update their imports
const fs = require('fs');
const path = require('path');

const sourceDir = './components/ui';
const targetDir = './frontend/src/components/ui';

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// List of UI component files to copy
const uiComponents = [
  'input.tsx', 'card.tsx', 'label.tsx', 'alert.tsx', 'accordion.tsx',
  'alert-dialog.tsx', 'aspect-ratio.tsx', 'avatar.tsx', 'badge.tsx',
  'breadcrumb.tsx', 'calendar.tsx', 'carousel.tsx', 'chart.tsx',
  'checkbox.tsx', 'collapsible.tsx', 'command.tsx', 'context-menu.tsx',
  'dialog.tsx', 'drawer.tsx', 'dropdown-menu.tsx', 'form.tsx',
  'hover-card.tsx', 'input-otp.tsx', 'menubar.tsx', 'navigation-menu.tsx',
  'pagination.tsx', 'popover.tsx', 'progress.tsx', 'radio-group.tsx',
  'resizable.tsx', 'scroll-area.tsx', 'select.tsx', 'separator.tsx',
  'sheet.tsx', 'sidebar.tsx', 'skeleton.tsx', 'slider.tsx', 'sonner.tsx',
  'switch.tsx', 'table.tsx', 'tabs.tsx', 'textarea.tsx', 'toggle-group.tsx',
  'toggle.tsx', 'tooltip.tsx', 'use-mobile.ts'
];

uiComponents.forEach(componentFile => {
  const sourcePath = path.join(sourceDir, componentFile);
  const targetPath = path.join(targetDir, componentFile);
  
  if (fs.existsSync(sourcePath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Update import paths
    content = content.replace(/from "\.\/utils"/g, 'from "@/lib/utils"');
    content = content.replace(/from "\.\/use-mobile"/g, 'from "./ui/use-mobile"');
    content = content.replace(/from "\.\/button"/g, 'from "./ui/button"');
    content = content.replace(/from "\.\/input"/g, 'from "./ui/input"');
    content = content.replace(/from "\.\/label"/g, 'from "./ui/label"');
    content = content.replace(/from "\.\/popover"/g, 'from "./ui/popover"');
    content = content.replace(/from "\.\/command"/g, 'from "./ui/command"');
    content = content.replace(/from "\.\/separator"/g, 'from "./ui/separator"');
    content = content.replace(/from "\.\/dialog"/g, 'from "./ui/dialog"');
    content = content.replace(/from "\.\/drawer"/g, 'from "./ui/drawer"');
    content = content.replace(/from "\.\/scroll-area"/g, 'from "./ui/scroll-area"');
    content = content.replace(/from "\.\/calendar"/g, 'from "./ui/calendar"');
    content = content.replace(/from "\.\/form"/g, 'from "./ui/form"');
    content = content.replace(/from "\.\/checkbox"/g, 'from "./ui/checkbox"');
    content = content.replace(/from "\.\/radio-group"/g, 'from "./ui/radio-group"');
    content = content.replace(/from "\.\/select"/g, 'from "./ui/select"');
    content = content.replace(/from "\.\/switch"/g, 'from "./ui/switch"');
    content = content.replace(/from "\.\/textarea"/g, 'from "./ui/textarea"');
    content = content.replace(/from "\.\/tooltip"/g, 'from "./ui/tooltip"');
    content = content.replace(/from "\.\/toggle"/g, 'from "./ui/toggle"');
    content = content.replace(/from "\.\/aspect-ratio"/g, 'from "./ui/aspect-ratio"');
    content = content.replace(/from "\.\/badge"/g, 'from "./ui/badge"');
    content = content.replace(/from "\.\/avatar"/g, 'from "./ui/avatar"');
    content = content.replace(/from "\.\/skeleton"/g, 'from "./ui/skeleton"');
    content = content.replace(/from "\.\/sheet"/g, 'from "./ui/sheet"');
    content = content.replace(/from "\.\/tabs"/g, 'from "./ui/tabs"');
    content = content.replace(/from "\.\/card"/g, 'from "./ui/card"');
    content = content.replace(/from "\.\/table"/g, 'from "./ui/table"');
    content = content.replace(/from "\.\/resizable"/g, 'from "./ui/resizable"');
    content = content.replace(/from "\.\/sidebar"/g, 'from "./ui/sidebar"');
    
    // Remove version specifiers from Radix imports  
    content = content.replace(/@radix-ui\/react-[^@"]+@[\d.]+/g, (match) => {
      return match.replace(/@[\d.]+$/, '');
    });
    
    fs.writeFileSync(targetPath, content);
    console.log(`Copied ${componentFile}`);
  }
});

console.log('UI components copied successfully!');