import { app, BrowserWindow } from 'electron';
import * as path from 'path';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.disableHardwareAcceleration();
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    console.log(`    ✓ ${message}`);
  }
}

async function runLayoutVerification() {
  console.log('====================================================');
  console.log(' NEXUS Settings & SidePanel Layout Verification Suite');
  console.log('====================================================\n');

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      sandbox: false,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  const htmlPath = path.join(__dirname, '../dist/renderer/index.html');
  await win.loadFile(htmlPath);

  // 1. Verify Universal Layout & Typography Utilities in Rendered DOM
  console.log('[SUITE 1: UNIVERSAL LAYOUT & UTILITIES INTEGRITY]');
  const utilCheck = await win.webContents.executeJavaScript(`
    (() => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between gap-2 text-xs text-primary';
      document.body.appendChild(div);
      const s = getComputedStyle(div);
      const res = {
        display: s.display,
        alignItems: s.alignItems,
        justifyContent: s.justifyContent,
        gap: s.gap,
        fontSize: s.fontSize,
      };
      document.body.removeChild(div);
      return res;
    })()
  `);
  assert(utilCheck.display === 'flex', 'Utility .flex computed display is flex');
  assert(utilCheck.alignItems === 'center', 'Utility .items-center computed alignItems is center');
  assert(utilCheck.justifyContent === 'space-between', 'Utility .justify-between computed is space-between');
  assert(utilCheck.gap === '8px', `Utility .gap-2 computed is 8px (got ${utilCheck.gap})`);
  assert(utilCheck.fontSize === '12px', `Utility .text-xs computed is 12px (got ${utilCheck.fontSize})`);

  // 2. Verify Right-Side Settings Panel Styles
  console.log('\n[SUITE 2: RIGHT-SIDE SETTINGS PANEL ARCHITECTURE]');
  const panelStyles = await win.webContents.executeJavaScript(`
    (() => {
      const container = document.createElement('div');
      container.className = 'nexus-side-panel';
      container.style.width = '310px';

      const body = document.createElement('div');
      body.className = 'side-panel-body settings-section';

      const wsCard = document.createElement('div');
      wsCard.className = 'settings-full-workspace-card settings-panel-workspace-card';

      const wsActions = document.createElement('div');
      wsActions.className = 'settings-panel-workspace-actions';

      const btn1 = document.createElement('button');
      btn1.className = 'settings-panel-action-btn settings-panel-btn-primary';
      btn1.textContent = 'All Settings';

      const btn2 = document.createElement('button');
      btn2.className = 'settings-panel-action-btn settings-panel-btn-privacy';
      btn2.textContent = 'Privacy Center';

      wsActions.appendChild(btn1);
      wsActions.appendChild(btn2);
      wsCard.appendChild(wsActions);

      const toggleRow = document.createElement('div');
      toggleRow.className = 'settings-panel-toggle-row';

      const toggleLabel = document.createElement('span');
      toggleLabel.className = 'settings-panel-toggle-label';
      toggleLabel.textContent = 'Always show bookmarks bar';

      const toggle = document.createElement('label');
      toggle.className = 'toggle-switch';
      const toggleInput = document.createElement('input');
      toggleInput.type = 'checkbox';
      const toggleSlider = document.createElement('span');
      toggleSlider.className = 'toggle-slider';
      toggle.appendChild(toggleInput);
      toggle.appendChild(toggleSlider);

      toggleRow.appendChild(toggleLabel);
      toggleRow.appendChild(toggle);

      const sel = document.createElement('select');
      sel.className = 'setting-select';

      body.appendChild(wsCard);
      body.appendChild(toggleRow);
      body.appendChild(sel);
      container.appendChild(body);
      document.body.appendChild(container);

      const wsCardStyle = getComputedStyle(wsCard);
      const wsActionsStyle = getComputedStyle(wsActions);
      const btn1Style = getComputedStyle(btn1);
      const btn2Style = getComputedStyle(btn2);
      const toggleRowStyle = getComputedStyle(toggleRow);
      const selStyle = getComputedStyle(sel);

      const res = {
        wsCardDisplay: wsCardStyle.display,
        wsCardPadding: wsCardStyle.padding,
        wsActionsDisplay: wsActionsStyle.display,
        wsActionsColumns: wsActionsStyle.gridTemplateColumns,
        btn1Display: btn1Style.display,
        btn1Color: btn1Style.color,
        btn2Color: btn2Style.color,
        toggleRowDisplay: toggleRowStyle.display,
        toggleRowJustify: toggleRowStyle.justifyContent,
        selDisplay: selStyle.display,
        selBorderRadius: selStyle.borderRadius,
      };

      document.body.removeChild(container);
      return res;
    })()
  `);
  assert(panelStyles.wsCardDisplay === 'flex', 'Workspace card has display: flex');
  assert(panelStyles.wsActionsDisplay === 'grid', 'Workspace actions container has 2-column grid');
  assert(panelStyles.btn1Display === 'flex', 'All Settings button has display: flex');
  assert(panelStyles.toggleRowDisplay === 'flex', 'Toggle row has display: flex');
  assert(panelStyles.selBorderRadius === '3px' || panelStyles.selBorderRadius === '4px', 'Select control has canonical radius');

  // 3. Verify Mode Cards Layout & Details Block
  console.log('\n[SUITE 3: MODE CARDS STRUCTURE & WRAPPING]');
  const modeCardStyles = await win.webContents.executeJavaScript(`
    (() => {
      const group = document.createElement('div');
      group.className = 'modes-settings-group';

      const card = document.createElement('div');
      card.className = 'mode-card mode-card-default active';

      const detailsBlock = document.createElement('div');
      detailsBlock.className = 'mode-details-block';

      const item = document.createElement('div');
      item.className = 'mode-detail-item';

      const tag = document.createElement('span');
      tag.className = 'mode-detail-tag';
      tag.textContent = 'Visual:';

      const text = document.createElement('span');
      text.className = 'mode-detail-text';
      text.textContent = 'Dark surfaces, fluid 150ms transitions, full backdrop blur and glowing accents.';

      item.appendChild(tag);
      item.appendChild(text);
      detailsBlock.appendChild(item);
      card.appendChild(detailsBlock);
      group.appendChild(card);
      document.body.appendChild(group);

      const cardStyle = getComputedStyle(card);
      const detailsStyle = getComputedStyle(detailsBlock);
      const itemStyle = getComputedStyle(item);
      const tagStyle = getComputedStyle(tag);

      const res = {
        cardDisplay: cardStyle.display,
        cardBorderRadius: cardStyle.borderRadius,
        detailsDisplay: detailsStyle.display,
        itemDisplay: itemStyle.display,
        tagFontWeight: tagStyle.fontWeight,
      };

      document.body.removeChild(group);
      return res;
    })()
  `);
  assert(modeCardStyles.cardDisplay === 'flex', 'Mode card has display: flex');
  assert(modeCardStyles.detailsDisplay === 'flex', 'Mode details block has display: flex');
  assert(modeCardStyles.itemDisplay === 'block', 'Mode detail item has display: block for fluid paragraph wrapping');
  assert(Number(modeCardStyles.tagFontWeight) >= 600, 'Mode detail tag is bold (weight >= 600)');

  // 4. Verify Main Settings Page Layout (Rail, Rows, Radios)
  console.log('\n[SUITE 4: MAIN SETTINGS PAGE DOM & STYLING]');
  const settingsPageStyles = await win.webContents.executeJavaScript(`
    (() => {
      const container = document.createElement('div');
      container.className = 'settings-workspace-container';

      const wrap = document.createElement('div');
      wrap.className = 'settings-content-wrap';

      const header = document.createElement('div');
      header.className = 'settings-header';

      const layout = document.createElement('div');
      layout.className = 'settings-body-layout';

      const rail = document.createElement('nav');
      rail.className = 'settings-nav-rail';

      const navBtn = document.createElement('button');
      navBtn.className = 'settings-nav-btn active';

      const btnContent = document.createElement('div');
      btnContent.className = 'settings-nav-btn-content';
      const label = document.createElement('span');
      label.textContent = 'Privacy & Security';
      btnContent.appendChild(label);

      const badge = document.createElement('span');
      badge.className = 'settings-nav-badge';
      badge.textContent = 'Audit';

      navBtn.appendChild(btnContent);
      navBtn.appendChild(badge);
      rail.appendChild(navBtn);

      const content = document.createElement('main');
      content.className = 'settings-content-area';

      const row = document.createElement('div');
      row.className = 'settings-row';

      const labelGroup = document.createElement('div');
      labelGroup.className = 'settings-row-label-group';

      const control = document.createElement('div');
      control.className = 'settings-row-control';

      row.appendChild(labelGroup);
      row.appendChild(control);

      const radioGroup = document.createElement('div');
      radioGroup.className = 'settings-radio-group';

      const radioLabel = document.createElement('label');
      radioLabel.className = 'settings-radio-label';

      const radioInput = document.createElement('input');
      radioInput.type = 'radio';
      radioInput.className = 'settings-radio-input';
      radioInput.checked = true;

      radioLabel.appendChild(radioInput);
      radioGroup.appendChild(radioLabel);

      const chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'nexus-checkbox';
      chk.checked = true;

      content.appendChild(row);
      content.appendChild(radioGroup);
      content.appendChild(chk);

      layout.appendChild(rail);
      layout.appendChild(content);
      wrap.appendChild(header);
      wrap.appendChild(layout);
      container.appendChild(wrap);
      document.body.appendChild(container);

      const layoutStyle = getComputedStyle(layout);
      const navBtnStyle = getComputedStyle(navBtn);
      const btnContentStyle = getComputedStyle(btnContent);
      const labelGroupStyle = getComputedStyle(labelGroup);
      const controlStyle = getComputedStyle(control);
      const radioInputStyle = getComputedStyle(radioInput);
      const chkStyle = getComputedStyle(chk);

      const res = {
        layoutDisplay: layoutStyle.display,
        layoutGridColumns: layoutStyle.gridTemplateColumns,
        navBtnDisplay: navBtnStyle.display,
        navBtnJustify: navBtnStyle.justifyContent,
        navBtnGap: navBtnStyle.gap,
        btnContentMinW: btnContentStyle.minWidth,
        labelGroupFlex: labelGroupStyle.flex,
        controlJustify: controlStyle.justifyContent,
        controlShrink: controlStyle.flexShrink,
        radioInputAppearance: radioInputStyle.appearance || radioInputStyle.webkitAppearance,
        radioInputBorderRadius: radioInputStyle.borderRadius,
        chkAppearance: chkStyle.appearance || chkStyle.webkitAppearance,
        chkBorderRadius: chkStyle.borderRadius,
      };

      document.body.removeChild(container);
      return res;
    })()
  `);
  assert(settingsPageStyles.layoutDisplay === 'grid', 'Settings body layout uses 2-pane CSS Grid');
  assert(settingsPageStyles.navBtnDisplay === 'flex', 'Nav button uses display: flex');
  assert(settingsPageStyles.navBtnJustify === 'space-between', 'Nav button spaces content and badge');
  assert(settingsPageStyles.navBtnGap === '8px', 'Nav button enforces 8px gap');
  assert(settingsPageStyles.btnContentMinW === '0px', 'Nav button content has min-width: 0 to prevent overflow');
  assert(settingsPageStyles.controlShrink === '0', 'Row control has flex-shrink: 0 to prevent squishing');
  assert(settingsPageStyles.controlJustify === 'flex-end', 'Row control is neatly right-aligned');
  assert(settingsPageStyles.radioInputAppearance === 'none', 'Radio input uses custom non-native styling');
  assert(settingsPageStyles.radioInputBorderRadius === '50%', 'Radio input is circular');
  assert(settingsPageStyles.chkAppearance === 'none', 'Checkbox input uses custom non-native styling');
  assert(settingsPageStyles.chkBorderRadius === '3px' || settingsPageStyles.chkBorderRadius === '4px', 'Checkbox input has canonical border radius');

  console.log('\n====================================================');
  console.log('  🎉 ALL SETTINGS & SIDEPANEL LAYOUT CHECKS PASSED! ');
  console.log('====================================================\n');
  app.quit();
}

app.whenReady().then(runLayoutVerification).catch((err) => {
  console.error(err);
  process.exit(1);
});
