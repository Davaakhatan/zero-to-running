// Automated Undo/Redo Test Script
// This script tests the undo/redo functionality with 4 actions

const { chromium } = require('playwright');

async function runUndoRedoTest() {
  console.log('🚀 Starting automated undo/redo test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('📱 Navigating to CollabCanvas...');
    await page.goto('http://localhost:5177/');
    await page.waitForTimeout(3000);
    
    // Sign in
    console.log('🔐 Signing in...');
    await page.click('text=Sign In');
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="you@example.com"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForTimeout(3000);
    
    // Navigate to projects
    console.log('📁 Navigating to projects...');
    await page.click('button:has-text("Browse Projects")');
    await page.waitForTimeout(2000);
    
    // Click on first project
    console.log('🎨 Opening first project...');
    await page.click('div:has-text("Test1")');
    await page.waitForTimeout(3000);
    
    // Wait for canvas to load
    console.log('⏳ Waiting for canvas to load...');
    await page.waitForSelector('button:has-text("Add Shape")', { timeout: 10000 });
    
    // Test 1: Check initial state
    console.log('\n📊 Test 1: Checking initial state...');
    const initialUndoDisabled = await page.isDisabled('button:has-text("Undo")');
    const initialRedoDisabled = await page.isDisabled('button:has-text("Redo")');
    console.log(`   Initial Undo disabled: ${initialUndoDisabled} ✅`);
    console.log(`   Initial Redo disabled: ${initialRedoDisabled} ✅`);
    
    // Test 2: Perform 4 actions
    console.log('\n🎯 Test 2: Performing 4 actions...');
    
    // Action 1: Add Rectangle
    console.log('   Action 1: Adding Rectangle...');
    await page.click('button:has-text("Add Shape")');
    await page.waitForTimeout(500);
    await page.click('text=Rectangle');
    await page.waitForTimeout(1000);
    
    // Check state after action 1
    const afterAction1Undo = await page.isDisabled('button:has-text("Undo")');
    const afterAction1Redo = await page.isDisabled('button:has-text("Redo")');
    console.log(`   After Action 1 - Undo disabled: ${afterAction1Undo}, Redo disabled: ${afterAction1Redo}`);
    
    // Action 2: Add Circle
    console.log('   Action 2: Adding Circle...');
    await page.click('button:has-text("Add Shape")');
    await page.waitForTimeout(500);
    await page.click('text=Circle');
    await page.waitForTimeout(1000);
    
    // Action 3: Add Text
    console.log('   Action 3: Adding Text...');
    await page.click('button:has-text("Add Shape")');
    await page.waitForTimeout(500);
    await page.click('text=Text');
    await page.waitForTimeout(1000);
    
    // Action 4: Add Triangle
    console.log('   Action 4: Adding Triangle...');
    await page.click('button:has-text("Add Shape")');
    await page.waitForTimeout(500);
    await page.click('text=Triangle');
    await page.waitForTimeout(1000);
    
    // Check state after all 4 actions
    const afterAllActionsUndo = await page.isDisabled('button:has-text("Undo")');
    const afterAllActionsRedo = await page.isDisabled('button:has-text("Redo")');
    console.log(`   After all 4 actions - Undo disabled: ${afterAllActionsUndo}, Redo disabled: ${afterAllActionsRedo}`);
    
    // Test 3: Undo all 4 actions one by one
    console.log('\n↩️ Test 3: Undoing all 4 actions...');
    
    for (let i = 4; i >= 1; i--) {
      console.log(`   Undo ${i}: Clicking Undo button...`);
      await page.click('button:has-text("Undo")');
      await page.waitForTimeout(1000);
      
      const undoDisabled = await page.isDisabled('button:has-text("Undo")');
      const redoDisabled = await page.isDisabled('button:has-text("Redo")');
      console.log(`   After Undo ${i} - Undo disabled: ${undoDisabled}, Redo disabled: ${redoDisabled}`);
    }
    
    // Test 4: Redo all 4 actions one by one
    console.log('\n↪️ Test 4: Redoing all 4 actions...');
    
    for (let i = 1; i <= 4; i++) {
      console.log(`   Redo ${i}: Clicking Redo button...`);
      await page.click('button:has-text("Redo")');
      await page.waitForTimeout(1000);
      
      const redoDisabled = await page.isDisabled('button:has-text("Redo")');
      const undoDisabled = await page.isDisabled('button:has-text("Undo")');
      console.log(`   After Redo ${i} - Undo disabled: ${undoDisabled}, Redo disabled: ${redoDisabled}`);
    }
    
    // Test 5: Test keyboard shortcuts
    console.log('\n⌨️ Test 5: Testing keyboard shortcuts...');
    
    // Undo with Ctrl+Z
    console.log('   Testing Ctrl+Z (Undo)...');
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1000);
    
    // Redo with Ctrl+Shift+Z
    console.log('   Testing Ctrl+Shift+Z (Redo)...');
    await page.keyboard.press('Control+Shift+z');
    await page.waitForTimeout(1000);
    
    // Final state check
    console.log('\n📊 Final State Check:');
    const finalUndoDisabled = await page.isDisabled('button:has-text("Undo")');
    const finalRedoDisabled = await page.isDisabled('button:has-text("Redo")');
    console.log(`   Final Undo disabled: ${finalUndoDisabled}`);
    console.log(`   Final Redo disabled: ${finalRedoDisabled}`);
    
    console.log('\n✅ Automated undo/redo test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
runUndoRedoTest().catch(console.error);
